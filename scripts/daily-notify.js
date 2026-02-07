/**
 * 每日 AI 资讯推送脚本
 * 功能：抓取 AI 资讯 -> 使用 DeepSeek 生成摘要 -> 推送到企业微信群
 */

import { callDeepSeekAPI } from '../src/chatapi.js';

// 企业微信 Webhook URL
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * 发送消息到企业微信群
 * @param {string} content - 消息内容
 */
async function sendToWeChat(content) {
  if (!WECHAT_WEBHOOK_URL) {
    throw new Error('WECHAT_WEBHOOK_URL 环境变量未设置');
  }

  const payload = {
    msgtype: 'text',
    text: {
      content: content
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
    console.log('企业微信推送成功:', data);

    return data;
  } catch (error) {
    console.error('发送到企业微信失败:', error);
    throw error;
  }
}

/**
 * 获取今日 AI 资讯（示例数据，实际应该从 RSS 或其他数据源获取）
 */
async function getDailyAIClues() {
  // TODO: 实现真实的数据抓取逻辑
  // 这里先用模拟数据
  const today = new Date().toISOString().split('T')[0];

  // 示例：从多个 RSS 源抓取 AI 资讯
  const mockData = {
    date: today,
    sources: [
      {
        title: 'OpenAI 发布 GPT-4.5 预览版',
        url: 'https://openai.com/blog/gpt-4-5-preview',
        summary: 'OpenAI 今日发布 GPT-4.5 预览版，在推理能力和安全性上都有显著提升。'
      },
      {
        title: 'Google Gemini 2.0 性能突破',
        url: 'https://blog.google/gemini-2-0',
        summary: 'Google 宣布 Gemini 2.0 在多项基准测试中超越 GPT-4，特别是在代码生成和多模态任务方面。'
      },
      {
        title: 'DeepSeek 开源新模型',
        url: 'https://github.com/deepseek-ai',
        summary: 'DeepSeek 发布开源大语言模型 DeepSeek-V3，在中文理解和推理任务上表现优异。'
      }
    ]
  };

  return mockData;
}

/**
 * 使用 DeepSeek 生成今日 AI 简讯摘要
 * @param {object} dailyData - 每日数据
 */
async function generateDailySummary(dailyData) {
  const systemPrompt = `你是一个专业的 AI 资讯编辑，负责为企业微信学习群生成每日 AI 简讯。

你的任务：
1. 从多条 AI 资讯中提取最重要的 1-2 条
2. 生成极简、客观、内参风格的摘要
3. 字数严格控制在 80 字以内（中文字）
4. 不使用感叹号、营销话术、"必须"、"一定要"等词
5. 采用"内部简报"的语气

输出格式：
{
  "title": "一句话判断（20字内）",
  "summary": "事实简述（60字内）"
}`;

  const userPrompt = `以下是今日的 AI 资讯，请按要求生成简讯：

${dailyData.sources.map(s => `- ${s.title}: ${s.summary}`).join('\n')}

请生成一条简讯，字数控制在 80 字以内。`;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未设置');
  }

  const env = {
    DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com'
  };

  try {
    const result = await callDeepSeekAPI(env, userPrompt, systemPrompt);

    // 尝试解析 JSON
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.warn('无法解析 JSON 格式，使用原始文本');
    }

    // 如果无法解析 JSON，使用原始文本
    return {
      title: '今日 AI 动态',
      summary: result.substring(0, 80)
    };
  } catch (error) {
    console.error('生成摘要失败:', error);
    throw error;
  }
}

/**
 * 格式化推送消息
 * @param {object} summary - AI 生成的摘要
 * @param {object} dailyData - 每日数据
 */
function formatMessage(summary, dailyData) {
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  let message = `【${date} AI 简讯】\n\n`;
  message += `${summary.title}\n`;
  message += `${summary.summary}\n\n`;

  // 添加来源链接（最多 2 条）
  if (dailyData.sources && dailyData.sources.length > 0) {
    const topSources = dailyData.sources.slice(0, 2);
    message += `来源：\n`;
    topSources.forEach((source, index) => {
      message += `${index + 1}. ${source.title}\n   ${source.url}\n`;
    });
  }

  return message;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('=== 开始执行每日 AI 简讯推送 ===');
    console.log(`执行时间: ${new Date().toISOString()}`);

    // 1. 获取今日 AI 资讯
    console.log('步骤 1: 获取今日 AI 资讯...');
    const dailyData = await getDailyAIClues();
    console.log(`获取到 ${dailyData.sources.length} 条资讯`);

    // 2. 使用 DeepSeek 生成摘要
    console.log('步骤 2: 使用 DeepSeek 生成摘要...');
    const summary = await generateDailySummary(dailyData);
    console.log('生成摘要:', summary);

    // 3. 格式化消息
    console.log('步骤 3: 格式化消息...');
    const message = formatMessage(summary, dailyData);
    console.log('消息内容:', message);

    // 4. 推送到企业微信
    console.log('步骤 4: 推送到企业微信...');
    await sendToWeChat(message);
    console.log('推送成功！');

    console.log('=== 执行完成 ===');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
