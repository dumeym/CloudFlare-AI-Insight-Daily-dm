/**
 * 每日 AI 资讯推送脚本（RSS 版本）
 * 功能：从 RSS 源获取 AI 资讯 -> 过滤推广 -> DeepSeek 生成摘要 -> 模板卡片
 */

import { callDeepSeekAPI } from '../src/chatapi.js';

// 配置
const RSS_URL = 'https://justlovemaki.github.io/CloudFlare-AI-Insight-Daily/rss.xml';
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// 需要过滤的推广关键词
const SPAM_KEYWORDS = [
  '微信关注公众号',
  '何夕2077',
  '关注公众号',
  '扫码关注',
  '二维码',
  '剩余内容已省略',
  '关于运营调整',
  '邮件沟通',
  '加我进群'
];

/**
 * 简单的 HTML 解析器
 * @param {string} html - HTML 内容
 * @returns {Array} 新闻条目数组
 */
function parseNewsFromHTML(html) {
  const newsItems = [];
  
  // 清理 CDATA 标记
  let cleanedHtml = html.replace(/<!\[CDATA\[|]]>/g, '');
  
  // 移除推广信息
  SPAM_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`[^]*${keyword}[^]*`, 'gi');
    cleanedHtml = cleanedHtml.replace(regex, '');
  });
  
  // 找到所有 <h3> 标签
  const h3Pattern = /<h3[^>]*>([^<]+)<\/h3>/gi;
  let h3Match;
  let currentCategory = '';
  
  // 用于存储每个分类下的新闻
  const categoryNews = [];
  
  while ((h3Match = h3Pattern.exec(cleanedHtml)) !== null) {
    currentCategory = h3Match[1].trim();
    console.log(`发现分类: ${currentCategory}`);
    
    // 找到这个 <h3> 后面的 <ol> 内容
    const afterH3 = cleanedHtml.substring(h3Match.index + h3Match[0].length);
    const olPattern = /<ol[^>]*>([\s\S]*?)<\/ol>/i;
    const olMatch = afterH3.match(olPattern);
    
    if (olMatch) {
      // 提取 <li> 标签
      const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/gi;
      let liMatch;
      let itemIndex = 0;
      
      while ((liMatch = liPattern.exec(olMatch[1])) !== null) {
        let text = liMatch[1];
        
        // 提取链接（如果有的话）
        const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/i;
        const linkMatch = text.match(linkPattern);
        
        let title = '';
        let url = '';
        
        if (linkMatch) {
          title = linkMatch[2].trim();
          url = linkMatch[1];
        } else {
          // 没有链接，直接使用文本
          title = text.replace(/<[^>]+>/g, '').trim();
        }
        
        // 跳过空内容和推广内容
        if (title && title.length > 5) {
          categoryNews.push({
            category: currentCategory,
            title: title,
            url: url,
            fullText: text
          });
          itemIndex++;
        }
      }
    }
    
    // 更新搜索位置，避免重复
    cleanedHtml = cleanedHtml.substring(h3Match.index + h3Match[0].length);
  }
  
  console.log(`总共提取到 ${categoryNews.length} 条新闻`);
  
  // 打印前几条用于调试
  categoryNews.slice(0, 5).forEach((item, index) => {
    console.log(`  ${index + 1}. [${item.category}] ${item.title.substring(0, 40)}...`);
  });
  
  return categoryNews;
}

/**
 * 解析 RSS XML 并提取最新条目
 * @param {string} xmlContent - RSS XML 内容
 * @returns {Object} 包含标题、链接、内容等
 */
function parseRSS(xmlContent) {
  // 提取 <item> 标签内的内容
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  const match = itemPattern.exec(xmlContent);
  
  if (!match) {
    throw new Error('RSS 中没有找到 <item> 标签');
  }
  
  const itemContent = match[1];
  
  // 提取标题
  const titleMatch = itemContent.match(/<title><!\[CDATA\[([^]]+)\]\]><\/title>/);
  const title = titleMatch ? titleMatch[1] : '';
  
  // 提取 content:encoded
  const contentMatch = itemContent.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
  const content = contentMatch ? contentMatch[1] : '';
  
  // 提取发布日期
  const pubDateMatch = itemContent.match(/<pubDate>([^<]+)<\/pubDate>/);
  const pubDate = pubDateMatch ? pubDateMatch[1] : '';
  
  // 提取链接
  const linkMatch = itemContent.match(/<link>([^<]+)<\/link>/);
  const link = linkMatch ? linkMatch[1] : '';
  
  if (!content) {
    throw new Error('RSS 条目中没有找到 content:encoded');
  }
  
  return {
    title: title,
    content: content,
    pubDate: pubDate,
    link: link
  };
}

