# Simple Chat Hub 2.4.0 Mod Notes

This branch adds a Chrome Mod build based on the Simple Chat Hub 2.4.0 CRX payload.

## Included Artifacts

- `Mod/`: unpacked Chrome extension payload for local loading.
- `Mod.zip`: zipped Mod payload.
- `Mod.crx`: CRX3 package signed with the existing Mod key to keep the extension ID stable.

## Mod Changes

- Added shared API Profiles with custom names, reusable endpoint/API key/model fields, and migrated Optimize/Summary bindings.
- Replaced the built-in prompt optimization request with an OpenAI-compatible `chat/completions` request using the selected API Profile and saved prompt template.
- Added a centered Raycast-style Summary/Ask panel with keyboard and header-button entry points, selected API Profile support, and a customizable summary prompt.
- ChatGPT summary collection now treats every `[data-message-author-role]` node as a turn, uses only that turn's own copy button return as body text, accepts `Copy message` / `Copy response` / `Response copied` / `Copied` button states, searches copy buttons through a page-level candidate pool gated by the current turn boundary, keeps copied turns separate, retries the same button briefly, and performs a short assistant-only recovery when needed. Its code/table copy filter is scoped to buttons actually inside code/table controls so assistant `Copy response` buttons next to rendered tables are not rejected; it still uses no DOM/native-copy fallback for that path, and the Summary panel still refuses to fall back to page text for ChatGPT when copy-button messages are unavailable.
- Gemini summary collection now recognizes Gemini user/model turns, uses Gemini's native copy controls for assistant responses, accepts Material icon copy labels such as `content_copy` / `copy_all`, and only falls back to DOM text for user turns when no copy result is available.
- Kagi summary collection now keeps the parsed user query as the source of truth and only uses native-copy for assistant supplementation when it matches the current turn.
- Added settings import and export buttons for `options`, `customConfig`, `promptLibrary`, and `shortcutConfig`.
- Added Notion AI as a built-in chat app entry for `https://www.notion.so/ai`.
- Added request-domain DNR header stripping so configured iframe targets such as Notion can bypass `X-Frame-Options` and `frame-ancestors` blocks reliably.
- Expanded the DNR frame-document rules to cover both `main_frame` and `sub_frame`, matching Dia/Chromium guest-frame navigations that do not report as ordinary subframes.
- Added a Notion-specific static DNR ruleset for `notion.so` and `notion.com` as a higher-priority fallback when Dia does not apply the dynamic domain rules to Notion frame navigations; the rules cover non-main-frame resources plus explicit `main_frame` navigations.
- Added a `displayName` fallback for Notion AI so Add Chat App and tab labels render as `Notion AI` with `Notion` as the provider even when translation fallback returns the raw `NotionAI` id.
- Disabled the extension's own Google Analytics Measurement Protocol telemetry.
- Kept `manifest.update_url` unchanged because it is the Chrome extension update URL, not Google Analytics telemetry.

## Notes

- The Mod targets the Chrome MV3 build only.
- External chat sites embedded by the extension are not modified or blocked by the telemetry change.
