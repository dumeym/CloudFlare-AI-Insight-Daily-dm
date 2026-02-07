# 企业微信群 AI 每日简讯 - 部署指南

本项目基于 CloudFlare-AI-Insight-Daily 改造，实现了每日自动推送 AI 简讯到企业微信群的功能。

## 📋 功能特性

- ✅ 每天自动抓取 AI 资讯
- ✅ 使用 DeepSeek 生成简洁摘要（≤80字）
- ✅ 自动推送到企业微信群
- ✅ 完全免费（使用 GitHub Actions）

## 🚀 快速部署

### 步骤 1: 配置 GitHub Secrets

在你的 GitHub 仓库中，进入 `Settings` → `Secrets and variables` → `Actions`，添加以下 Secrets：

| Secret 名称 | 说明 | 示例值 |
|-----------|------|--------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key | `sk-xxxxx` |
| `DEEPSEEK_API_URL` | DeepSeek API URL（可选） | `https://api.deepseek.com` |
| `WECHAT_WEBHOOK_URL` | 企业微信 Webhook URL | `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=xxxxx` |

#### 获取 DeepSeek API Key

1. 访问 [DeepSeek 官网](https://platform.deepseek.com/)
2. 注册并登录账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 复制 API Key 到 GitHub Secrets

#### 获取企业微信 Webhook URL

1. 在企业微信群（≥100人）中，点击群设置
2. 找到"群机器人" → "添加机器人"
3. 设置机器人名称
4. 复制生成的 Webhook URL
5. 将 URL 添加到 GitHub Secrets

⚠️ **重要**: Webhook URL 必须保密，不要分享或公开！

### 步骤 2: 启用 GitHub Actions

1. 进入你的 GitHub 仓库
2. 点击 `Actions` 标签
3. 点击左侧的 `AI Daily WeChat Notification` workflow
4. 点击 `Enable workflow` 按钮

### 步骤 3: 测试推送（手动触发）

1. 在 Actions 页面，点击 `AI Daily WeChat Notification`
2. 点击 `Run workflow` 按钮
3. 选择分支，点击绿色的 `Run workflow` 按钮
4. 等待执行完成，检查企业微信群是否收到消息

### 步骤 4: 确认定时任务

GitHub Actions 会自动在每天北京时间 **09:30** (UTC 01:30) 执行一次。

你可以在 `.github/workflows/daily-notify.yml` 中修改执行时间：

```yaml
schedule:
  # 格式：分 时 日 月 周
  # 示例：每天 09:30 UTC+8 = 01:30 UTC
  - cron: '30 1 * * *'
```

## 📝 自定义配置

### 修改推送时间

编辑 `.github/workflows/daily-notify.yml`，修改 cron 表达式。

Cron 表达式格式：`分 时 日 月 周`

示例：
- 每天 09:30: `30 1 * * *` (UTC 时间)
- 每周一 09:30: `30 1 * * 1`
- 每天 18:00: `0 10 * * *`

### 修改推送内容

编辑 `scripts/daily-notify.js` 中的以下内容：

1. **数据源**: 修改 `getDailyAIClues()` 函数，从真实的 RSS 源抓取数据
2. **AI Prompt**: 修改 `generateDailySummary()` 中的 systemPrompt
3. **消息格式**: 修改 `formatMessage()` 函数

### 修改推送频率

默认每天推送一次。如需修改，编辑 `.github/workflows/daily-notify.yml` 中的 cron 表达式。

## 🔍 监控和调试

### 查看执行日志

1. 进入 GitHub 仓库的 Actions 页面
2. 点击具体的 workflow run
3. 展开每个步骤，查看详细日志

### 常见问题

#### 问题 1: 推送失败 - "DEEPSEEK_API_KEY 环境变量未设置"

**解决方案**: 检查 GitHub Secrets 是否正确设置了 `DEEPSEEK_API_KEY`。

#### 问题 2: 推送失败 - "WECHAT_WEBHOOK_URL 环境变量未设置"

**解决方案**: 检查 GitHub Secrets 是否正确设置了 `WECHAT_WEBHOOK_URL`。

#### 问题 3: 企业微信收不到消息

**可能原因**:
1. Webhook URL 错误
2. 企业微信机器人已被禁用
3. 群成员数量 < 100（部分群不支持 webhook）

**解决方案**:
1. 重新获取 Webhook URL
2. 在企业微信中检查机器人状态
3. 确保群成员数量 ≥ 100

#### 问题 4: AI 生成的内容不符合预期

**解决方案**: 编辑 `scripts/daily-notify.js` 中的 systemPrompt，调整 AI 的输出约束。

## 💰 成本估算

### DeepSeek API 成本

- 输入: 1 元 / 百万 tokens
- 输出: 2 元 / 百万 tokens
- 每日估算: 500 tokens（输入 + 输出）
- **每月成本: 约 0.015 元**

### GitHub Actions

- 公开仓库: **完全免费**
- 私有仓库: 每月 2000 分钟免费额度（足够使用）

**总成本: 每月约 0.015 元（几乎免费）**

## 🔐 安全建议

1. **永远不要**将 API Key 或 Webhook URL 提交到代码仓库
2. 使用 GitHub Secrets 管理敏感信息
3. 定期更换 API Key
4. 限制 GitHub Actions 的权限范围

## 📚 相关文档

- [SPEC.md](./SPEC.md) - 详细的技术规格说明
- [企业微信 Webhook API 文档](./企业微信消息推送配置说明webhook.md)
- [DeepSeek API 文档](https://platform.deepseek.com/docs)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License
