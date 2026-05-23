// Built-in Summary userscript: Grok Mirror (grok-dairoot)
// Source: Mod/assets/chunk-7dbf4e81.js :: SUMMARY_SITE_CONFIG_DEFAULTS
// Config version: 36; global config version: 60
// Hosts: grok.dairoot.cn, *.grok.dairoot.cn
// Path prefixes: (none)
// Run mode: default; timeout: default
// This is a Simple Chat Hub Summary bridge body, not a standalone browser userscript.

const normalize = value => api.normalize(String(value || ""));
const qsa = (selector, root = document) => {
  try { return api.qsa(selector, root, { all: true }); } catch (error) { return []; }
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
const closest = (element, selector) => {
  try { return api.closest(element, selector); } catch (error) { return null; }
};
const roots = qsa("main,[role=main]", document).filter(layoutVisible);
const root = roots.find(element => !closest(element, "nav,aside,header,footer")) || roots[0] || document.body || document;
const copyPattern = /(?:^|\b)(?:copy|copied|clipboard)(?:\b|$)|复制|已复制|拷贝/i;
const excludePattern = /copy\s*(?:code|table|link|conversation|source|sources)|copy[-_ ]?(?:code|table|link|conversation|source|sources)|(?:link|share|history|source|sources|citation|citations|feedback|thumb|like|dislike|settings|export|docs|menu|more|notification|sidebar|regenerate|new\s*chat|upload|attach)|链接|分享|代码|表格|会话|历史|来源|引用|赞|踩|设置|导出|更多|菜单|通知|新建|上传|附件/i;
const tableToolPattern = /save\s*table|copy\s*save\s*table|data-table|table-copy|copy-table|保存表格/i;
const badTextPattern = /^\s*(?:场景|推荐模式|模式|Scenario|Recommended mode|Mode)[\s,，:：]*[\s\S]{0,800}(?:Fast|Auto|Heavy|Expert|Grok 4\.3)/i;
const isInternalTool = button => {
  if (closest(button, "nav,aside,header,footer,form,input,textarea,select,[contenteditable=true],pre,code,table,kbd,samp,[data-language]")) return true;
  let node = button;
  for (let depth = 0; node && depth < 5; depth += 1, node = node.parentElement) {
    if (tableToolPattern.test(meta(node))) return true;
    if (depth <= 2 && qsa("button,[role=button],[role=menuitem]", node).some(item => item !== button && tableToolPattern.test(meta(item)))) return true;
  }
  return false;
};
const isCopyButton = button => layoutVisible(button) && copyPattern.test(meta(button)) && !excludePattern.test(meta(button)) && !isInternalTool(button);
const order = (a, b) => {
  try {
    const pos = a.compareDocumentPosition(b);
    return pos & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : pos & Node.DOCUMENT_POSITION_PRECEDING ? 1 : 0;
  } catch (error) {
    return 0;
  }
};
const buttons = qsa("button,[role=button],[role=menuitem]", root).filter(isCopyButton).sort(order).slice(0, 32);
const useful = value => {
  const text = normalize(value).replace(/^Copied to clipboard\.?$/i, "").trim();
  if (!text || /^https?:\/\//i.test(text) || badTextPattern.test(text)) return "";
  return text;
};
const assistantish = text => text.length > 120 || /(?:\n|^#{1,6}\s|\n[-*]\s|\|.+\|)/.test(text);
const copied = [];
for (const button of buttons) {
  api.reveal(button);
  await api.sleep(120);
  const text = useful(await api.copy(button, { copyTimeoutMs: 1200, copyPollMs: 50 }));
  if (text && !copied.includes(text)) copied.push(text);
  await api.sleep(80);
}
let sawUser = false;
const turns = copied.map(text => {
  let role = assistantish(text) ? "assistant" : "";
  if (!role) role = sawUser ? "assistant" : "user";
  if (role === "user") sawUser = true;
  return { role, content: text };
});
const merged = api.merge(turns);
return merged.some(item => item.role === "user") && merged.some(item => item.role === "assistant") ? merged : [];
