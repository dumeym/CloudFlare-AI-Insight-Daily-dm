# Folo 数据源配置（可选）

## 什么是 Folo？

Folo 是一个现代化的 RSS 聚合器，支持从多个信息源聚合 AI 相关资讯。本仓库支持通过 Folo API 获取真实的新闻数据。

## 配置方式（可选）

如果不配置 Folo，系统会使用示例数据。如需获取真实数据，请在 GitHub Secrets 中添加以下配置：

### 方式一：使用 Folo Web（推荐）

1. 注册 Folo 账号：https://app.follow.is/
2. 添加 AI 相关的 RSS 源（如 OpenAI Blog、Google AI Blog 等）
3. 创建一个列表，包含所有 AI 新闻源
4. 获取 `List ID`：
   - 打开浏览器开发者工具（F12）
   - 访问你的列表页面
   - 在 Network 标签中查找 API 请求
   - 找到包含 `listId` 的请求
   - 复制 `listId` 的值

### 方式二：跳过 Folo（最简单）

如果不想配置 Folo，系统会自动使用示例数据。这些数据只是用于演示功能，不是真实的 AI 资讯。

## GitHub Secrets 配置

如果选择配置 Folo，需要在 GitHub 仓库中添加以下 Secrets：

| Secret 名称 | 说明 | 是否必填 |
|-----------|------|---------|
| `NEWS_AGGREGATOR_LIST_ID` | Folo 新闻列表的 ID | 否 |
| `HGPAPERS_LIST_ID` | Folo 论文列表的 ID（暂不使用） | 否 |
| `FOLO_COOKIE` | Folo 的认证 Cookie（如需访问私有内容） | 否 |
| `FOLO_FILTER_DAYS` | 过滤最近 N 天的新闻，默认 1 | 否 |
| `NEWS_AGGREGATOR_FETCH_PAGES` | 抓取页数，默认 1 | 否 |

### 推荐的 AI 新闻 RSS 源

如果你使用 Folo，可以添加以下 RSS 源：

1. **OpenAI Blog**
   - https://openai.com/blog/rss.xml

2. **Google AI Blog**
   - https://blog.google/inside-google/ai/rss/

3. **DeepSeek Blog**
   - https://www.deepseek.com/blog/rss.xml

4. **Anthropic News**
   - https://www.anthropic.com/news/rss.xml

5. **Hugging Face Blog**
   - https://huggingface.co/blog/feed.xml

6. **AI Twitter（通过 RSS）**
   - nitter.net (或其他 Twitter RSS 转换服务)

## 示例：快速开始

### 最简单的方式（无需 Folo）

1. 配置基本的 GitHub Secrets：
   - `DEEPSEEK_API_KEY`
   - `DEEPSEEK_API_URL`（可选）
   - `WECHAT_WEBHOOK_URL`

2. 运行 `daily-notify-real.yml` 工作流

3. 系统会使用示例数据，您可以先测试整个流程是否正常

### 完整配置（使用真实数据）

1. 注册 Folo 账号并添加 RSS 源
2. 获取 `List ID`
3. 在 GitHub Secrets 中添加：
   - `NEWS_AGGREGATOR_LIST_ID`
   - 其他可选 Secrets 根据需要添加

4. 运行 `daily-notify-real.yml` 工作流

5. 系统会获取真实的 AI 新闻并推送

## 注意事项

- Folo 数据源是可选的，不影响核心功能
- 如果未配置 Folo，系统会使用示例数据
- 示例数据仅用于演示，不代表真实的 AI 行业动态
- 建议先用示例数据测试流程，确认无误后再配置真实数据源

## 故障排查

### 问题：获取 Folo 数据失败

**可能原因**：
- `NEWS_AGGREGATOR_LIST_ID` 配置错误
- Folo API 暂时不可用

**解决方法**：
1. 检查 List ID 是否正确
2. 查看工作流日志中的错误信息
3. 如果 Folo API 不可用，系统会自动降级到示例数据

### 问题：获取的新闻为空

**可能原因**：
- Folo 列表中没有数据
- 过滤天数设置过小

**解决方法**：
1. 检查 Folo 列表中是否有新闻
2. 调整 `FOLO_FILTER_DAYS` 参数（如改为 3 或 7）
3. 查看 Folo 列表的配置是否正确

## 下一步

配置完成后，建议：

1. 手动触发一次工作流测试
2. 查看企业微信群是否收到消息
3. 如果收到消息，可以设置定时任务自动运行
