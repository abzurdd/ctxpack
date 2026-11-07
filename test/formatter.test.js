const test = require('node:test');
const assert = require('node:assert');
const { formatMarkdown, formatXml, formatJson, buildDirectoryTree } = require('../lib/formatter');

test('buildDirectoryTree formats hierarchy', () => {
  const files = [
    { path: 'src/index.js' },
    { path: 'src/utils/math.js' },
    { path: 'README.md' }
  ];

  const tree = buildDirectoryTree(files);
  assert.ok(tree.includes('README.md'));
  assert.ok(tree.includes('src/'));
  assert.ok(tree.includes('math.js'));
});

test('formatXml produces Claude prompt structure', () => {
  const files = [
    { path: 'main.py', size: 25, content: 'print("hello world")' }
  ];
  const stats = {
    fileCount: 1,
    totalLines: 1,
    estimatedTokens: { claude: 10, gpt: 10 }
  };

  const xml = formatXml(files, '/app/test-repo', stats);
  assert.ok(xml.includes('<context repository="test-repo">'));
  assert.ok(xml.includes('<document index="1">'));
  assert.ok(xml.includes('<source>main.py</source>'));
  assert.ok(xml.includes('print("hello world")'));
  assert.ok(xml.includes('</context>'));
});

