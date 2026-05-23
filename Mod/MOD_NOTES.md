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
- Upgraded the Summary/Ask panel resize controls so the left and right edges adjust width, the bottom edge adjusts height, and both dimensions persist locally.
- Summary/Ask panel resizing now allows a narrower 420px minimum width and bottom-edge flush resizing to the page bottom.
- Polished Summary Preview cards so source names stay fully visible at narrow panel widths and expanded cards stretch with the panel height.
- Summary/Ask panel position now persists locally and is restored when the panel is reopened, while still clamping to the current viewport.
- Summary/Ask panel position persistence is now owned by the panel state and synchronized after edge resizing, so reopen and rerender keep the current location.
- Summary/Ask panel geometry is now owned by a single React state, replacing the external DOM resize manager for position, width, height, and edge handles.
- Summary collection no longer dispatches to site-specific extraction functions; seeded configurations for ChatGPT, Gemini/Bard, Kagi Assistant, DeepSeek, and Grok now all use the same plugin-connected Summary userscript format.
- Summary collection now treats configured chat pages as protected by default: ChatGPT, Gemini/Bard, Kagi Assistant, DeepSeek, and Grok seed entries are skipped when configured Copy-button extraction fails, so sidebar/history/page chrome text is not used unless that site's fallback is explicitly set to page text.
- Replaced selector-form Summary extraction rules with versioned userscript configs. Each userscript now runs through the plugin-injected page-world runtime inside the target iframe, with `api` helpers for DOM queries, real Copy-button clicking/capture, turn extraction, copy-sequence extraction, normalization, sleeping, and merging.
- Added an isolated-world fallback runner for Summary userscripts when the iframe page-world runtime does not answer, so the same configured userscript can still use DOM-scoped extraction instead of returning an empty protected-chat result.
- Improved Summary userscript Copy-button discovery for current ChatGPT layouts by adding nearest-turn scoring plus copy/clipboard icon-shape fallback when Copy controls have no stable text or `aria-label`.
- Added page-world Copy capture fallbacks for Summary userscripts, including page `copy` event capture and post-click clipboard-read comparison when native `navigator.clipboard.writeText/write` wrapping does not observe the copy.
- Broadened the page-world copy-event bridge to listen in both capture and bubble phases, so sites that populate `clipboardData` later in the copy event can still be captured.
- Added page-world `document.execCommand("copy")` interception for Summary Copy capture, covering sites that select hidden text and invoke the legacy copy command instead of `navigator.clipboard`.
- Updated the ChatGPT default Summary userscript with structured turn DOM-text fallback scoped to `[data-message-author-role]`, so ChatGPT can still be collected when the native Copy control is hidden or unavailable without falling back to sidebar/page text.
- Updated the ChatGPT default Summary userscript to Copy-button-only extraction, validated against current `Copy message` / `Copy response` turn actions.
- Fixed the ChatGPT Copy-button-only userscript scope selector so current ChatGPT turn matching cannot be interrupted by an invalid escaped class selector; Summary site config is now v28.
- Upgraded the Gemini/Bard default Summary userscript to Copy-button-only extraction, validated in Gemini DevTools against current `Copy prompt` / `Copy` turn actions; Summary site config is now v29.
- Optimized Gemini/Bard Copy-button-only Preview collection so the first Preview waits on the site-specific userscript timeout, uses a shorter configurable native-copy wait per candidate, and directly ranks `Copy prompt` / `Copy` buttons near each turn; Summary site config is now v30.
- Updated the Summary turn extractor so configured `roleFallbackSequence` is used when a message node has no stable role marker, added Copy-menu probing for hidden overflow actions, and limited built-in DOM fallback to user prompts only so assistant answers must come from Copy-button capture.
- Added a secondary built-in userscript strategy for ChatGPT and Kagi Assistant: if turn-scoped extraction fails, collect user prompt text from page structure and pair it only with assistant messages obtained from global Copy-button/Menu Copy capture.
- Updated the Kagi Assistant seed userscript to treat `a` and `svg` action icons as Copy candidates and expanded the page-world icon detector to inspect the candidate element itself, not only child SVG nodes.
- Expanded the Kagi Assistant seed userscript again to include `span:has(svg)`, `div:has(svg)`, and copy/clipboard class candidates so wrapper elements around action icons can be clicked.
- Updated the Kagi Assistant seed userscript to fall back to Kagi's visible or accessibility-labelled `You said:` / `Assistant said:` turn blocks when Copy-button capture still fails, keeping the extraction scoped to the active conversation instead of whole-page/sidebar text.
- Updated the Kagi Assistant seed userscript again to use visible Copy buttons as local turn anchors and extract from the nearest Kagi message container when clipboard capture is blocked, avoiding sidebar/history text while still collecting the active conversation.
- Updated the Kagi Assistant seed userscript to prefer visible `You said:` / `Assistant said:` conversation blocks before Copy capture, preventing Kagi's research-source Copy payload from polluting Summary Preview while still avoiding sidebar/history text.
- Tightened the Kagi Assistant seed userscript to parse `You said:` / `Assistant said:` directly from iframe-visible text before any Copy flow, reject Kagi research `Sources (N)` Copy payloads, and skip instead of returning noisy Copy text when no clean active conversation can be parsed.
- Added a Summary Panel Kagi structured text fallback before protected-chat skip: if Kagi userscript extraction fails, the panel probes `getPageText` and parses only active `You said:` / `Assistant said:` conversation blocks, never returning the full sidebar/history page text.
- Hardened Summary Preview acceptance so configured structured extraction must include both user and assistant turns; Kagi research-source Copy payloads containing `Sources (N):` / `References (N):` are rejected and rerouted to the active `You said:` / `Assistant said:` parser, whose assistant cleanup now cuts off source/reference lists.
- Expanded the Kagi Summary Panel fallback for current Kagi pages that expose visible conversation structure without `You said:` / `Assistant said:` text, extracting the prompt just before `Research (Experimental)` and the assistant body up to `Responded` / `References`.
- Cleaned Kagi Assistant research-query prefixes from Summary Preview output when Kagi merges `Searched with Kagi` query text with the assistant answer line.
- Added an extra Kagi Assistant cleanup for merged English search-query prefixes that no longer include the `Searched with Kagi` label, so Preview starts at the actual assistant answer.
- Replaced the temporary Kagi Assistant page-text fast path with Copy-button-only structured extraction for active `/assistant/<conversation-id>` conversations, while exact blank `/assistant` pages are still skipped immediately.
- Bumped the built-in Summary site config version to v22 to refresh Kagi rules, so Kagi user prompts and assistant Markdown now come from Kagi's own Copy buttons and structured-only Kagi no longer falls back to page text.
- Fixed Kagi Assistant Summary extraction so the Kagi seed no longer runs the generic native-conversation copier before the Kagi-specific Copy sequence. The Kagi runtime now rejects footnote/reference-only payloads such as `^1]: [title](url) (21%)` while preserving References when they are part of a full assistant answer.
- Bumped the built-in Summary site config version to v26 and updated the Gemini/Bard userscript to use Copy-result-only extraction: user turns now allow hover-revealed `Copy prompt`, assistant turns keep prompt-copy excluded, and DOM text is used only to scope/validate the Copy result.
- Updated the Grok default Summary userscript fallback role sequence and copied-text filter so one prompt followed by multiple assistant copy chunks is merged as a single assistant answer while model-mode menu text is rejected.
- Updated the Grok default Summary userscript to Copy-button-only extraction scoped to `main,[role=main]`, rejecting sidebar/page chrome/table/code/share controls and returning empty on blank new chats; Summary site config is now v31.
- Split the `grok.dairoot.cn` mirror into its own built-in `Grok Mirror` Summary config with a mirror-specific Copy-button userscript, while refreshing the official Grok config to remove mirror hosts; Summary site config is now v36.
- Added a Claude default Summary userscript validated in Dia DevTools against current `You said:` / `Claude responded:` headings and message Copy buttons; Claude is structured-only and Summary site config is now v33.
- Expanded the Claude Summary seed to also match `/new`, so empty Claude start pages are protected and skipped instead of contributing page chrome text; Summary site config is now v34.
- Added a Summary Panel collection guard for blank `claude.ai/new` pages and clear stale Preview cards on collection failure, so empty Claude pages cannot leave page-text remnants in the preview.
- Added a Notion AI default Summary userscript validated in Dia DevTools against current `Copy text` / `Copy response` buttons on `notion.so/chat`; Notion is structured-only and Summary site config is now v35.
- Legacy selector-style Summary configs are converted into a userscript draft during normalization, while built-in rows can be reset to the current userscript defaults.
- Added a Summary Preview hard timeout per iframe and skipped `chrome-error://` browser error pages so broken embedded pages cannot keep collection stuck or contribute browser error text.
- Upgraded Summary settings from a compact form into a wider management page with API Profile selection, prompt reset, a larger prompt editor, and a Summary Site Configs table modeled after Custom Config.
- Replaced hard-coded Summary protected-site dispatch with unified `summarySiteConfigs` rules: built-in and custom Summary sites now use the same URL matching, role mapping, and Copy-button extraction configuration, with `structuredOnly` or `allowPageText` fallback behavior per site.
- Upgraded Optimize settings into the same wider management page pattern with API Profile selection, API Profiles shortcut, prompt reset, larger prompt editor, and a visible optimization-flow note.
- Added settings import and export buttons for `options`, `customConfig`, `promptLibrary`, and `shortcutConfig`.
- Added Notion AI as a built-in chat app entry for `https://www.notion.so/ai`.
- Added a Claude-only iframe compatibility patch that masks extension `ancestorOrigins` where configurable and restores hidden Claude sidebar/history candidates inside Simple Chat Hub frames.
- Broadened the Claude sidebar patch activation for Dia guest-frame cases where `location.ancestorOrigins` is empty, while still skipping top-level Claude tabs.
- Removed the temporary Claude desktop-width iframe viewport override after Dia testing showed it did not restore Claude's native sidebar and caused unwanted layout side effects.
- Added a Claude iframe runtime shim that masks iframe/referrer signals and biases common width media queries toward desktop mode before Claude's page scripts initialize.
- Removed the iframe `sandbox` attribute for the built-in Claude app only, because Claude's embedded app shell can omit the native sidebar/history UI in sandboxed frames.
- Changed the built-in Claude entry to `https://claude.ai/new` and bumped the built-in chat-app config version so cached default configs refresh away from the root Claude iframe shell.
- Added a Claude iframe document-start redirect from the root path to `/new` as a cache fallback for existing Dia tabs that still hold the previous root URL.
- Added request-domain DNR header stripping so configured iframe targets such as Notion can bypass `X-Frame-Options` and `frame-ancestors` blocks reliably.
- Expanded the DNR frame-document rules to cover both `main_frame` and `sub_frame`, matching Dia/Chromium guest-frame navigations that do not report as ordinary subframes.
- Added a Notion-specific static DNR ruleset for `notion.so` and `notion.com` as a higher-priority fallback when Dia does not apply the dynamic domain rules to Notion frame navigations; the rules cover non-main-frame resources plus explicit `main_frame` navigations.
- Added a `displayName` fallback for Notion AI so Add Chat App and tab labels render as `Notion AI` with `Notion` as the provider even when translation fallback returns the raw `NotionAI` id.
- Disabled the extension's own Google Analytics Measurement Protocol telemetry.
- Kept `manifest.update_url` unchanged because it is the Chrome extension update URL, not Google Analytics telemetry.

