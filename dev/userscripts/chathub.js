// Built-in Summary userscript: ChatHub (chathub)
// Source: Mod/assets/chunk-7dbf4e81.js :: SUMMARY_SITE_CONFIG_DEFAULTS
// Config version: 47; global config version: 60
// Hosts: app.chathub.gg
// Path prefixes: /chat
// Run mode: default; timeout: default
// This is a Simple Chat Hub Summary bridge body, not a standalone browser userscript.

const classText = node => String(node && node.className && node.className.baseVal || node && node.className || '');
const roleForRow = row => {
  const classes = classText(row);
  if (classes.includes('flex-row-reverse')) return 'user';
  if (classes.includes('flex-row')) return 'assistant';
  return '';
};
const copyIconForRow = row => api.qsa('svg[viewBox="0 0 512 512"]', row, { all: true })
  .find(svg => svg.querySelector('rect[width="336"][height="336"][x="128"][y="128"]')) || null;
const looksLikeUiText = text => /(^|\n)\s*(Thought for|Thinking\.\.\.|Web search|Prompt|Use \/ to select|Image generations|Show All)\b/i.test(text)
  || /\b(Basic|Advanced|Images)\s+\d+\s*\//i.test(text);
const rows = api.qsa('div.group.flex.w-full', document, { all: true })
  .filter(row => roleForRow(row) && copyIconForRow(row));
const turns = [];
for (const row of rows) {
  const role = roleForRow(row);
  const copyIcon = copyIconForRow(row);
  api.reveal(row);
  await api.sleep(140);
  const text = api.normalize(await api.copy(copyIcon, {
    resetClipboardBeforeCopy: true,
    copyTimeoutMs: 3000,
    copyCaptureGraceMs: 220
  }));
  if (!text || looksLikeUiText(text)) continue;
  turns.push({ role, text });
  await api.sleep(80);
}
const merged = api.merge(turns);
return merged.some(item => item.role === 'user') && merged.some(item => item.role === 'assistant') ? merged : [];