/**
 * 获取今日 AI 资讯（从 RSS）
 */
async function getDailyAIClues() {
  console.log('开始获取 RSS 数据...\n');
  
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      throw new Error(`RSS 请求失败: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    console.log('✓ RSS 数据获取成功');
    
    // 解析 RSS
    const rssItem = parseRSS(xmlContent);
    console.log(`✓ 最新条目: ${rssItem.title}`);
    console.log(`✓ 发布日期: ${rssItem.pubDate}`);
    
    // 提取新闻条目
    const newsItems = parseNewsFromHTML(rssItem.content);
    
    if (newsItems.length === 0) {
      throw new Error('未能提取到任何新闻条目');
    }
    
    return {
      date: new Date().toISOString().split('T')[0],
      rssTitle: rssItem.title,
      link: rssItem.link,
      sources: newsItems.slice(0, 10) // 最多取 10 条
    };
    
  } catch (error) {
    console.error('❌ 获取 RSS 数据失败:', error.message);
    throw error;
  }
}

/**
 * 使用 DeepSeek 生成今日 AI 简讯摘要
 * @param {object} dailyData - 每日数据
 */
async function generateDailySummary(dailyData) {
  console.log('\n开始生成摘要...');

  const systemPrompt = `你是一个专业的 AI 资讯编辑，负责为企业微信学习群生成每日 AI 简讯。

你的任务：
1. 从提供的多条 AI 资讯中提取最重要的 2-3 条
2. 生成极简、客观、内参风格的摘要
3. 总字数严格控制在 100 字以内（中文字）
4. 不使用感叹号、营销话术、"必须"、"一定要"等词
5. 采用"内部简报"的语气
6. 突出技术突破和行业动态

输出格式：
直接输出摘要文本，不要使用 JSON 格式，不要包含任何编号。`;

  const userPrompt = `以下是今日的 AI 资讯，请按要求生成简讯（100字以内）：

${dailyData.sources.map((s, i) => `${i + 1}. ${s.title}`).join('\n')}`;

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
    const summary = result.substring(0, 100).trim();
    console.log('✓ 生成摘要:', summary);
    
    return summary;
  } catch (error) {
    console.error('❌ 生成摘要失败:', error);
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
    
    // 横向内容列表（新闻列表，最多6条）
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
        url: dailyData.link || 'https://justlovemaki.github.io/CloudFlare-AI-Insight-Daily/',
        title: '查看全部'
      }
    ],
    
    // 整体卡片的点击跳转事件
    card_action: {
      type: 1,
      url: dailyData.link || 'https://justlovemaki.github.io/CloudFlare-AI-Insight-Daily/'
    }
  };

  return card;
}

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
    console.log('✓ 企业微信推送成功');
    console.log('  返回数据:', data);

    return data;
  } catch (error) {
    console.error('❌ 发送到企业微信失败:', error);
    throw error;
  }
}

/**
 * 主函数（测试模式 - 只打印，不发送）
 */
async function main() {
  try {
    console.log('='.repeat(60));
    console.log('开始执行每日 AI 简讯推送（RSS 版本 - 测试模式）');
    console.log('='.repeat(60));
    console.log(`执行时间: ${new Date().toISOString()}\n`);

    // 1. 获取今日 AI 资讯
    console.log('步骤 1: 获取今日 AI 资讯');
    console.log('-'.repeat(60));
    const dailyData = await getDailyAIClues();
    console.log(`✓ 获取到 ${dailyData.sources.length} 条资讯\n`);

    // 2. 使用 DeepSeek 生成摘要
    console.log('步骤 2: 使用 DeepSeek 生成摘要');
    console.log('-'.repeat(60));
    const summary = await generateDailySummary(dailyData);
    console.log('');

    // 3. 构建模板卡片
    console.log('步骤 3: 构建模板卡片');
    console.log('-'.repeat(60));
    const card = buildTemplateCard(summary, dailyData);
    console.log('✓ 卡片构建完成\n');

    // 4. 打印卡片内容（不发送）
    console.log('='.repeat(60));
    console.log('卡片内容（测试模式，不实际发送）');
    console.log('='.repeat(60));
    console.log(JSON.stringify(card, null, 2));
    console.log('='.repeat(60));

    console.log('\n=== 测试完成 ===');
    console.log('注意：当前为测试模式，卡片内容已在上方打印，未发送到企业微信');
    console.log('如需实际发送，请运行 daily-notify-rss.yml 工作流');

  } catch (error) {
    console.error('\n' + '='.repeat(60));
    console.error('❌ 执行失败:', error.message);
    console.error('='.repeat(60));
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
