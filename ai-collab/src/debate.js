'use strict';
// Debate orchestration: clarify -> assign roles -> turn-based debate -> synthesize.

function extractJson(text) {
  const fenced = [...text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g)].map((m) => m[1]);
  const candidates = fenced.length ? fenced.reverse() : [];
  const brace = text.lastIndexOf('{');
  if (brace !== -1) candidates.push(text.slice(text.lastIndexOf('{', brace)));
  for (const c of candidates) {
    try {
      return JSON.parse(c.trim());
    } catch {}
  }
  // Last resort: largest {...} span.
  const m = text.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      return JSON.parse(m[0]);
    } catch {}
  }
  return null;
}

function stripJson(text) {
  return text.replace(/```(?:json)?\s*[\s\S]*?```/g, '').trim();
}

function formatContext(question, answers) {
  const lines = [`QUESTION: ${question}`];
  if (answers.length) {
    lines.push('', 'USER CONTEXT:');
    for (const { q, a } of answers) lines.push(`- ${q} -> ${a || '(no answer)'}`);
  }
  return lines.join('\n');
}

function formatTranscript(turns) {
  return turns
    .map((t) => `--- ${t.speaker} (round ${t.round}) ---\n${t.text}`)
    .join('\n\n');
}

const prompts = {
  clarify: (question) => `[TASK:CLARIFY]
You are the mediator of a structured debate between two AI models.
A user asked the question below. Before the debate starts, identify the ambiguities
that would most change the answer (priorities, budget, timeline, constraints, risk tolerance).
Return at most 4 short questions. If the question is already unambiguous, return an empty list.

QUESTION: ${question}

Respond ONLY with a JSON code block: {"questions": ["..."]}`,

  assign: (ctx) => `[TASK:ASSIGN]
You are the mediator of a structured debate between two AI models (Debater A and Debater B).
To stop them agreeing too early or talking in circles, assign them genuinely opposing,
defensible positions on the user's decision.

${ctx}

Respond ONLY with a JSON code block:
{"framing": "one-sentence statement of the core trade-off",
 "position_a": "the position Debater A must argue",
 "position_b": "the opposing position Debater B must argue"}`,

  turn: ({ ctx, me, opponent, position, framing, transcript, nudge, round, maxRounds }) => `[TASK:DEBATE]
You are ${me}, debating ${opponent} to help a user make a high-stakes decision.
Core trade-off: ${framing}
Your assigned starting position: ${position}

${ctx}

Rules:
- Make your strongest case, but argue in good faith: the goal is the best answer for THIS user.
- Directly answer the opponent's latest objections. Pressure-test their numbers and assumptions;
  show your arithmetic when numbers matter.
- Concede points that are correct. Change your position if the evidence warrants it.
- Only set "agrees_with_opponent" to true when you would sign a single joint recommendation now.
- Be concise (under 300 words). This is round ${round} of at most ${maxRounds}.
${nudge ? `\nMEDIATOR NOTE: ${nudge}\n` : ''}
DEBATE SO FAR:
${transcript || '(you open the debate)'}

Write your argument, then end with a JSON code block:
{"current_position": "one line", "agrees_with_opponent": true|false, "remaining_objections": ["..."]}`,

  nudge: ({ ctx, framing, transcript }) => `[TASK:NUDGE]
You are the mediator. The debate below has stalled: the same objections keep recurring.
Write a 1-3 sentence intervention that moves it forward, e.g. ask both sides to quantify
the disputed assumption, name what evidence would change their mind, or propose a conditional
recommendation ("if X then A, else B").

Core trade-off: ${framing}
${ctx}

DEBATE SO FAR:
${transcript}

Respond with the intervention text only.`,

  synthesize: ({ ctx, framing, transcript, consensus }) => `[TASK:SYNTHESIZE]
You are the mediator. Compile the final answer for the user from the debate below.
${consensus ? 'The debaters reached consensus.' : 'The debaters did NOT fully converge; say so and give the best conditional recommendation.'}

Core trade-off: ${framing}
${ctx}

DEBATE:
${transcript}

Write in Markdown with these sections:
## Recommendation   (one clear answer, or a clear if/then)
## Why              (the arguments that survived pressure-testing)
## Trade-offs       (what the user gives up)
## Assumptions to verify  (facts the user should check before acting)
## Where the AIs disagreed (if anywhere)`,
};

function objectionKey(meta) {
  return (meta?.remaining_objections || [])
    .map((o) => String(o).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim())
    .sort()
    .join('|');
}

