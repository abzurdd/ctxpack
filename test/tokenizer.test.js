const test = require('node:test');
const assert = require('node:assert');
const { estimateTokens, computeStats } = require('../lib/tokenizer');

test('estimateTokens returns positive numbers for text', () => {
  const sample = 'function add(a, b) {\n  return a + b;\n}';
  const claudeTokens = estimateTokens(sample, 'claude');
  const gptTokens = estimateTokens(sample, 'gpt');

  assert.ok(claudeTokens > 5);
  assert.ok(gptTokens > 5);
  assert.strictEqual(estimateTokens(''), 0);
});

test('computeStats aggregates metrics across files', () => {
  const files = [
    { path: 'a.js', size: 100, content: 'const a = 1;\nconst b = 2;\n' },
    { path: 'b.js', size: 50, content: 'export default true;\n' }
  ];

  const stats = computeStats(files);
  assert.strictEqual(stats.fileCount, 2);
  assert.strictEqual(stats.totalBytes, 150);
  assert.ok(stats.totalLines >= 3);
  assert.ok(stats.estimatedTokens.claude > 0);
  assert.ok(stats.estimatedTokens.gpt > 0);
});

