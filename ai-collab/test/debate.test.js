'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { runDebate, extractJson, toMarkdown } = require('../src/debate');
const { getBackend } = require('../src/backends');

test('extractJson reads the last fenced block', () => {
  const t = 'text\n```json\n{"a":1}\n```\nmore\n```json\n{"b":2}\n```';
  assert.deepStrictEqual(extractJson(t), { b: 2 });
  assert.deepStrictEqual(extractJson('no fence {"c":3}'), { c: 3 });
  assert.strictEqual(extractJson('nothing here'), null);
});

test('full debate reaches consensus with mock backends', async () => {
  const events = [];
  const r = await runDebate({
    question: 'Buy out my lease or lease new?',
    mediator: getBackend('mock:Mediator'),
    debaterA: getBackend('mock:A'),
    debaterB: getBackend('mock:B'),
    askUser: async (qs) => qs.map(() => '5k / 3 months'),
    maxRounds: 4,
    onEvent: (e) => events.push(e.type),
  });
  assert.strictEqual(r.answers.length, 2);
  assert.ok(r.consensus);
  assert.strictEqual(r.turns.length, 4); // each mock agrees on its 2nd turn
  assert.match(r.synthesis, /Recommendation/);
  assert.ok(events.includes('roles'));
  assert.match(toMarkdown(r), /# Final answer/);
});

test('stalled debate triggers a mediator nudge and stops at the round limit', async () => {
  const stubborn = (label) => ({
    label,
    ask: async () => 'No.\n```json\n{"current_position":"mine","agrees_with_opponent":false,"remaining_objections":["x"]}\n```',
  });
  const r = await runDebate({
    question: 'Q',
    mediator: getBackend('mock:Mediator'),
    debaterA: stubborn('A'),
    debaterB: stubborn('B'),
    maxRounds: 3,
  });
  assert.strictEqual(r.consensus, false);
  assert.ok(r.turns.some((t) => t.speaker === 'Mediator'));
  assert.strictEqual(r.turns.filter((t) => t.speaker !== 'Mediator').length, 6);
});
