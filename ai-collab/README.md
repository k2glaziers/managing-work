# AI Collab

Ask a hard question once. Claude and ChatGPT argue about it until they agree, and you get one recommendation with the trade-offs spelled out.

It runs through the **Claude Code** and **OpenAI Codex** command-line tools, which use your existing Claude and ChatGPT subscriptions. There are no API keys and no per-token bills.

## How it works

1. **Clarify**: the mediator asks up to 4 questions about your priorities, budget and timeline. Press Enter to skip any of them.
2. **Assign sides**: the mediator gives Debater A (Claude) and Debater B (ChatGPT) opposing positions. Without this, the two models tend to agree straight away.
3. **Debate**: the debaters take turns. Each one answers the other's objections, checks the numbers and states whether it now agrees. If the same objections come up two rounds in a row, the mediator steps in.
4. **Synthesize**: the debate ends when both sides agree or the round limit is reached. The mediator then writes up the recommendation, why it holds, the trade-offs, the assumptions you should check and any points still in dispute.

Each run is saved as a Markdown transcript in `./ai-collab-runs/`.

## Setup

```bash
npm install -g @anthropic-ai/claude-code   # then run `claude` once and log in with your Claude plan
npm install -g @openai/codex               # then run `codex` once and sign in with ChatGPT
cd ai-collab && npm link                   # optional: puts `ai-collab` on your PATH
```

Requires Node 18 or later. It has no dependencies.

## Usage

```bash
ai-collab "Should I buy out my car lease or lease a new one?"
ai-collab -r 6 "Monolith or microservices for a 4-person startup?"
ai-collab -a codex -b claude "Take the job offer or stay?"   # swap sides
ai-collab -m codex --no-clarify "..."                         # ChatGPT mediates, skip questions
npm run demo                                                  # offline run with mock models
npm test
```

| Option | Default | |
|---|---|---|
| `-a`, `-b` | `claude`, `codex` | Debater backends (`claude`, `codex`, `mock`) |
| `-m` | `claude` | Mediator backend |
| `-r` | `4` | Max rounds (one round = each side speaks once) |
| `--no-clarify` | | Skip the clarifying questions |
| `-o` | `ai-collab-runs` | Transcript folder |

## When to use it

Use it for decisions with real arguments on both sides, such as money, career moves or architecture choices, where you want each assumption tested. For quick factual questions it's overkill: a debate takes several minutes and makes many model calls, which count against your subscription limits.
