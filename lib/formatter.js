const path = require('path');

function buildDirectoryTree(files) {
  const tree = {};

  for (const file of files) {
    const parts = file.path.split('/');
    let current = tree;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (i === parts.length - 1) {
        current[part] = null; // file
      } else {
        current[part] = current[part] || {};
        current = current[part];
      }
    }
  }

  function render(node, prefix = '') {
    let result = '';
    const keys = Object.keys(node).sort((a, b) => {
      const aIsDir = node[a] !== null;
      const bIsDir = node[b] !== null;
      if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
      return a.localeCompare(b);
    });

    keys.forEach((key, index) => {
      const isLast = index === keys.length - 1;
      const marker = isLast ? '└── ' : '├── ';
      const isDir = node[key] !== null;

      result += `${prefix}${marker}${key}${isDir ? '/' : ''}\n`;

      if (isDir) {
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        result += render(node[key], nextPrefix);
      }
    });
    return result;
  }

  return render(tree);
}

function getCodeFenceLanguage(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.js': 'javascript',
    '.jsx': 'jsx',
    '.ts': 'typescript',
    '.tsx': 'tsx',
    '.kt': 'kotlin',
    '.java': 'java',
    '.py': 'python',
    '.go': 'go',
    '.rs': 'rust',
    '.swift': 'swift',
    '.c': 'c',
    '.cpp': 'cpp',
    '.h': 'c',
    '.cs': 'csharp',
    '.rb': 'ruby',
    '.php': 'php',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.xml': 'xml',
    '.sh': 'bash',
    '.zsh': 'bash',
    '.sql': 'sql',
    '.md': 'markdown'
  };
  return map[ext] || '';
}

function formatMarkdown(files, rootPath, stats) {
  const repoName = path.basename(rootPath);
  let out = `# Codebase Context: ${repoName}\n\n`;

  out += `## Summary\n`;
  out += `- **Files Included**: ${stats.fileCount}\n`;
  out += `- **Total Lines**: ${stats.totalLines}\n`;
  out += `- **Estimated Tokens (Claude)**: ~${stats.estimatedTokens.claude.toLocaleString()}\n`;
  out += `- **Estimated Tokens (GPT)**: ~${stats.estimatedTokens.gpt.toLocaleString()}\n\n`;

  out += `## Directory Structure\n\n\`\`\`text\n`;
  out += `${repoName}/\n`;
  out += buildDirectoryTree(files);
  out += `\`\`\`\n\n`;

  out += `## File Contents\n\n`;
  for (const file of files) {
    const lang = getCodeFenceLanguage(file.path);
    out += `### \`${file.path}\`\n\n`;
    out += `\`\`\`${lang}\n`;
    out += file.content.trimEnd() + '\n';
    out += `\`\`\`\n\n`;
  }

  return out;
}

function formatXml(files, rootPath, stats) {
  const repoName = path.basename(rootPath);
  let out = `<context repository="${repoName}">\n`;
  out += `  <metadata>\n`;
  out += `    <files_count>${stats.fileCount}</files_count>\n`;
  out += `    <total_lines>${stats.totalLines}</total_lines>\n`;
  out += `    <claude_tokens>${stats.estimatedTokens.claude}</claude_tokens>\n`;
  out += `  </metadata>\n`;

  out += `  <structure>\n`;
  out += buildDirectoryTree(files);
  out += `  </structure>\n`;

  out += `  <documents>\n`;
  files.forEach((file, index) => {
    out += `    <document index="${index + 1}">\n`;
    out += `      <source>${file.path}</source>\n`;
    out += `      <document_content><![CDATA[\n${file.content}\n]]></document_content>\n`;
    out += `    </document>\n`;
  });
  out += `  </documents>\n`;
  out += `</context>\n`;

  return out;
}

function formatJson(files, rootPath, stats) {
  return JSON.stringify({
    repository: path.basename(rootPath),
    stats,
    structure: buildDirectoryTree(files),
    files: files.map(f => ({
      path: f.path,
      size: f.size,
      content: f.content
    }))
  }, null, 2);
}

module.exports = {
  buildDirectoryTree,
  getCodeFenceLanguage,
  formatMarkdown,
  formatXml,
  formatJson
};

