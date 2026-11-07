const path = require('path');
const { scanDirectory } = require('./scanner');
const { computeStats } = require('./tokenizer');
const { formatMarkdown, formatXml, formatJson } = require('./formatter');

function pack(targetDir = '.', options = {}) {
  const rootPath = path.resolve(targetDir);
  const { files, warnings, root } = scanDirectory(rootPath, options);
  const stats = computeStats(files);

  const format = (options.format || 'markdown').toLowerCase();
  let content = '';

  if (format === 'xml') {
    content = formatXml(files, root, stats);
  } else if (format === 'json') {
    content = formatJson(files, root, stats);
  } else {
    content = formatMarkdown(files, root, stats);
  }

  return {
    content,
    stats,
    warnings,
    files,
    root
  };
}

module.exports = {
  pack
};
