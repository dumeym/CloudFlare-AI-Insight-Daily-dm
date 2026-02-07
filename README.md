# 企业微信群 AI 每日简讯

> 每天自动推送最新的 AI 资讯到企业微信群，简洁、免费、全自动。

## ✨ 特性

- 🤖 **AI 驱动**：使用 DeepSeek 生成高质量摘要
- 💰 **超低成本**：每月约 0.015 元
- ⏰ **全自动**：每天 09:30 自动推送，无需人工干预
- 🔒 **安全可靠**：企业微信官方 Webhook，零风控风险
- 📝 **简洁明了**：每条 ≤80 字，内参风格

## 📸 效果预览

```
【2025/02/07 AI 简讯】

今日 AI 动态
DeepSeek 发布开源大语言模型 DeepSeek-V3，在中文理解和推理任务上表现优异。

来源：
1. OpenAI 发布 GPT-4.5 预览版
   https://openai.com/blog/gpt-4-5-preview
2. Google Gemini 2.0 性能突破
   https://blog.google/gemini-2-0
```

## 🚀 快速开始（5 分钟）

### 前置要求

- 一个企业微信群（成员 ≥100 人）
- DeepSeek API Key
- GitHub 账号

### 1. Fork 本仓库

点击右上角的 Fork 按钮，将仓库 Fork 到你的账号。

### 2. 配置 GitHub Secrets

在你的 GitHub 仓库中，添加以下 3 个 Secrets：

| Secret 名称 | 说明 |
|-----------|------|
| `DEEPSEEK_API_KEY` | DeepSeek API Key（从 [DeepSeek](https://platform.deepseek.com/) 获取） |
| `DEEPSEEK_API_URL` | DeepSeek API URL（可选，默认：`https://api.deepseek.com`） |
| `WECHAT_WEBHOOK_URL` | 企业微信 Webhook URL（在企业微信群中添加机器人获取） |

⚠️ **重要**: Webhook URL 必须保密，不要分享或公开！

### 3. 启用 GitHub Actions

1. 进入 GitHub 仓库的 `Actions` 标签
2. 点击左侧的 `AI Daily WeChat Notification`
3. 点击 `Enable workflow`

### 4. 测试推送

1. 在 `Actions` 页面，点击 `Run workflow`
2. 选择分支，点击运行
3. 等待执行，检查企业微信群是否收到消息

## 📚 详细文档

- [SETUP-STEPS.md](./SETUP-STEPS.md) - 详细的设置步骤指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 完整的部署文档
- [SPEC.md](./SPEC.md) - 技术规格说明

## 🏗️ 技术架构

```
信息源 (RSS/Feed)
    ↓
内容抓取
    ↓
DeepSeek AI 生成摘要
    ↓
格式化
    ↓
GitHub Actions 触发
    ↓
企业微信 Webhook 推送
    ↓
企业微信群
```

## 💰 成本估算

| 项目 | 成本 |
|-----|------|
| DeepSeek API | 0.015 元/月 |
| GitHub Actions | 免费（公开仓库） |
| 企业微信 Webhook | 免费 |
| **总计** | **≈0.015 元/月** |

## 🔧 自定义

### 修改推送时间

编辑 `.github/workflows/daily-notify.yml`：

```yaml
schedule:
  # 每天 09:30 (北京时间)
  - cron: '30 1 * * *'
```

### 修改推送内容

编辑 `scripts/daily-notify.js` 中的以下函数：

- `getDailyAIClues()` - 数据源
- `generateDailySummary()` - AI Prompt
- `formatMessage()` - 消息格式

## 📊 监控

查看 GitHub Actions 执行日志：
1. 进入 GitHub 仓库的 `Actions` 页面
2. 点击具体的 workflow run
3. 查看详细日志

## ❓ 常见问题

### Q: 为什么企业微信群收不到消息？

**A**: 检查以下几点：
1. GitHub Secrets 是否正确配置
2. Webhook URL 是否正确
3. 群成员数量是否 ≥100 人

### Q: 如何修改推送时间？

**A**: 编辑 `.github/workflows/daily-notify.yml` 中的 cron 表达式。

### Q: 如何查看推送历史？

**A**: 在 GitHub Actions 页面查看历史执行记录。

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

## 🙏 致谢

本项目基于 [CloudFlare-AI-Insight-Daily](https://github.com/justlovemaki/CloudFlare-AI-Insight-Daily) 改造。

---

**享受自动化的便利！🚀**
