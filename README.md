# Simple Chat Hub 2.4.0 Mod

本分支是基于 Simple Chat Hub `2.4.0.14` Chrome MV3 扩展包制作的 Mod 版本。

Simple Chat Hub 是一个聚合多个主流 AI 聊天平台的浏览器扩展。它保留原版的多平台同屏聊天、提示词库、布局、截图和快捷键能力，并在此基础上加入 API Profiles、提示词优化、Summary / Ask 面板、配置导入导出，以及扩展自身 Google Analytics 遥测屏蔽。

## 产物结构

| 路径 | 作用 | 说明 |
| --- | --- | --- |
| `Mod/` | 解包后的 Chrome MV3 扩展目录 | 可在开发者模式中通过“加载已解压的扩展程序”安装 |
| `Mod/MOD_NOTES.md` | Mod 说明记录 | 仅作为仓库说明文件，不参与扩展运行逻辑 |
| `dist/Simple-Chat-Hub-2.4.0.14.crx` | 已签名 CRX3 安装包 | 用于拖入 Chromium 扩展管理页安装 |
| `CUSTOM_CONFIG_EXAMPLE.md` | 自定义平台配置示例 | 用于参考如何添加自定义聊天平台 |

已签名 CRX 保持固定扩展 ID：

```text
jhhdlimojbejlcmknnijakeokoggdhgb
```

## 原版保留能力

| 能力 | 当前状态 |
| --- | --- |
| 多平台同屏聊天 | 保留，可同时向多个 AI 平台发送提示词并对比回复 |
| 内置平台 | 保留 ChatGPT、Gemini、Grok、Kimi、DouBao、Qwen 等原有平台 |
| 自定义平台 | 保留，可通过 Custom Config 添加平台 |
| 布局管理 | 保留布局预设、分组、标签页、全屏和窗口顺序调整 |
| 提示词库 | 保留提示词添加、编辑、排序和一键插入 |
| 快捷键 | 保留并扩展快捷键配置 |
| 截图 | 保留单窗口截图、移动/桌面视图截图和对比截图 |
| 主题与语言 | 保留亮色/暗色主题和多语言设置 |

## Mod 功能总览

| 功能 | 说明 |
| --- | --- |
| API Profiles | 统一管理 API endpoint、API key、model 和配置名称 |
| Optimize Prompt | 改为使用 OpenAI-compatible `chat/completions` 请求 |
| Summary / Ask Panel | 新增可拖动、可调整宽度的总结/提问面板 |
| ChatGPT 采集修正 | 优先使用每轮消息自己的复制按钮，避免不安全的页面文本兜底 |
| Kagi 采集修正 | 以解析出的用户问题为准，只补充匹配当前轮次的助手回复 |
| 配置导入 / 导出 | 支持备份和恢复 `options`、`customConfig`、`promptLibrary`、`shortcutConfig` |
| 遥测屏蔽 | 停止扩展自身 Google Analytics Measurement Protocol 事件上报 |

## API Profiles

- 新增可复用的 API Profiles。
- 每个 Profile 可配置名称、endpoint、API key 和 model。
- Optimize Prompt 与 Summary / Ask 共用同一套 API Profile 配置。
- 加载旧设置时，会将旧的 Optimize / Summary 配置迁移到共享 Profile 结构。

## Optimize Prompt

- 将原内置优化接口替换为 OpenAI-compatible `chat/completions` 调用。
- 请求使用当前选择的 API Profile。
- 支持保存自定义提示词优化模板。
- 未配置 API key 时，只提示配置，不发起无效请求。
- 请求失败时显示优化失败提示。

## Summary / Ask Panel

- 新增居中的 Summary / Ask 面板。
- 可从顶部入口或快捷键系统打开。
- 默认快捷键包含 `Alt+S` 打开 Summary / Ask 面板。
- 支持选择 API Profile，并支持自定义总结提示词。
- 会采集当前聊天上下文，先展示预览，再输出 Markdown 格式结果。
- 面板支持拖动、宽度调整和滚动，宽度会保存到浏览器本地存储。

### ChatGPT 采集行为

- 将每个 `[data-message-author-role]` 节点视为独立轮次。
- 优先使用当前轮次自己的 `Copy message` / `Copy response` / `Response copied` / `Copied` 按钮内容。
- 保持每轮复制结果相互独立。
- 对复制按钮做短暂重试，并在需要时执行助手消息的轻量恢复。
- 不再对 ChatGPT 使用页面文本作为不安全兜底。

### Kagi 采集行为

- 将解析出的用户 query 作为当前轮次的用户输入来源。
- 仅在助手内容与当前轮次匹配时，才用 native-copy 做补充。

## 配置导入 / 导出

| 项目 | 行为 |
| --- | --- |
| Export Config | 导出当前配置 JSON |
| Import Config | 从 JSON 恢复已知配置项 |
| 导出范围 | `options`、`customConfig`、`promptLibrary`、`shortcutConfig` |
| 兼容性 | 兼容旧版导出文件缺少 `shortcutConfig` 的情况 |
| 导入成功 | 写入配置后提示成功并刷新页面 |
| 导入失败 | 显示导入失败提示 |

## Google Analytics 遥测

- 屏蔽扩展自身的 Google Analytics Measurement Protocol 遥测。
- 停止发送 page view、install、log、click、keypress、error 等 GA 事件。
- 安装时清理旧的 `clientId` 与 `sessionData` 遥测标识。
- 保留 `manifest.update_url`，因为它是 Chrome 扩展更新地址，不是 GA 遥测地址。
- 不修改、不屏蔽扩展中嵌入的外部聊天网站自身遥测行为。

## 安装方式

### 安装 CRX

1. 打开 Chromium 浏览器扩展管理页：`chrome://extensions/`
2. 开启“开发者模式”。
3. 将 `dist/Simple-Chat-Hub-2.4.0.14.crx` 拖入扩展管理页安装。

### 加载解包目录

1. 打开 Chromium 浏览器扩展管理页：`chrome://extensions/`
2. 开启“开发者模式”。
3. 点击“加载已解压的扩展程序”。
4. 选择 `Mod/` 目录。

## 使用注意

- 本 Mod 面向 Chrome / Chromium MV3 构建。
- Optimize Prompt 与 Summary / Ask 需要配置 OpenAI-compatible endpoint、API key 和 model。
- 需要登录的平台，请先在嵌入页面中完成登录。
- 使用内置平台和自定义 API endpoint 时，需要保证网络可访问。
