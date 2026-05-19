# Simple Chat Hub 2.4.0 Mod

This branch contains a Chrome MV3 Mod build of Simple Chat Hub based on the
`2.4.0.14` extension payload.

Simple Chat Hub aggregates mainstream AI chat platforms into one browser
extension. It keeps the original multi-platform chat workflow, then adds custom
API-profile powered prompt optimization, conversation summary/ask tooling,
configuration backup, and telemetry reduction.

## Package Layout

- `Mod/`: unpacked Chrome MV3 extension payload for developer-mode loading.
- `Mod/MOD_NOTES.md`: internal Mod notes; this file is documentation only and is
  not part of the runtime behavior.
- `dist/Simple-Chat-Hub-2.4.0.14.crx`: signed CRX3 package for installation.
- `CUSTOM_CONFIG_EXAMPLE.md`: examples for adding custom chat platforms.

The signed CRX keeps the extension ID stable:

```text
jhhdlimojbejlcmknnijakeokoggdhgb
```

## Original Features Kept

- Send one prompt to multiple AI chat platforms and compare replies side by side.
- Use built-in chat platforms such as ChatGPT, Gemini, Grok, Kimi, DouBao, Qwen,
  and other supported services.
- Add custom chat platforms through custom config.
- Arrange chat apps with layout presets, tabs, fullscreen mode, and per-panel
  actions.
- Use the prompt library, keyboard shortcuts, theme/language settings, and
  screenshot tools from the original extension.

## Mod Features

### API Profiles

- Adds reusable API Profiles with custom name, endpoint, API key, and model.
- Uses API Profiles for both Optimize Prompt and Summary/Ask.
- Normalizes and migrates older Optimize/Summary settings into the shared profile
  format when existing settings are loaded.

### Optimize Prompt

- Replaces the built-in optimization request with an OpenAI-compatible
  `chat/completions` request.
- Uses the selected API Profile endpoint, API key, and model.
- Supports a saved prompt optimization template.
- Shows a configuration prompt when no API key is available instead of sending an
  invalid request.
- Shows an error message when optimization fails.

### Summary / Ask Panel

- Adds a centered Summary/Ask panel that can be opened from the header or the
  shortcut system.
- Default shortcut support includes `Alt+S` for opening the summary panel.
- Supports selecting an API Profile and customizing the summary prompt.
- Collects the active chat context, shows a preview, and renders AI output as
  readable Markdown.
- The panel is draggable, width-resizable, scroll-safe, and preserves the resized
  width in local browser storage.
- Improves ChatGPT message collection by relying on per-turn copy buttons,
  keeping copied turns separate, and avoiding unsafe page-text fallback when
  ChatGPT copy-button content is unavailable.
- Improves Kagi collection by keeping the parsed user query as the source of
  truth and only supplementing assistant text when it matches the current turn.

### Config Import / Export

- Adds settings-menu buttons for exporting and importing configuration.
- Export includes `options`, `customConfig`, `promptLibrary`, and
  `shortcutConfig`.
- Import only writes known keys found in the JSON file.
- Import remains compatible with older exports that do not include
  `shortcutConfig`.

### Google Analytics Telemetry

- Disables the extension's own Google Analytics Measurement Protocol telemetry.
- Stops sending extension page view, install, log, click, keypress, and error
  events to GA.
- Cleans old `clientId` and `sessionData` telemetry identifiers on install.
- Keeps `manifest.update_url` unchanged because it is the Chrome extension update
  URL, not Google Analytics telemetry.
- This change does not modify or block telemetry performed by external chat sites
  embedded inside the extension.

## Installation

### Install the signed CRX

1. Open Chrome or another Chromium browser extension page:
   `chrome://extensions/`
2. Enable Developer mode.
3. Drag `dist/Simple-Chat-Hub-2.4.0.14.crx` into the extensions page.

### Load the unpacked Mod

1. Open `chrome://extensions/`.
2. Enable Developer mode.
3. Choose "Load unpacked".
4. Select the `Mod/` directory.

## Usage Notes

- This Mod targets the Chrome/Chromium MV3 build only.
- API-powered Optimize Prompt and Summary/Ask require an OpenAI-compatible
  endpoint, API key, and model configured in API Profiles.
- Chat platforms that require login must be logged in inside the embedded site
  before the extension can interact with them reliably.
- Network access to the selected chat platforms and configured API endpoints is
  still required.
