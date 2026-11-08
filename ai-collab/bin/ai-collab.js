#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const readline = require('node:readline/promises');
const { getBackend } = require('../src/backends');
const { runDebate, toMarkdown } = require('../src/debate');

const HELP = `ai-collab — make Claude and ChatGPT debate until they agree.

Usage:
  ai-collab [options] "Should I buy out my car lease or lease a new one?"

Options:
  -a, --a <backend>        Debater A (default: claude)
  -b, --b <backend>        Debater B (default: codex)
  -m, --mediator <backend> Mediator (default: claude)
  -r, --rounds <n>         Max debate rounds (default: 4)
      --no-clarify         Skip the clarifying-questions phase
  -o, --out <dir>          Where to save the transcript (default: ./ai-collab-runs)
  -h, --help

Backends: claude (Claude Code CLI), codex (OpenAI Codex CLI), mock (offline test)
Both CLIs must be installed and logged in with your Claude / ChatGPT subscription.`;

function parseArgs(argv) {
  const o = { a: 'claude', b: 'codex', mediator: 'claude', rounds: 4, clarify: true, out: 'ai-collab-runs', q: [] };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    const v = () => argv[++i];
    if (k === '-h' || k === '--help') o.help = true;
    else if (k === '-a' || k === '--a') o.a = v();
    else if (k === '-b' || k === '--b') o.b = v();
    else if (k === '-m' || k === '--mediator') o.mediator = v();
    else if (k === '-r' || k === '--rounds') o.rounds = Math.max(1, parseInt(v(), 10) || 4);
    else if (k === '--no-clarify') o.clarify = false;
    else if (k === '-o' || k === '--out') o.out = v();
    else o.q.push(k);
  }
  o.question = o.q.join(' ').trim();
  return o;
}

const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const bold = c('1'), dim = c('2'), cyan = c('36'), magenta = c('35'), yellow = c('33'), green = c('32');

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) return console.log(HELP);

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    if (!opts.question) opts.question = (await rl.question(bold('Your question: '))).trim();
    if (!opts.question) return console.log(HELP);

    const debaterA = getBackend(opts.a === 'mock' ? 'mock:Debater-A' : opts.a);
    const debaterB = getBackend(opts.b === 'mock' ? 'mock:Debater-B' : opts.b);
    const mediator = getBackend(opts.mediator === 'mock' ? 'mock:Mediator' : opts.mediator);

    const askUser = opts.clarify && process.stdin.isTTY
      ? async (qs) => {
          console.log(bold('\nA few questions first (press Enter to skip any):'));
          const out = [];
          for (const q of qs) out.push((await rl.question(`  ${yellow('?')} ${q}\n    > `)).trim());
          return out;
        }
      : undefined;

    const colorFor = (name) => (name.includes('Debater A') ? cyan : magenta);
    const result = await runDebate({
      question: opts.question, mediator, debaterA, debaterB, askUser, maxRounds: opts.rounds,
      onEvent: (e) => {
        if (e.type === 'phase') console.log(dim(`\n▸ ${e.name}…`));
        if (e.type === 'roles') {
          console.log(bold(`\nTrade-off: ${e.framing}`));
          for (const s of e.sides) console.log(`  ${colorFor(s.name)(s.name)}: ${s.position}`);
        }
        if (e.type === 'turn') {
          console.log(`\n${bold(colorFor(e.speaker)(e.speaker))}\n${e.text}`);
          if (e.meta?.current_position) {
            const tag = e.meta.agrees_with_opponent ? green('✓ agrees') : yellow('✗ objects');
            console.log(dim(`  [${tag}${dim('] position: ' + e.meta.current_position)}`));
          }
        }
        if (e.type === 'nudge') console.log(`\n${bold(yellow('Mediator'))}: ${e.text}`);
      },
    });

    console.log(`\n${bold('═'.repeat(60))}\n${bold(result.consensus ? green('CONSENSUS') : yellow('NO FULL CONSENSUS'))}\n`);
    console.log(result.synthesis);

    fs.mkdirSync(opts.out, { recursive: true });
    const file = path.join(opts.out, `${new Date().toISOString().replace(/[:.]/g, '-')}.md`);
    fs.writeFileSync(file, toMarkdown(result));
    console.log(dim(`\nTranscript saved to ${file}`));
  } finally {
    rl.close();
  }
}

main().catch((e) => {
  console.error(`\nError: ${e.message}`);
  process.exit(1);
});