/**
 * Run a full debate.
 * @param {object} o
 * @param {string} o.question
 * @param {{ask:Function,label:string}} o.mediator
 * @param {{ask:Function,label:string}} o.debaterA
 * @param {{ask:Function,label:string}} o.debaterB
 * @param {(questions:string[]) => Promise<string[]>} [o.askUser] returns answers; omit to skip clarification
 * @param {number} [o.maxRounds=4] one round = A speaks then B speaks
 * @param {(event:object) => void} [o.onEvent]
 */
async function runDebate({ question, mediator, debaterA, debaterB, askUser, maxRounds = 4, onEvent = () => {} }) {
  const answers = [];

  // 1. Clarification
  if (askUser) {
    onEvent({ type: 'phase', name: 'Clarifying the question' });
    const res = extractJson(await mediator.ask(prompts.clarify(question)));
    const qs = (res?.questions || []).slice(0, 4);
    if (qs.length) {
      const replies = await askUser(qs);
      qs.forEach((q, i) => answers.push({ q, a: replies[i] }));
    }
  }
  const ctx = formatContext(question, answers);

  // 2. Role assignment
  onEvent({ type: 'phase', name: 'Mediator assigning opposing positions' });
  const roles = extractJson(await mediator.ask(prompts.assign(ctx))) || {};
  const framing = roles.framing || question;
  const sides = [
    { b: debaterA, name: `${debaterA.label} (Debater A)`, position: roles.position_a || 'Argue for acting.' },
    { b: debaterB, name: `${debaterB.label} (Debater B)`, position: roles.position_b || 'Argue against acting.' },
  ];
  onEvent({ type: 'roles', framing, sides: sides.map((s) => ({ name: s.name, position: s.position })) });

  // 3. Debate loop
  const turns = [];
  const lastMeta = [null, null];
  let consensus = false;
  let nudge = null;
  let staleRounds = 0;
  let prevKey = null;

  for (let round = 1; round <= maxRounds && !consensus; round++) {
    onEvent({ type: 'phase', name: `Round ${round}` });
    for (let i = 0; i < 2; i++) {
      const me = sides[i];
      const opp = sides[1 - i];
      const raw = await me.b.ask(
        prompts.turn({
          ctx, framing, round, maxRounds, nudge,
          me: me.name, opponent: opp.name, position: me.position,
          transcript: formatTranscript(turns),
        })
      );
      const meta = extractJson(raw) || {};
      lastMeta[i] = meta;
      const turn = { speaker: me.name, round, text: stripJson(raw), meta };
      turns.push(turn);
      onEvent({ type: 'turn', ...turn });

      if (lastMeta[0]?.agrees_with_opponent && lastMeta[1]?.agrees_with_opponent) {
        consensus = true;
        break;
      }
    }
    nudge = null;
    if (consensus) break;

    // Stall detection: same open objections two rounds running -> mediator intervenes.
    const key = objectionKey(lastMeta[0]) + '#' + objectionKey(lastMeta[1]);
    staleRounds = key === prevKey ? staleRounds + 1 : 0;
    prevKey = key;
    if (staleRounds >= 1 && round < maxRounds) {
      nudge = (await mediator.ask(prompts.nudge({ ctx, framing, transcript: formatTranscript(turns) }))).trim();
      onEvent({ type: 'nudge', text: nudge });
      turns.push({ speaker: 'Mediator', round, text: nudge, meta: {} });
      staleRounds = 0;
    }
  }

  // 4. Synthesis
  onEvent({ type: 'phase', name: consensus ? 'Consensus reached — synthesizing' : 'Round limit reached — synthesizing' });
  const synthesis = await mediator.ask(
    prompts.synthesize({ ctx, framing, consensus, transcript: formatTranscript(turns) })
  );

  return { question, answers, framing, sides, turns, consensus, synthesis: synthesis.trim() };
}

function toMarkdown(r) {
  const out = [`# AI Collab: ${r.question}`, ''];
  if (r.answers.length) {
    out.push('## Your context');
    for (const { q, a } of r.answers) out.push(`- **${q}** ${a || '_(no answer)_'}`);
    out.push('');
  }
  out.push('## Opening positions', `_Trade-off: ${r.framing}_`, '');
  for (const s of r.sides) out.push(`- **${s.name}:** ${s.position}`);
  out.push('', `## Debate (${r.consensus ? 'consensus reached' : 'no full consensus'})`, '');
  for (const t of r.turns) {
    out.push(`### ${t.speaker} — round ${t.round}`, '', t.text, '');
    if (t.meta?.current_position) out.push(`> Position: ${t.meta.current_position}`, '');
  }
  out.push('---', '', '# Final answer', '', r.synthesis, '');
  return out.join('\n');
}

module.exports = { runDebate, toMarkdown, extractJson, prompts };
