/**
 * 每日 AI 资讯推送脚本（真实数据版本）
 * 功能：抓取真实 AI 资讯 -> 使用 DeepSeek 生成摘要 -> 通过模板卡片推送到企业微信群
 */

import { callDeepSeekAPI } from '../src/chatapi.js';
import { fetchDataByCategory } from '../src/dataFetchers.js';

// 企业微信 Webhook URL
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * 发送消息到企业微信群（使用模板卡片）
 * @param {object} cardData - 卡片数据
 */
async function sendToWeChat(cardData) {
  if (!WECHAT_WEBHOOK_URL) {
    throw new Error('WECHAT_WEBHOOK_URL 环境变量未设置');
  }

  const payload = {
    msgtype: 'template_card',
    template_card: cardData
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
 * 获取今日 AI 资讯（真实数据）
 */
async function getDailyAIClues() {
  console.log('开始获取真实数据...');

  // 构建环境对象
  const env = {
    // DeepSeek 配置
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com',
    
    // Folo API 配置（可选，如果不配置则跳过）
    NEWS_AGGREGATOR_LIST_ID: process.env.NEWS_AGGREGATOR_LIST_ID || '',
    HGPAPERS_LIST_ID: process.env.HGPAPERS_LIST_ID || '',
    FOLO_DATA_API: 'https://api.follow.is',
    FOLO_FILTER_DAYS: process.env.FOLO_FILTER_DAYS || '1',
    NEWS_AGGREGATOR_FETCH_PAGES: process.env.NEWS_AGGREGATOR_FETCH_PAGES || '1',
  };

  const foloCookie = process.env.FOLO_COOKIE || '';

  let allNews = [];

  try {
    // 1. 尝试从 Folo 获取新闻（如果配置了的话）
    if (env.NEWS_AGGREGATOR_LIST_ID) {
      console.log('从 Folo 获取新闻数据...');
      const newsData = await fetchDataByCategory(env, 'news', foloCookie);
      if (newsData && newsData.length > 0) {
        console.log(`从 Folo 获取到 ${newsData.length} 条新闻`);
        allNews = newsData.map(item => ({
          title: item.title,
          url: item.url,
          summary: item.description || '',
          published_date: item.published_date,
          source: item.source
        }));
      }
    } else {
      console.log('未配置 NEWS_AGGREGATOR_LIST_ID，跳过 Folo 数据源');
    }
  } catch (error) {
    console.error('获取 Folo 数据失败:', error.message);
    // 继续使用备用数据源
  }

  // 2. 如果没有获取到数据，使用备用数据源或示例数据
  if (allNews.length === 0) {
    console.log('未获取到新闻数据，使用示例数据进行演示');
    allNews = [
      {
        title: 'OpenAI 发布 GPT-4.5 预览版',
        url: 'https://openai.com/blog/gpt-4-5-preview',
        summary: 'OpenAI 今日发布 GPT-4.5 预览版，在推理能力和安全性上都有显著提升。',
        published_date: new Date().toISOString(),
        source: '示例数据'
      },
      {
        title: 'Google Gemini 2.0 性能突破',
        url: 'https://blog.google/gemini-2-0',
        summary: 'Google 宣布 Gemini 2.0 在多项基准测试中超越 GPT-4，特别是在代码生成和多模态任务方面。',
        published_date: new Date().toISOString(),
        source: '示例数据'
      },
      {
        title: 'DeepSeek 开源新模型',
        url: 'https://github.com/deepseek-ai',
        summary: 'DeepSeek 发布开源大语言模型 DeepSeek-V3，在中文理解和推理任务上表现优异。',
        published_date: new Date().toISOString(),
        source: '示例数据'
      }
    ];
  }

  return {
    date: new Date().toISOString().split('T')[0],
    sources: allNews
  };
}

/**
 * 使用 DeepSeek 生成今日 AI 简讯摘要
 * @param {object} dailyData - 每日数据
 */
async function generateDailySummary(dailyData) {
  const systemPrompt = `你是一个专业的 AI 资讯编辑，负责为企业微信学习群生成每日 AI 简讯。

你的任务：
1. 从多条 AI 资讯中提取最重要的 2-3 条
2. 生成极简、客观、内参风格的摘要
3. 总字数严格控制在 100 字以内（中文字）
4. 不使用感叹号、营销话术、"必须"、"一定要"等词
5. 采用"内部简报"的语气
6. 突出技术突破和行业动态

输出格式：
直接输出摘要文本，不要使用 JSON 格式。`;

  const userPrompt = `以下是今日的 AI 资讯，请按要求生成简讯（100字以内）：

${dailyData.sources.map((s, i) => `${i + 1}. ${s.title}\n   ${s.summary}`).join('\n\n')}`;

  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY 环境变量未设置');
  }

  const env = {
    DEEPSEEK_API_KEY,
    DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com'
  };

  try {
    const result = await callDeepSeekAPI(env, userPrompt, systemPrompt);
    
    // 截取前100字
    const summary = result.substring(0, 100);
    console.log('生成摘要:', summary);
    
    return summary;
  } catch (error) {
    console.error('生成摘要失败:', error);
    throw error;
  }
}

/**
 * 构建企业微信模板卡片
 * @param {string} summary - AI 生成的摘要
 * @param {object} dailyData - 每日数据
 */
function buildTemplateCard(summary, dailyData) {
  const date = new Date().toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).replace(/\//g, '/');

  const card = {
    // 卡片类型：文本通知模版卡片
    card_type: 'text_notice',
    
    // 卡片来源信息
    source: {
      icon_url: 'https://wework.qpic.cn/wwpic/252813_jOfDHtcISzuodLa_1629280209/0',
      desc: 'AI 每日简讯',
      desc_color: 3  // 3代表绿色
    },
    
    // 主要内容
    main_title: {
      title: `${date} AI 简讯`,
      desc: '每日 AI 行业动态精选'
    },
    
    // 二级普通文本（摘要）
    sub_title_text: summary,
    
    // 横向内容列表（新闻列表，最多6条，这里使用2-3条）
    horizontal_content_list: dailyData.sources.slice(0, 3).map((source, index) => ({
      keyname: `新闻${index + 1}`,
      value: source.title.substring(0, 20),  // 限制在20字以内
      type: 1,  // 1表示URL
      url: source.url
    })),
    
    // 跳转指引列表（更多新闻）
    jump_list: [
      {
        type: 1,
        url: 'https://github.com/dumeym/CloudFlare-AI-Insight-Daily-dm',
        title: '查看全部'
      }
    ],
    
    // 整体卡片的点击跳转事件
    card_action: {
      type: 1,
      url: 'https://github.com/dumeym/CloudFlare-AI-Insight-Daily-dm'
    }
  };

  return card;
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('=== 开始执行每日 AI 简讯推送（真实数据版本）===');
    console.log(`执行时间: ${new Date().toISOString()}`);

    // 1. 获取今日 AI 资讯
    console.log('步骤 1: 获取今日 AI 资讯...');
    const dailyData = await getDailyAIClues();
    console.log(`获取到 ${dailyData.sources.length} 条资讯`);

    // 2. 使用 DeepSeek 生成摘要
    console.log('步骤 2: 使用 DeepSeek 生成摘要...');
    const summary = await generateDailySummary(dailyData);
    console.log('生成摘要:', summary);

    // 3. 构建模板卡片
    console.log('步骤 3: 构建模板卡片...');
    const card = buildTemplateCard(summary, dailyData);
    console.log('卡片数据:', JSON.stringify(card, null, 2));

    // 4. 推送到企业微信
    console.log('步骤 4: 推送到企业微信...');
    await sendToWeChat(card);
    console.log('推送成功！');

    console.log('=== 执行完成 ===');
  } catch (error) {
    console.error('执行失败:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
