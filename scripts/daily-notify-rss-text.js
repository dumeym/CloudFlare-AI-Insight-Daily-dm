import { callDeepSeekAPI } from '../src/chatapi.js';

// 企业微信 Webhook URL
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com';

/**
 * 发送企业微信文本消息
 * @param {string} textContent - 文本内容
 */
async function sendWeChatNotification(textContent) {
    if (!WECHAT_WEBHOOK_URL) {
        throw new Error('WECHAT_WEBHOOK_URL 环境变量未设置');
    }

    const payload = {
        msgtype: 'text',
        text: {
            content: textContent
        }
    };

    try {
        const response = await fetch(WECHAT_WEBHOOK_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`企业微信推送失败 (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('发送到企业微信失败:', error);
        throw error;
    }
}

/**
 * 获取 RSS 数据
 */
async function fetchRSS(url) {
    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        return text;
    } catch (error) {
        console.error(`❌ 获取 RSS 数据失败: ${error.message}`);
        throw error;
    }
}

/**
 * 从 RSS XML 中提取最新的 item 内容
 */
function extractLatestItem(rssText) {
    try {
        // 查找第一个 <item> 标签
        const itemMatch = rssText.match(/<item>[\s\S]*?<\/item>/i);

        if (!itemMatch) {
            throw new Error('未找到 <item> 标签');
        }

        const itemContent = itemMatch[0];

        // 提取标题
        const titleMatch = itemContent.match(/<title>([\s\S]*?)<\/title>/i);
        let title = titleMatch ? titleMatch[1].trim() : '未知标题';

        // 解码 HTML 实体和 CDATA
        title = title.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
        title = title.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        title = title.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        title = title.replace(/&#39;/g, "'");

        // 提取内容（可能是 <description> 或 <content:encoded>）
        let contentMatch = itemContent.match(/<content:encoded>([\s\S]*?)<\/content:encoded>/i);
        if (!contentMatch) {
            contentMatch = itemContent.match(/<description>([\s\S]*?)<\/description>/i);
        }

        let content = contentMatch ? contentMatch[1] : '';

        // 解码 HTML 实体和 CDATA
        content = content.replace(/<!\[CDATA\[/g, '').replace(/\]\]>/g, '');
        content = content.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        content = content.replace(/&amp;/g, '&').replace(/&quot;/g, '"');
        content = content.replace(/&#39;/g, "'");

        console.log(`✓ 提取到最新条目: ${title}`);
        console.log(`✓ 内容长度: ${content.length} 字符`);

        return {
            title,
            content,
            raw: itemContent
        };
    } catch (error) {
        console.error(`❌ 提取 item 内容失败: ${error.message}`);
        throw error;
    }
}

/**
 * 从 RSS 标题中提取日期
 * @param {string} title - RSS 标题，例如 "2026-02-06日刊"
 * @returns {Date} 日期对象
 */
function extractDateFromTitle(title) {
    try {
        // 匹配日期格式：YYYY-MM-DD
        const dateMatch = title.match(/(\d{4})-(\d{2})-(\d{2})/);
        if (dateMatch) {
            const [, year, month, day] = dateMatch;
            return new Date(`${year}-${month}-${day}T00:00:00Z`);
        }
        // 如果没有匹配到，返回前一天
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    } catch (error) {
        console.warn(`⚠️ 无法从标题提取日期，使用前一天: ${title}`);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return yesterday;
    }
}

/**
 * 使用 DeepSeek 处理 RSS 内容
 */
async function generateNewsFromRSS(content) {
    console.log('\n步骤 2: 使用 DeepSeek 处理 RSS 内容...');

    const systemPrompt = `你是一个专业的AI资讯处理助手。请分析以下 AI 日报内容，并按照要求输出。

【要求】
1. 必须过滤掉所有推广信息，包括但不限于：
   - "微信关注公众号"
   - "何夕2077"
   - "扫码关注"
   - "二维码"
   - "加我进群"
   - "前往官网查看完整版"
   - "AI日报的小调整"相关的推广内容
   - 任何诱导点击、关注、付费的内容

2. 提取 4-5 条最重要的新闻，每个新闻必须完整显示（不要截断），包含：
   - 分类（四字，如：产品速报、前沿研究、行业展望等）
   - 新闻完整标题和内容（不要截断）

3. 按照以下格式输出（不要添加任何其他文字）：

分类1：新闻完整内容
分类2：新闻完整内容
分类3：新闻完整内容
分类4：新闻完整内容
分类5：新闻完整内容

4. 确保每条新闻的内容完整，不要因为字数限制而截断。`;

    const userPrompt = `【RSS 内容】
${content}`;

    const env = {
        DEEPSEEK_API_KEY,
        DEEPSEEK_API_URL
    };

    try {
        const result = await callDeepSeekAPI(env, userPrompt, systemPrompt);

        console.log(`✓ DeepSeek 处理完成`);

        return result;
    } catch (error) {
        console.error(`❌ DeepSeek 处理失败: ${error.message}`);
        throw error;
    }
}

/**
 * 构建企业微信文本消息
 */
function buildWeChatText(newsContent, rssTitle) {
    // 从 RSS 标题中提取日期
    const articleDate = extractDateFromTitle(rssTitle);
    const year = articleDate.getFullYear();
    const month = String(articleDate.getMonth() + 1).padStart(2, '0');
    const day = String(articleDate.getDate()).padStart(2, '0');

    console.log(`✓ 使用 RSS 日期: ${year}-${month}-${day} (标题: ${rssTitle})`);

    // 构建文本消息
    const text = `${year}年${month}月${day}日AI简讯
同济院每日AI行业动态精选

${newsContent}

如有意见请@杜明修改

查看全部：https://github.com/dumeym/AI-insight-daily-dm`;

    return text;
}

/**
 * 主函数
 */
async function main() {
    console.log('============================================================');
    console.log('开始执行每日 AI 简讯推送（RSS 版本 - 文本消息）');
    console.log('============================================================');
    console.log(`执行时间: ${new Date().toISOString()}`);

    const RSS_URL = 'https://justlovemaki.github.io/CloudFlare-AI-Insight-Daily/rss.xml';
    const IS_DRY_RUN = process.env.DRY_RUN === 'true';

    try {
        // 步骤 1: 获取 RSS 数据
        console.log('\n步骤 1: 获取 RSS 数据...');
        console.log('------------------------------------------------------------');

        const rssText = await fetchRSS(RSS_URL);
        console.log('✓ RSS 数据获取成功');

        // 步骤 2: 提取最新 item
        const item = extractLatestItem(rssText);

        // 步骤 3: 使用 DeepSeek 处理
        const newsContent = await generateNewsFromRSS(item.content);

        // 步骤 4: 构建文本消息
        const text = buildWeChatText(newsContent, item.title);

        console.log('\n步骤 3: 构建企业微信文本消息...');
        console.log('✓ 文本消息构建完成');

        // 步骤 5: 发送或打印
        if (IS_DRY_RUN) {
            console.log('\n========== 文本内容（测试模式，不实际发送）==========');
            console.log(text);
            console.log('========================================================');

            console.log('\n✅ 测试完成！文本消息已生成，未发送到企业微信。');
        } else {
            console.log('\n步骤 4: 发送到企业微信...');
            const result = await sendWeChatNotification(text);

            if (result.errcode === 0) {
                console.log('✅ 推送成功！');
            } else {
                throw new Error(`推送失败: ${result.errmsg}`);
            }
        }

        console.log('\n============================================================');
        console.log('✅ 执行成功');
        console.log('============================================================');

    } catch (error) {
        console.error('\n============================================================');
        console.log('❌ 执行失败:', error.message);
        console.log('============================================================');
        console.error('\n错误详情:', error);
        process.exit(1);
    }
}

// 运行主函数
main();
