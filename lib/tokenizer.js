/**
 * Fast token and complexity estimation for LLMs.
 * Typical code & markdown token density:
 * - Claude (Anthropic): ~3.6 to 3.8 characters / token
 * - GPT-4 / 4o (OpenAI): ~3.7 to 4.0 characters / token
 * - Gemini (Google): ~3.6 to 3.9 characters / token
 */

function estimateTokens(text, model = 'claude') {
  if (!text) return 0;

  // Split into words, identifiers, punctuation, and whitespace chunks
  // This provides a tighter approximation than naive text.length / 4
  const tokens = text.match(/\w+|[^\s\w]|\s+/g);
  if (!tokens) return Math.ceil(text.length / 3.7);

  let count = 0;
  for (let i = 0; i < tokens.length; i++) {
    const chunk = tokens[i];
    if (/^\s+$/.test(chunk)) {
      // Whitespace runs: every 4 spaces or 2 tabs ≈ 1 token
      count += Math.max(1, Math.floor(chunk.length / 4));
    } else if (chunk.length > 8) {
      // Long alphanumeric tokens or camelCase/snake_case are split by subword tokenizers
      count += Math.ceil(chunk.length / 3.5);
    } else {
      count += 1;
    }
  }

  // Model-specific adjustments
  if (model === 'claude') {
    return Math.round(count * 1.02);
  } else if (model === 'gpt') {
    return Math.round(count * 0.98);
  }
  return count;
}

function computeStats(files) {
  let totalChars = 0;
  let totalLines = 0;
  let totalBytes = 0;

  for (const file of files) {
    totalChars += file.content.length;
    totalBytes += file.size;
    totalLines += (file.content.match(/\n/g) || []).length + 1;
  }

  const claudeTokens = estimateTokens(files.map(f => f.content).join('\n'), 'claude');
  const gptTokens = estimateTokens(files.map(f => f.content).join('\n'), 'gpt');

  return {
    fileCount: files.length,
    totalLines,
    totalChars,
    totalBytes,
    estimatedTokens: {
      claude: claudeTokens,
      gpt: gptTokens
    }
  };
}

module.exports = {
  estimateTokens,
  computeStats
};
