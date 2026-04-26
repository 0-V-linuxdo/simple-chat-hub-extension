# Simple Chat Hub 2.4.0 Mod Notes

This branch adds a Chrome Mod build based on the Simple Chat Hub 2.4.0 CRX payload.

## Included Artifacts

- `Mod/`: unpacked Chrome extension payload for local loading.
- `Mod.zip`: zipped Mod payload.
- `Mod.crx`: CRX3 package signed with the existing Mod key to keep the extension ID stable.

## Mod Changes

- Added custom Optimize Prompt configuration fields for endpoint, API key, model, and prompt template.
- Replaced the built-in prompt optimization request with an OpenAI-compatible `chat/completions` request using the saved Optimize Prompt settings.
- Added settings import and export buttons for `options`, `customConfig`, `promptLibrary`, and `shortcutConfig`.
- Disabled the extension's own Google Analytics Measurement Protocol telemetry.
- Kept `manifest.update_url` unchanged because it is the Chrome extension update URL, not Google Analytics telemetry.

## Notes

- The Mod targets the Chrome MV3 build only.
- External chat sites embedded by the extension are not modified or blocked by the telemetry change.
