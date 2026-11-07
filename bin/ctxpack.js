#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { pack } = require('../lib/core');
const packageJson = require('../package.json');

function printHelp() {
  console.log(`
ctxpack v${packageJson.version}
Fast, zero-dependency CLI & library to bundle codebases into token-counted, secret-safe prompts.

USAGE:
  ctxpack [path] [options]

OPTIONS:
  -o, --output <file>     Write bundled prompt to specified output file
  -f, --format <format>   Output format: "markdown" (default), "xml" (Claude optimized), or "json"
  --xml                   Shortcut for --format xml
  --json                  Shortcut for --format json
  -i, --ignore <list>     Comma-separated custom ignore patterns (e.g. "*.test.js,docs")
  --max-size <kb>         Maximum file size in KB to include (default: 512)
  --no-gitignore          Do not read patterns from .gitignore
  --stats                 Print detailed token & file statistics only
  -c, --copy              Copy output directly to system clipboard
  -v, --version           Show current version
  -h, --help              Show this help message

EXAMPLES:
  npx ctxpack .                                   # Preview markdown context for current repo
  npx ctxpack . -o prompt.md                     # Save context to prompt.md
  npx ctxpack ./src --xml -c                      # Bundle ./src in Claude XML format & copy to clipboard
  npx ctxpack . --ignore "tests,*.spec.ts"       # Ignore custom patterns
  npx ctxpack . --stats                           # View token estimates without printing files
`);
}

function copyToClipboard(text) {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      spawnSync('pbcopy', { input: text });
      return true;
    } else if (platform === 'win32') {
      spawnSync('clip', { input: text });
      return true;
    } else {
      spawnSync('xclip', ['-selection', 'clipboard'], { input: text });
      return true;
    }
  } catch {
    return false;
  }
}

function parseArgs(args) {
  const options = {
    targetDir: '.',
    output: null,
    format: 'markdown',
    ignore: null,
    maxFileSize: 512 * 1024,
    respectGitignore: true,
    statsOnly: false,
    copy: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === '-h' || arg === '--help') {
      printHelp();
      process.exit(0);
    } else if (arg === '-v' || arg === '--version') {
      console.log(`v${packageJson.version}`);
      process.exit(0);
    } else if (arg === '-o' || arg === '--output') {
      options.output = args[++i];
    } else if (arg === '-f' || arg === '--format') {
      options.format = args[++i];
    } else if (arg === '--xml') {
      options.format = 'xml';
    } else if (arg === '--json') {
      options.format = 'json';
    } else if (arg === '-i' || arg === '--ignore') {
      options.ignore = args[++i];
    } else if (arg === '--max-size') {
      const kb = parseInt(args[++i], 10);
      if (!isNaN(kb)) options.maxFileSize = kb * 1024;
    } else if (arg === '--no-gitignore') {
      options.respectGitignore = false;
    } else if (arg === '--stats') {
      options.statsOnly = true;
    } else if (arg === '-c' || arg === '--copy') {
      options.copy = true;
    } else if (!arg.startsWith('-')) {
      options.targetDir = arg;
    }
  }

  return options;
}

function run() {
  const options = parseArgs(process.argv.slice(2));

  try {
    const result = pack(options.targetDir, options);

    if (result.warnings.length > 0) {
      console.error('\x1b[33m%s\x1b[0m', `[ctxpack] Notice: ${result.warnings.length} file(s) safely filtered:`);
      result.warnings.slice(0, 5).forEach(w => {
        console.error(`  - ${w.path} (${w.reason})`);
      });
      if (result.warnings.length > 5) {
        console.error(`  ...and ${result.warnings.length - 5} more`);
      }
      console.error('');
    }

    if (options.statsOnly) {
      console.log(`\n--- Codebase Statistics ---`);
      console.log(`Target:           ${result.root}`);
      console.log(`Files Included:   ${result.stats.fileCount}`);
      console.log(`Total Lines:      ${result.stats.totalLines.toLocaleString()}`);
      console.log(`Total Bytes:      ${(result.stats.totalBytes / 1024).toFixed(2)} KB`);
      console.log(`Estimated Tokens (Claude): ~${result.stats.estimatedTokens.claude.toLocaleString()}`);
      console.log(`Estimated Tokens (GPT):    ~${result.stats.estimatedTokens.gpt.toLocaleString()}`);
      return;
    }

    if (options.output) {
      const resolvedOut = path.resolve(options.output);
      fs.writeFileSync(resolvedOut, result.content, 'utf-8');
      console.error(`\x1b[32m✔ Bundled ${result.stats.fileCount} files into ${options.output}\x1b[0m (~${result.stats.estimatedTokens.claude.toLocaleString()} Claude tokens)`);
    } else if (!options.copy) {
      process.stdout.write(result.content);
    }

    if (options.copy) {
      const copied = copyToClipboard(result.content);
      if (copied) {
        console.error(`\x1b[32m✔ Context copied to clipboard!\x1b[0m (${result.stats.fileCount} files, ~${result.stats.estimatedTokens.claude.toLocaleString()} tokens)`);
      } else {
        console.error('\x1b[31m✖ Failed to copy to clipboard automatically.\x1b[0m');
      }
    }
  } catch (err) {
    console.error('\x1b[31m[ctxpack Error]\x1b[0m', err.message);
    process.exit(1);
  }
}

run();
