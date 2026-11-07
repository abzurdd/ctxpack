<div align="center">

# `ctxpack` 📦

**Fast, zero-dependency CLI & library to bundle codebases into token-counted, secret-safe context prompts for Claude, Gemini, and GPT.**

[![CI](https://github.com/abzurdd/ctxpack/actions/workflows/ci.yml/badge.svg)](https://github.com/abzurdd/ctxpack/actions)
[![GitHub Pages](https://img.shields.io/badge/Live%20Playground-GitHub%20Pages-blue)](https://abzurdd.github.io/ctxpack/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/abzurdd/ctxpack/blob/main/CONTRIBUTING.md)

</div>

---

## ⚡ Why `ctxpack`?

Feeding an entire repository or subfolder to modern Large Language Models (like **Claude 3.5 Sonnet**, **Gemini 1.5 Pro**, or **GPT-4o**) requires:
1. **Respecting `.gitignore`** so you don't dump `node_modules` or build artifacts into your prompt.
2. **Preventing accidental secret leakage** (`.env`, `.pem`, private keys, keystores).
3. **Accurate token estimation** so you stay comfortably within your context window budget.
4. **Clean formatting** (Markdown code blocks or Claude-optimized `<documents>` XML).
5. **Zero overhead**: No huge dependencies, native Node.js, runs anywhere with `npx`.

---

## 🚀 Quick Start

Run instantly with `npx`:

```bash
# Bundle current directory into markdown context (stdout)
npx ctxpack .

# Bundle and save directly to a file
npx ctxpack . -o prompt.md

# Format specifically for Anthropic Claude (XML) and copy straight to clipboard
npx ctxpack ./src --xml --copy

# Bundle only uncommitted git changes for instant code review in Claude
npx @abzurdd/ctxpack . --diff --xml --copy

# Check codebase token estimate without printing files
npx ctxpack . --stats
```

Or install globally:

```bash
npm install -g ctxpack
```

---

## 📋 CLI Options

| Flag | Shorthand | Description | Default |
| :--- | :--- | :--- | :--- |
| `--output <file>` | `-o` | Write context to a destination file | `stdout` |
| `--format <type>` | `-f` | Output format: `markdown`, `xml`, or `json` | `markdown` |
| `--xml` | | Shortcut for `--format xml` (optimized for Claude) | `false` |
| `--json` | | Shortcut for `--format json` | `false` |
| `--copy` | `-c` | Copy output directly to system clipboard | `false` |
| `--ignore <list>` | `-i` | Comma-separated list of ignore patterns | `""` |
| `--max-size <kb>` | | Maximum single file size in KB to include | `512` |
| `--no-gitignore` | | Ignore `.gitignore` rules during scan | `false` |
| `--diff` | | Bundle only files modified in git diff (unstaged + staged) | `false` |
| `--staged` | | Bundle only staged git files | `false` |
| `--stats` | | Show token & file breakdown only | `false` |
| `--version` | `-v` | Display version | |
| `--help` | `-h` | Display help screen | |

---

## 🔒 Built-in Security Guardrails

`ctxpack` actively inspects filenames and refuses to include sensitive files by default:
- Environment configs: `.env`, `.env.local`, `.env.production` (except `.env.example`)
- Private keys & certificates: `*.pem`, `*.key`, `*.jks`, `*.keystore`, `*.p12`
- SSH keys: `id_rsa`, `id_ed25519`
- Cloud service keys: `credentials.json`, `service-account*.json`

Whenever a protected file is encountered, `ctxpack` logs a clear safety notice to `stderr`.

---

## 💻 Programmatic Node.js API

You can also import `ctxpack` into your own build tools, testing harnesses, or agent pipelines:

```javascript
const { pack } = require('ctxpack');

const result = pack('./my-project', {
  format: 'xml', // 'markdown' | 'xml' | 'json'
  maxFileSize: 256 * 1024,
  ignore: '*.spec.js,docs'
});

console.log(result.content);
console.log(`Estimated Claude Tokens: ${result.stats.estimatedTokens.claude}`);
console.log(`Files bundled: ${result.stats.fileCount}`);
```

---

## 🧪 Testing

`ctxpack` uses Node's native test runner without any external test frameworks:

```bash
npm test
```

---

## 🤝 Contributing

Contributions, bug reports, and suggestions are welcome! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Code of Conduct](CODE_OF_CONDUCT.md).

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.

