# Simple Chat Hub 2.4.0 Mod

基于 Simple Chat Hub `2.4.0.14` 的 Chrome MV3 Mod。

本分支只记录相对原版的功能修改与发布产物。原版多平台同屏聊天、布局、提示词库、截图、主题、语言和快捷键能力均保留。

## 产物

| 路径 | 说明 |
| --- | --- |
| `Mod/` | 解包后的扩展目录，可用开发者模式加载 |
| `Mod/MOD_NOTES.md` | Mod 修改记录，仅作说明 |
| `Mod.zip` | 由 `Mod/` 内容生成的签名 payload |
| `Mod.crx` | 由 `Mod.zip` 和 `../Mod.pem` 签名生成的 CRX3 |
| `dist/Simple-Chat-Hub-2.4.0「YYYY-MM-DD｜HH:MM:SS」.crx` | 已签名 CRX3 安装包 |
| `history/` | 打包前从 `dist/` 自动归档的旧 `.crx` |
| `CUSTOM_CONFIG_EXAMPLE.md` | 自定义平台配置示例 |

扩展 ID：

```text
jhhdlimojbejlcmknnijakeokoggdhgb
```

## 功能修改

| 模块 | 修改 |
| --- | --- |
| API Profiles | 新增可复用的 endpoint、API key、model 配置 |
| Optimize Prompt | 改为 OpenAI-compatible `chat/completions` 调用 |
| Summary / Ask | 新增总结/提问面板，支持 API Profile 和自定义总结提示词 |
| ChatGPT 采集 | 使用每轮消息自己的复制按钮，避免页面文本兜底 |
| Kagi 采集 | 以当前轮次 query 为准，只补充匹配的助手内容 |
| 配置导入 / 导出 | 支持 `options`、`customConfig`、`promptLibrary`、`shortcutConfig` |
| GA 遥测 | 屏蔽扩展自身 Google Analytics Measurement Protocol 上报 |

## Optimize Prompt

- 设置面板支持配置 API Profile。
- 优化请求使用选中的 endpoint、API key、model 和 prompt template。
- 未配置 API key 时只提示配置，不发起请求。
- 请求失败时显示错误提示。

## Summary / Ask

- 可从顶部入口或快捷键打开。
- 默认快捷键：`Alt+S`。
- 支持上下文预览与 Markdown 结果展示。
- 面板支持拖动、宽度调整和滚动。

## 配置导入 / 导出

- 导出：`options`、`customConfig`、`promptLibrary`、`shortcutConfig`。
- 导入：只写入 JSON 中存在的已知配置项。
- 兼容旧导出文件缺少 `shortcutConfig` 的情况。
- 导入成功后提示并刷新页面；失败时显示错误提示。

## Google Analytics 遥测

- 停止发送扩展自身的 page view、install、log、click、keypress、error 等 GA 事件。
- 安装时清理旧的 `clientId` 和 `sessionData`。
- 保留 `manifest.update_url`，它是 Chrome 扩展更新地址，不是 GA 遥测。
- 不处理外部聊天网站自身的遥测行为。

## 打包

官方打包入口：

```bash
node scripts/package_mod.js --key ../Mod.pem
node scripts/verify_mod.js .
```

打包会先将 `dist/` 中已有的 `.crx` 移入 `history/`，再生成 `Mod.zip`、`Mod.crx` 和 `dist/Simple-Chat-Hub-2.4.0「YYYY-MM-DD｜HH:MM:SS」.crx`。如需指定路径：

```bash
node scripts/package_mod.js --root . --key ../Mod.pem --out-dir dist --history-dir history
```

打包时会将 `Mod/manifest.json` 的 `version_name` 更新为 `原始版本号 Mod`，例如 `2.4.0 Mod`；同时将各语言的 `extension_description` 更新为 `Mod「YYYY-MM-DD｜HH:MM:SS」`，例如 `Mod「2026-05-20｜12:34:56」`。`version` 保持 Chrome 所需的内部数值版本，例如 `2.4.0.14`。

## 安装

### 安装 CRX

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 拖入 `dist/Simple-Chat-Hub-2.4.0「YYYY-MM-DD｜HH:MM:SS」.crx`。

### 加载解包目录

1. 打开 `chrome://extensions/`。
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `Mod/`。

## 注意

- 本 Mod 面向 Chrome / Chromium MV3。
- Optimize Prompt 与 Summary / Ask 需要 OpenAI-compatible API 配置。
- 需要登录的平台，请先在对应嵌入页面完成登录。
