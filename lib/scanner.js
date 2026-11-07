const fs = require('fs');
const path = require('path');

const DEFAULT_IGNORED_DIRS = new Set([
  '.git',
  'node_modules',
  'dist',
  'build',
  'coverage',
  '.gradle',
  '.idea',
  '.vscode',
  '__pycache__',
  '.pytest_cache',
  '.cache',
  '.next',
  '.nuxt',
  'target',
  'vendor',
  '.gemini',
  '.turbo'
]);

const SENSITIVE_FILE_PATTERNS = [
  /^\.env(\..+)?$/i,
  /\.(pem|key|jks|keystore|p12|pfx)$/i,
  /^id_(rsa|dsa|ecdsa|ed25519)$/i,
  /(credentials|service-account.*|secret.*)\.json$/i,
  /id_.*\.pub$/i
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.svgz',
  '.mp3', '.mp4', '.wav', '.avi', '.mov', '.webm',
  '.zip', '.tar', '.gz', '.7z', '.rar',
  '.pdf', '.exe', '.dll', '.so', '.dylib', '.bin',
  '.apk', '.aab', '.jar', '.class', '.pyc', '.wasm'
]);

function isSensitive(filename) {
  if (filename === '.env.example' || filename === '.env.sample' || filename === '.env.template') {
    return false;
  }
  return SENSITIVE_FILE_PATTERNS.some(pattern => pattern.test(filename));
}

function isBinary(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (BINARY_EXTENSIONS.has(ext)) return true;

  try {
    const buffer = Buffer.alloc(1024);
    const fd = fs.openSync(filePath, 'r');
    const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
    fs.closeSync(fd);
    for (let i = 0; i < bytesRead; i++) {
      if (buffer[i] === 0) return true;
    }
  } catch {
    return false;
  }
  return false;
}

function parseGitignore(rootPath) {
  const gitignorePath = path.join(rootPath, '.gitignore');
  const rules = [];

  if (fs.existsSync(gitignorePath)) {
    const lines = fs.readFileSync(gitignorePath, 'utf-8').split(/\r?\n/);
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) continue;
      rules.push(line);
    }
  }
  return rules;
}

function matchesGitignore(relPath, rules) {
  const normalized = relPath.replace(/\\/g, '/');
  for (const rule of rules) {
    const cleanRule = rule.replace(/^\/+/, '').replace(/\/+$/, '');
    if (!cleanRule) continue;

    if (normalized === cleanRule || normalized.startsWith(cleanRule + '/')) {
      return true;
    }
    if (cleanRule.startsWith('*.') && normalized.endsWith(cleanRule.slice(1))) {
      return true;
    }
  }
  return false;
}

function scanDirectory(dirPath, options = {}) {
  const root = path.resolve(dirPath);
  const maxFileSize = options.maxFileSize || 512 * 1024; // 512 KB
  const customIgnores = options.ignore ? options.ignore.split(',').map(s => s.trim()) : [];
  const gitignoreRules = options.respectGitignore !== false ? parseGitignore(root) : [];
  const allIgnoreRules = [...gitignoreRules, ...customIgnores];

  const results = [];
  const warnings = [];

  function walk(currentDir) {
    const entries = fs.readdirSync(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      const relPath = path.relative(root, fullPath);

      if (entry.isDirectory()) {
        if (DEFAULT_IGNORED_DIRS.has(entry.name)) continue;
        if (matchesGitignore(relPath, allIgnoreRules)) continue;
        walk(fullPath);
      } else if (entry.isFile()) {
        if (matchesGitignore(relPath, allIgnoreRules)) continue;

        if (isSensitive(entry.name)) {
          warnings.push({
            path: relPath,
            reason: 'Excluded automatically for safety (detected sensitive file / secret key pattern).'
          });
          continue;
        }

        if (isBinary(fullPath)) {
          continue;
        }

        const stat = fs.statSync(fullPath);
        if (stat.size > maxFileSize) {
          warnings.push({
            path: relPath,
            reason: `Excluded because size (${Math.round(stat.size / 1024)} KB) exceeds limit (${Math.round(maxFileSize / 1024)} KB).`
          });
          continue;
        }

        try {
          const content = fs.readFileSync(fullPath, 'utf-8');
          results.push({
            path: relPath.replace(/\\/g, '/'),
            fullPath,
            size: stat.size,
            content
          });
        } catch (err) {
          warnings.push({
            path: relPath,
            reason: `Error reading file: ${err.message}`
          });
        }
      }
    }
  }

  walk(root);
  return { files: results, warnings, root };
}

module.exports = {
  scanDirectory,
  isSensitive,
  isBinary,
  DEFAULT_IGNORED_DIRS
};
