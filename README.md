# Simple Chat Hub 2.4.0 Mod 功能修改

本分支只记录相对原版 Simple Chat Hub 2.4.0 的功能修改。

## Optimize Prompt

- 设置面板新增 `Optimize Prompt` 管理入口。
- 新增自定义优化配置：
  - `URL`
  - `Key`
  - `Model`
  - `Template`
- 将原内置 `/v1/prompt/optimize` 调用改为 OpenAI-compatible `chat/completions` 调用。
- 优化请求使用用户配置的 endpoint、API key、model 和 prompt template。
- 未配置 API Key 时显示配置提示，不发起优化请求。
- 请求失败时显示优化失败提示。

## 配置导入 / 导出

- 设置面板底部新增 `Export Config` 按钮。
- 设置面板底部新增 `Import Config` 按钮。
- 导出配置包含：
  - `options`
  - `customConfig`
  - `promptLibrary`
  - `shortcutConfig`
- 导入配置时只写入 JSON 中存在的已知配置项。
- 兼容旧版导出文件缺少 `shortcutConfig` 的情况。
- 导入成功后显示提示并刷新页面。
- 导入失败时显示错误提示。

## Google Analytics 遥测

- 屏蔽扩展自身的 Google Analytics Measurement Protocol 遥测。
- 停止发送 page view、install、log、click、keypress、error 等 GA 事件。
- 安装时不再生成新的 GA `clientId`。
- 安装时清理旧的 `clientId` 和 `sessionData` 遥测标识。
- 保留 `manifest.update_url`，因为它是 Chrome 扩展更新地址，不是 Google Analytics 遥测。
