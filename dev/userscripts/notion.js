// Built-in Summary userscript: Notion (notion)
// Source: Mod/assets/chunk-7dbf4e81.js :: SUMMARY_SITE_CONFIG_DEFAULTS
// Config version: 62; global config version: 62
// Hosts: app.notion.com, notion.so, www.notion.so, *.notion.so
// Path prefixes: /chat, /ai
// Run mode: default; timeout: default
// This is a Simple Chat Hub Summary bridge body, not a standalone browser userscript.

const normalize = value => api.normalize(String(value || ""));
const qsa = (selector, root = document) => {
  try { return api.qsa(selector, root, { all: true }); } catch (error) { return []; }
};
const closest = (element, selector) => {
  try { return api.closest(element, selector); } catch (error) { return null; }
};
const layoutVisible = element => {
  if (!element) return false;
  try {
    const rect = element.getBoundingClientRect();
    const style = getComputedStyle(element);
    return rect.width > 4 && rect.height > 4 && style.display !== "none" && style.visibility !== "hidden";
  } catch (error) {
    return false;
  }
};
const meta = element => normalize([
  element && element.tagName,
  element && element.getAttribute && element.getAttribute("aria-label"),
  element && element.getAttribute && element.getAttribute("title"),
  element && element.getAttribute && element.getAttribute("data-testid"),
  element && element.getAttribute && element.getAttribute("data-test-id"),
  element && typeof element.className === "string" ? element.className : "",
  element && element.textContent
].filter(Boolean).join(" "));
const order = (a, b) => {
  try {
    if (a === b) return 0;
    const pos = a.compareDocumentPosition(b);
    return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  } catch (error) {
    return 0;
  }
};
const roots = qsa("#notion-app,main,[role=main]", document).filter(layoutVisible);
const root = roots.find(element => !closest(element, "nav,aside,header,footer")) || roots[0] || document;
const roleOfButton = button => {
  const label = meta(button);
  if (/\bcopy\s+(?:response|answer)\b|复制(?:回复|回答|响应)/i.test(label)) return "assistant";
  if (/\bcopy\s+(?:text|message|prompt)\b|复制(?:文本|消息|提示词|问题)/i.test(label)) return "user";
  return "";
};
const isCopyTurnButton = button => layoutVisible(button) && roleOfButton(button) && !closest(button, "nav,aside,header,footer,form,input,textarea,select,[contenteditable=true],pre,code,table,kbd,samp,[data-language]");
const useful = value => {
  const text = normalize(value).replace(/^(?:Copied to clipboard|Response copied to clipboard|Right click and copy the link above)\.?$/i, "").trim();
  if (!text || /^(?:copy|copied|copy text|copy response|复制|已复制)$/i.test(text)) return "";
  if (/^(?:https?:\/\/|mailto:|#)\S{1,240}$/i.test(text)) return "";
  return text;
};
const turns = [];
const seen = new Set();
const buttons = qsa("button,[role=button]", root).filter(isCopyTurnButton).sort(order).slice(0, 48);
for (const button of buttons) {
  const role = roleOfButton(button);
  if (role !== "user" && role !== "assistant") continue;
  api.reveal(button);
  await api.sleep(120);
  const text = useful(await api.copy(button, { copyTimeoutMs: 1600, copyPollMs: 50 }));
  if (text) {
    const key = role + "\n" + text.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      turns.push({ role, content: text });
    }
  }
  await api.sleep(80);
}
const merged = api.merge(turns);
return merged.some(item => item.role === "user") && merged.some(item => item.role === "assistant") ? merged : [];