## Summary Copy Extraction Pre-Test Workflow

- For Summary userscript or Copy-button extraction fixes, first validate the target site in the live Arc page with a DevTools console probe before changing plugin code.
- The console probe must prove the real Copy button can be discovered, clicked, and captured in that page or iframe context, and it should identify which copied payloads are valid messages versus sources, references, menus, or other page chrome.
- Only after the console result is correct should the same selector, scoring, click, capture, and rejection logic be ported into the plugin's Summary userscript configuration/runtime.
- After porting, reload the extension, reload the Simple Chat Hub page, reopen the target conversation, and verify Summary Preview uses the copied structured message instead of DOM page-text fallback.

## Summary DeepSeek/Grok Copy Extraction Notes

- 2026-05-23: The DeepSeek/Grok Preview regression looked like a clipboard-transfer failure because the page showed native Copy activity while Preview still returned `No userscript messages found`, but the root cause was the userscript extraction shape.
- Working site scripts such as ChatGPT, Gemini/Bard, Claude, Kagi Assistant, and LobeHub own the whole extraction path: find each user/assistant turn, score native Copy controls near that turn, call `api.copy(button)`, and build messages only from the copied payload.
- The broken DeepSeek/Grok scripts delegated to `api.extractDeepSeekNativeCopyMessages`, `api.extractGrokNativeCopyMessages`, and then generic `api.extractCopySequence`. In the page-world bridge those DeepSeek/Grok helpers were only aliases for generic native-copy extraction, so `pageWorldFirst` never ran site-specific turn/button logic.
- Switching to `isolatedOnly` did not solve the problem because the scripts still depended on helper/generic extraction, and native page Copy buttons are more reliable when clicked from page-world execution.
- Strict DOM-text versus copied-payload matching was also too brittle. Native Copy payload formatting can differ from the visible DOM text, so valid copied content can be rejected if DOM text is treated as the source of truth instead of only as scope/validation context.
- Generic copy-sequence extraction is fragile on DeepSeek/Grok because hidden icon buttons and unlabeled action bars make it hard to prove which Copy control belongs to the user turn versus the assistant turn. It may click visible controls yet still fail to assemble a valid user+assistant pair.
- Grok and DeepSeek user-message Copy controls can be hover-revealed instead of always visible. The userscript must reveal the turn first by dispatching pointer/mouse hover events on the turn and nearby action scopes, then rescan for Copy controls; otherwise Preview can time out or miss the native user Copy button even though the assistant Copy button is visible.
- Synthetic pointer/mouse events do not necessarily trigger CSS `:hover` visibility. Grok can keep the user Copy button in the DOM while hiding it with hover-dependent styling, so user-message Copy candidate discovery must allow hover-hidden Copy controls with usable DOM/icon metadata and then validate the copied payload against the user turn text.
- The stable fix is to keep DeepSeek/Grok in `pageWorldFirst` and make their userscripts follow the working per-turn Copy-button pattern directly: site-specific turn discovery, nearby Copy/icon scoring, direct `api.copy(button)`, copied-payload-only messages, longer timeout, and no DOM text fallback.
- For future Summary Copy fixes, first compare the target userscript against the working per-turn Copy-button userscripts before changing the clipboard bridge or collection pipeline.

## Notes

- The Mod targets the Chrome MV3 build only.
- External chat sites embedded by the extension are not modified or blocked by the telemetry change.
- Summary/Ask resize handles are now invisible hit areas, removing the inner guide lines.
