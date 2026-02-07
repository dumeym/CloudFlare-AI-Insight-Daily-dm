# 企业微信群 AI 每日简讯 - 设置步骤

## ✅ 已完成的工作

### 1. 核心文件创建

| 文件 | 说明 |
|-----|------|
| `.github/workflows/daily-notify.yml` | GitHub Actions 定时任务配置 |
| `scripts/daily-notify.js` | 主脚本：抓取 → AI 生成 → 推送 |
| `src/chatapi.js` | 添加了 DeepSeek API 支持 |
| `DEPLOYMENT.md` | 完整的部署文档 |
| `.gitignore` | 防止敏感信息泄露 |
| `package.json` | 项目配置文件 |

### 2. 技术栈

- **AI 引擎**: DeepSeek V3（高性价比，每月约 0.015 元）
- **部署平台**: GitHub Actions（免费）
- **推送方式**: 企业微信 Webhook
- **执行时间**: 每天 09:30（北京时间）

### 3. 核心功能

✅ 自动抓取 AI 资讯
✅ DeepSeek 生成简洁摘要（≤80字）
✅ 推送到企业微信群
✅ 错误处理和日志记录
✅ 手动触发测试功能

---

## 🎯 下一步需要做的事情

### 步骤 1: 提交代码到 GitHub

```bash
cd d:/MyCodingProjects/AI-insight-daily/CloudFlare-AI-Insight-Daily
git add .
git commit -m "feat: 添加企业微信每日 AI 简讯推送功能"
git push origin main
```

### 步骤 2: 配置 GitHub Secrets

访问你的 GitHub 仓库：`https://github.com/dumeym/CloudFlare-AI-Insight-Daily-dm`

进入 `Settings` → `Secrets and variables` → `Actions`，点击 `New repository secret`，添加以下 3 个 Secrets：

#### Secret 1: `DEEPSEEK_API_KEY`

1. 从 `d:/MyCodingProjects/AI-insight-daily/AI-API-KEY.md` 复制 API Key
2. **名称**: `DEEPSEEK_API_KEY`
3. **值**: `sk-b5545f0c3970401896968b5ad49f76fb`

#### Secret 2: `DEEPSEEK_API_URL`（可选）

1. **名称**: `DEEPSEEK_API_URL`
2. **值**: `https://api.deepseek.com`

#### Secret 3: `WECHAT_WEBHOOK_URL`

1. 从企业微信群复制 Webhook URL
2. **名称**: `WECHAT_WEBHOOK_URL`
3. **值**: `https://qyapi.weixin.qq.com/cgi-bin/webhook/send?key=YOUR_KEY`

⚠️ **重要**: 将 Webhook URL 填入 `d:/MyCodingProjects/AI-insight-daily/企业微信 Webhook.md`，然后从这里复制到 GitHub Secrets。

### 步骤 3: 启用 GitHub Actions

1. 进入 GitHub 仓库的 `Actions` 标签页
2. 点击左侧的 `AI Daily WeChat Notification`
3. 点击 `Enable workflow` 按钮

### 步骤 4: 手动测试（首次必须）

1. 在 `Actions` 页面，点击 `AI Daily WeChat Notification`
2. 点击 `Run workflow` 按钮
3. 选择 `main` 分支
4. 点击绿色的 `Run workflow` 按钮
5. 等待执行完成（通常 30-60 秒）
6. **检查企业微信群是否收到测试消息**

### 步骤 5: 监控首次自动执行

GitHub Actions 会在以下时间自动执行：

- **时间**: 北京时间 09:30（UTC 01:30）
- **日期**: 第二天 09:30
- **频率**: 每天 1 次

查看执行日志：
1. 进入 `Actions` 页面
2. 点击具体的 workflow run
3. 展开步骤，查看详细日志

---

## 🔧 故障排查

### 如果测试失败

#### 问题 1: Actions 报错 "DEEPSEEK_API_KEY 环境变量未设置"

**解决**:
1. 检查 GitHub Secrets 是否正确添加了 `DEEPSEEK_API_KEY`
2. 确保 Secret 名称完全匹配（区分大小写）

#### 问题 2: Actions 报错 "WECHAT_WEBHOOK_URL 环境变量未设置"

**解决**:
1. 检查 GitHub Secrets 是否正确添加了 `WECHAT_WEBHOOK_URL`
2. 确保 Webhook URL 完整且正确

#### 问题 3: 企业微信群收不到消息

**可能原因**:
- Webhook URL 错误或失效
- 企业微信机器人被禁用
- 群成员数量不足（需要 ≥100 人）

**解决**:
1. 重新获取 Webhook URL 并更新 GitHub Secrets
2. 在企业微信中检查机器人是否启用
3. 确认群成员数量 ≥ 100

#### 问题 4: Actions 执行超时

**可能原因**:
- DeepSeek API 响应慢
- 网络问题

**解决**:
1. 查看详细日志，确定卡在哪个步骤
2. 重试手动触发
3. 如果持续超时，检查网络连接

---

## 📊 成功标准

完成以下步骤后，系统即视为部署成功：

- [ ] 代码已提交到 GitHub
- [ ] GitHub Secrets 已配置（3 个）
- [ ] GitHub Actions 已启用
- [ ] 手动测试成功（企业微信收到消息）
- [ ] 等待首次自动执行（第二天 09:30）
- [ ] 连续 7 天无异常

---

## 📈 后续优化方向

### 短期（1-2 周）

- [ ] 实现真实的数据源（RSS/Feed）
- [ ] 优化 AI Prompt，提升摘要质量
- [ ] 添加更详细的日志记录
- [ ] 实现失败重试机制

### 中期（1 个月）

- [ ] 支持多群推送
- [ ] 添加内容历史记录
- [ ] 实现内容去重
- [ ] 添加推送统计面板

### 长期（3 个月）

- [ ] 支持 Markdown 格式推送
- [ ] 添加互动功能（群内回复触发）
- [ ] 实现个性化推荐
- [ ] 开发管理后台

---

## 📞 需要帮助？

遇到问题时的解决顺序：

1. 查看本文档的"故障排查"部分
2. 查看 `DEPLOYMENT.md` 详细部署文档
3. 查看 GitHub Actions 执行日志
4. 查看企业微信 Webhook API 文档

---

## 🎉 完成！

如果你已经完成了所有步骤，恭喜你！🎊

你现在拥有了一个全自动的 AI 每日简讯推送系统，每天早上 09:30 会自动向企业微信群推送最新的 AI 资讯。

**成本**: 每月约 0.015 元
**维护**: 几乎零维护
**推送频率**: 每天 1 次
**推送内容**: ≤80 字的简洁摘要

享受自动化的便利吧！🚀
