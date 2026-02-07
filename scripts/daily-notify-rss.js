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
  '二维码'
];

/**
 * 解析 RSS XML 并提取新闻条目
 * @param {string} xmlContent - RSS XML 内容
 * @returns {Array} 新闻数组
 */
function parseRSS(xmlContent) {
  // 简单的 XML 解析器（不依赖外部库）
  const items = [];
  
  // 提取所有 <item> 标签内的内容
  const itemPattern = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemPattern.exec(xmlContent)) !== null) {
    const itemContent = match[1];
    
    // 提取标题
    const titleMatch = itemContent.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/);
    const title = titleMatch ? titleMatch[1] : '';
    
    // 提取描述或内容
    const descMatch = itemContent.match(/<content:encoded><!\[CDATA\[([\s\S]*?)\]\]><\/content:encoded>/);
    const content = descMatch ? descMatch[1] : '';
    
    // 提取发布日期
    const pubDateMatch = itemContent.match(/<pubDate>(.*?)<\/pubDate>/);
    const pubDate = pubDateMatch ? pubDateMatch[1] : '';
    
    // 提取链接
    const linkMatch = itemContent.match(/<link>(.*?)<\/link>/);
    const link = linkMatch ? linkMatch[1] : '';
    
    if (content) {
      items.push({
        title: title,
        content: content,
        pubDate: pubDate,
        link: link
      });
    }
  }
  
  return items;
}

/**
 * 提取新闻条目（过滤掉推广信息）
 * @param {string} content - RSS 内容 HTML
 * @returns {Array} 新闻条目数组
 */
function extractNewsItems(content) {
  const newsItems = [];
  
  // 移除推广信息
  let cleanedContent = content;
  
  // 过滤包含推广关键词的内容段落
  SPAM_KEYWORDS.forEach(keyword => {
    // 移除包含关键词的段落
    cleanedContent = cleanedContent.replace(
      new RegExp(`[^\\n]*${keyword}[^\\n]*`, 'gi'),
      ''
    );
  });
  
  // 提取所有 <li> 标签的内容（通常新闻以列表形式呈现）
  const liPattern = /<li[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  
  while ((match = liPattern.exec(cleanedContent)) !== null) {
    let text = match[1];
    
    // 清理 HTML 标签
    text = text.replace(/<[^>]+>/g, '');
    // 清理 HTML 实体
    text = text.replace(/&nbsp;/g, ' ');
    text = text.replace(/&amp;/g, '&');
    text = text.replace(/&lt;/g, '<');
    text = text.replace(/&gt;/g, '>');
    // 清理多余空白
    text = text.trim();
    
    // 提取标题和链接（如果有的话）
    const linkPattern = /<a[^>]+href="([^"]+)"[^>]*>([^<]+)<\/a>/;
    const linkMatch = text.match(linkPattern);
    
    if (linkMatch) {
      newsItems.push({
        title: linkMatch[2].trim(),
        url: linkMatch[1],
        summary: text
      });
    } else if (text.length > 10) {
      // 没有链接但内容较长的条目
      newsItems.push({
        title: text.substring(0, 50),
        url: '',
        summary: text
      });
    }
  }
  
  // 过滤空内容和过短内容
  return newsItems.filter(item => 
    item.title && 
    item.title.length > 5 &&
    !item.title.includes('剩余内容已省略') &&
    !item.title.includes('关于运营调整')
  );
}

/**
 * 获取今日 AI 资讯（从 RSS）
 */
async function getDailyAIClues() {
  console.log('开始获取 RSS 数据...');
  
  try {
    const response = await fetch(RSS_URL);
    if (!response.ok) {
      throw new Error(`RSS 请求失败: ${response.status}`);
    }
    
    const xmlContent = await response.text();
    console.log('RSS 数据获取成功，开始解析...');
    
    // 解析 RSS
    const items = parseRSS(xmlContent);
    console.log(`解析到 ${items.length} 个条目`);
    
    // 获取最新的条目
    if (items.length === 0) {
      throw new Error('RSS 中没有找到任何条目');
    }
    
    const latestItem = items[0]; // RSS 通常按时间倒序排列
    console.log(`最新条目: ${latestItem.title}`);
    
    // 提取新闻条目
    const newsItems = extractNewsItems(latestItem.content);
    console.log(`提取到 ${newsItems.length} 条新闻（已过滤推广信息）`);
    
    return {
      date: new Date().toISOString().split('T')[0],
      rssTitle: latestItem.title,
      link: latestItem.link,
      sources: newsItems.slice(0, 10) // 最多取 10 条
    };
    
  } catch (error) {
    console.error('获取 RSS 数据失败:', error.message);
    throw error;
  }
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
7. 绝对不要包含任何推广信息、公众号推广、联系方式等

输出格式：
直接输出摘要文本，不要使用 JSON 格式。`;

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
 * 主函数（测试模式 - 只打印，不发送）
 */
async function main() {
  try {
    console.log('=== 开始执行每日 AI 简讯推送（RSS 版本 - 测试模式）===');
    console.log(`执行时间: ${new Date().toISOString()}`);

    // 1. 获取今日 AI 资讯
    console.log('\n步骤 1: 获取今日 AI 资讯...');
    const dailyData = await getDailyAIClues();
    console.log(`✓ 获取到 ${dailyData.sources.length} 条资讯`);
    console.log(`  RSS 标题: ${dailyData.rssTitle}`);

    // 2. 使用 DeepSeek 生成摘要
    console.log('\n步骤 2: 使用 DeepSeek 生成摘要...');
    const summary = await generateDailySummary(dailyData);
    console.log('✓ 生成摘要:', summary);

    // 3. 构建模板卡片
    console.log('\n步骤 3: 构建模板卡片...');
    const card = buildTemplateCard(summary, dailyData);
    console.log('✓ 卡片构建完成\n');

    // 4. 打印卡片内容（不发送）
    console.log('========== 卡片内容（测试模式，不实际发送）==========');
    console.log(JSON.stringify(card, null, 2));
    console.log('================================================');

    console.log('\n=== 测试完成 ===');
    console.log('注意：当前为测试模式，卡片内容已在上方打印，未发送到企业微信');
    console.log('如需实际发送，请将 TEST_MODE 设置为 false');

  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
