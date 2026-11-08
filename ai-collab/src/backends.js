'use strict';
// Backends: each one turns a prompt string into a reply string.
// Real backends shell out to subscription-backed CLIs (Claude Code, Codex),
// so no API keys or per-token billing are involved.

const { spawn } = require('node:child_process');

function runCli(cmd, args, input, { timeoutMs = 10 * 60 * 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '';
    let err = '';
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`${cmd} timed out after ${timeoutMs / 1000}s`));
    }, timeoutMs);
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', (d) => (err += d));
    child.on('error', (e) => {
      clearTimeout(timer);
      reject(
        e.code === 'ENOENT'
          ? new Error(`'${cmd}' not found on PATH. Install it and sign in first.`)
          : e
      );
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`${cmd} exited ${code}: ${err.trim() || out.trim()}`));
      resolve(out.trim());
    });
    child.stdin.end(input);
  });
}

const backends = {
  // Claude Code in print mode; prompt is read from stdin.
  claude: {
    label: 'Claude',
    ask: (prompt, opts = {}) => {
      const args = ['-p', '--output-format', 'text'];
      if (opts.model) args.push('--model', opts.model);
      return runCli('claude', args, prompt, opts);
    },
  },
  // OpenAI Codex CLI non-interactive mode; "-" reads the prompt from stdin.
  codex: {
    label: 'ChatGPT (Codex)',
    ask: (prompt, opts = {}) => {
      const args = ['exec', '--skip-git-repo-check', '--sandbox', 'read-only'];
      if (opts.model) args.push('--model', opts.model);
      args.push('-');
      return runCli('codex', args, prompt, opts);
    },
  },
};

// Deterministic offline backend for tests and dry runs.
function createMockBackend(label) {
  let turn = 0;
  return {
    label,
    ask: async (prompt) => {
      if (prompt.includes('[TASK:CLARIFY]')) {
        return '```json\n{"questions":["What is your budget?","What is your timeline?"]}\n```';
      }
      if (prompt.includes('[TASK:ASSIGN]')) {
        return '```json\n{"framing":"Option A vs option B","position_a":"Argue for option A","position_b":"Argue for option B"}\n```';
      }
      if (prompt.includes('[TASK:NUDGE]')) {
        return 'Both of you: name the single assumption that would flip your answer.';
      }
      if (prompt.includes('[TASK:SYNTHESIZE]')) {
        return '## Recommendation\nGo with option A.\n\n## Trade-offs\n- Mock trade-off.';
      }
      turn += 1;
      const agree = turn >= 2;
      return [
        `${label} argument #${turn}.`,
        '```json',
        JSON.stringify({
          current_position: agree ? 'Option A, with caveats' : 'My assigned side',
          agrees_with_opponent: agree,
          remaining_objections: agree ? [] : ['Cost assumption is unverified'],
        }),
        '```',
      ].join('\n');
    },
  };
}

function getBackend(name) {
  if (name === 'mock') return createMockBackend('Mock');
  if (name.startsWith('mock:')) return createMockBackend(name.slice(5));
  const b = backends[name];
  if (!b) throw new Error(`Unknown backend '${name}'. Use: claude, codex, mock`);
  return b;
}

module.exports = { getBackend, runCli };
