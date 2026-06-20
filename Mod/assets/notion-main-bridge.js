(() => {
  const SOURCE = "simple-chat-hub-notion-main-bridge";
  const REQUEST = "simple-chat-hub:notion-submit";

  if (window.__SCH_NOTION_MAIN_BRIDGE__) return;
  window.__SCH_NOTION_MAIN_BRIDGE__ = true;

  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const compact = (value) => String(value || "").replace(/\s+/g, "").trim();

  const visible = (el) => {
    if (!el || !el.getBoundingClientRect) return false;
    const rect = el.getBoundingClientRect();
    const style = getComputedStyle(el);
    return (
      rect.width > 4 &&
      rect.height > 4 &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      Number(style.opacity) !== 0
    );
  };

  const textOf = (el) => {
    if (!el) return "";
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el.value || "";
    }
    return el.innerText || el.textContent || "";
  };

  const findEditor = () => {
    const active = document.activeElement;
    if (
      active &&
      active !== document.body &&
      (active.matches?.("textarea,input,[contenteditable='true']") ||
        active.closest?.("[contenteditable='true']")) &&
      visible(active.closest?.("[contenteditable='true']") || active)
    ) {
      return active.closest?.("[contenteditable='true']") || active;
    }

    return Array.from(
      document.querySelectorAll(
        "div[contenteditable='true'][role='textbox'],div[contenteditable='true'],textarea"
      )
    )
      .filter(visible)
      .sort((a, b) => {
        const ar = a.getBoundingClientRect();
        const br = b.getBoundingClientRect();
        const aText = textOf(a).trim().length;
        const bText = textOf(b).trim().length;
        return Number(bText > 0) - Number(aText > 0) || br.bottom - ar.bottom;
      })[0] || null;
  };

  const busy = () =>
    Array.from(document.querySelectorAll("button,[role='button']")).some((el) =>
      /stop|cancel|loading|generating|停止|取消|生成/i.test(
        [
          el.getAttribute("aria-label"),
          el.getAttribute("title"),
          el.textContent,
        ]
          .filter(Boolean)
          .join(" ")
      )
    );

  const findSubmit = (editor) => {
    if (!editor) return null;
    const er = editor.getBoundingClientRect();
    const minX = er.left + er.width * 0.45;
    const minY = er.top - 40;
    const maxY = er.bottom + 70;

    return Array.from(document.querySelectorAll("button,[role='button']"))
      .filter(
        (el) =>
          visible(el) &&
          !el.disabled &&
          el.getAttribute("aria-disabled") !== "true" &&
          !el.closest("[aria-label*='Recent' i], [data-testid*='recent' i]")
      )
      .map((el) => {
        const rect = el.getBoundingClientRect();
        const cx = (rect.left + rect.right) / 2;
        const cy = (rect.top + rect.bottom) / 2;
        const label = [
          el.getAttribute("aria-label"),
          el.getAttribute("title"),
          el.getAttribute("data-testid"),
          el.textContent,
        ]
          .filter(Boolean)
          .join(" ");
        const named = /submit ai message|submit|send|提交|发送/i.test(label);
        const near = cx >= er.left - 30 && cx <= er.right + 120 && cy >= minY && cy <= maxY;
        const score =
          (named ? 1000 : 0) +
          (near ? 500 : 0) +
          (rect.right >= minX ? 100 : 0) +
          rect.right / 1000;
        return { el, named, near, score };
      })
      .filter((item) => item.near && (item.named || item.score > 550))
      .sort((a, b) => b.score - a.score)[0]?.el || null;
  };

  const pressEnter = async (editor) => {
    editor.focus?.();
    await wait(40);
    const target = document.activeElement && document.activeElement !== document.body
      ? document.activeElement
      : editor;
    const init = {
      key: "Enter",
      code: "Enter",
      which: 13,
      keyCode: 13,
      bubbles: true,
      cancelable: true,
      composed: true,
    };
    for (const type of ["keydown", "keypress", "keyup"]) {
      target.dispatchEvent(new KeyboardEvent(type, init));
      await wait(40);
    }
  };

  const clickSubmit = async (button) => {
    const mouse = { bubbles: true, cancelable: true, composed: true, view: window };
    const pointer = { ...mouse, pointerId: 1, pointerType: "mouse", isPrimary: true };
    try {
      if (window.PointerEvent) {
        button.dispatchEvent(new PointerEvent("pointerover", pointer));
        button.dispatchEvent(new PointerEvent("pointermove", pointer));
        button.dispatchEvent(new PointerEvent("pointerdown", pointer));
      }
      for (const type of ["mouseover", "mousemove", "mousedown", "mouseup", "click"]) {
        button.dispatchEvent(new MouseEvent(type, mouse));
        await wait(25);
      }
      if (window.PointerEvent) button.dispatchEvent(new PointerEvent("pointerup", pointer));
      button.click?.();
    } catch {
      try {
        button.click?.();
      } catch {}
    }
  };

  window.addEventListener(
    REQUEST,
    async (event) => {
      let detail = {};
      try {
        detail = JSON.parse(String(event.detail || "{}"));
      } catch {}

      const id = detail.id || "";
      const marker = compact(detail.marker || "");
      const editor = findEditor();
      const beforeText = textOf(editor);
      const before = compact(beforeText);
      let clicked = false;
      let ok = false;

      try {
        if (editor) {
          await pressEnter(editor);
          await wait(500);
          let current = compact(textOf(findEditor() || editor));
          ok = Boolean((marker && !current.includes(marker)) || (!marker && current !== before) || busy());

          if (!ok) {
            const button = findSubmit(findEditor() || editor);
            if (button) {
              clicked = true;
              await clickSubmit(button);
              await wait(800);
              current = compact(textOf(findEditor() || editor));
              ok = Boolean((marker && !current.includes(marker)) || (!marker && current !== before) || busy());
            }
          }
        }
      } catch {}

      window.postMessage(
        {
          source: SOURCE,
          type: "response",
          id,
          ok,
          clicked,
          beforeLength: beforeText.length,
          afterLength: textOf(findEditor() || editor).length,
        },
        "*"
      );
    },
    true
  );
})();
