const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');
const { scanDirectory, isSensitive, isBinary } = require('../lib/scanner');

test('scanner detects sensitive files properly', () => {
  assert.strictEqual(isSensitive('.env'), true);
  assert.strictEqual(isSensitive('.env.local'), true);
  assert.strictEqual(isSensitive('.env.production'), true);
  assert.strictEqual(isSensitive('.env.example'), false);
  assert.strictEqual(isSensitive('server.key'), true);
  assert.strictEqual(isSensitive('cert.pem'), true);
  assert.strictEqual(isSensitive('id_rsa'), true);
  assert.strictEqual(isSensitive('service-account.json'), true);
  assert.strictEqual(isSensitive('config.json'), false);
  assert.strictEqual(isSensitive('index.js'), false);
});

test('scanner detects binary file extensions', () => {
  assert.strictEqual(isBinary('image.png'), true);
  assert.strictEqual(isBinary('bundle.zip'), true);
  assert.strictEqual(isBinary('app.apk'), true);
  assert.strictEqual(isBinary('index.ts'), false);
});

test('scanDirectory skips ignored directories and files', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctxpack-test-'));

  try {
    // Setup test structure
    fs.mkdirSync(path.join(tmpDir, 'src'));
    fs.mkdirSync(path.join(tmpDir, 'node_modules'));
    fs.writeFileSync(path.join(tmpDir, 'src', 'index.js'), 'console.log("hello");');
    fs.writeFileSync(path.join(tmpDir, 'node_modules', 'dep.js'), 'module.exports = {};');
    fs.writeFileSync(path.join(tmpDir, '.env'), 'SECRET_KEY=12345');
    fs.writeFileSync(path.join(tmpDir, '.env.example'), 'SECRET_KEY=');

    const result = scanDirectory(tmpDir);

    const relativePaths = result.files.map(f => f.path);
    assert.ok(relativePaths.includes('src/index.js'));
    assert.ok(relativePaths.includes('.env.example'));
    assert.ok(!relativePaths.includes('node_modules/dep.js'));
    assert.ok(!relativePaths.includes('.env'));

    // Check sensitive warning was recorded
    assert.ok(result.warnings.some(w => w.path === '.env'));
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
