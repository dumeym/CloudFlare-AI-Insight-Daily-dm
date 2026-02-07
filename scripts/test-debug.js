/**
 * 调试测试脚本
 * 用于验证各个组件是否正常工作
 */

import { callDeepSeekAPI } from '../src/chatapi.js';

// 从环境变量读取配置
const WECHAT_WEBHOOK_URL = process.env.WECHAT_WEBHOOK_URL;
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

console.log('=== 开始调试测试 ===\n');

// 测试 1: 检查环境变量
console.log('测试 1: 检查环境变量');
console.log('WECHAT_WEBHOOK_URL 是否存在:', !!WECHAT_WEBHOOK_URL);
console.log('WECHAT_WEBHOOK_URL 前缀:', WECHAT_WEBHOOK_URL ? WECHAT_WEBHOOK_URL.substring(0, 50) + '...' : 'N/A');
console.log('DEEPSEEK_API_KEY 是否存在:', !!DEEPSEEK_API_KEY);
console.log('DEEPSEEK_API_KEY 前缀:', DEEPSEEK_API_KEY ? DEEPSEEK_API_KEY.substring(0, 10) + '...' : 'N/A');
console.log('');

// 测试 2: 测试 DeepSeek API
async function testDeepSeek() {
  console.log('测试 2: 测试 DeepSeek API 调用...');

  if (!DEEPSEEK_API_KEY) {
    console.error('❌ DEEPSEEK_API_KEY 未设置，跳过测试');
    return;
  }

  try {
    const result = await callDeepSeekAPI(
      { DEEPSEEK_API_KEY, DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com' },
      '请说"测试成功"',
      '你是一个测试助手'
    );
    console.log('✅ DeepSeek API 调用成功');
    console.log('返回内容:', result);
  } catch (error) {
    console.error('❌ DeepSeek API 调用失败:', error.message);
  }
  console.log('');
}

// 测试 3: 测试企业微信 Webhook
async function testWeChatWebhook() {
  console.log('测试 3: 测试企业微信 Webhook 调用...');

  if (!WECHAT_WEBHOOK_URL) {
    console.error('❌ WECHAT_WEBHOOK_URL 未设置，跳过测试');
    return;
  }

  const testMessage = '【测试消息】\n\n这是一条来自 GitHub Actions 的测试消息。\n如果您看到这条消息，说明 Webhook 配置正确！';

  try {
    const response = await fetch(WECHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: testMessage
        }
      })
    });

    console.log('HTTP 状态码:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ 企业微信 Webhook 调用失败');
      console.error('HTTP 状态:', response.status);
      console.error('错误详情:', errorText);
    } else {
      const data = await response.json();
      console.log('✅ 企业微信 Webhook 调用成功');
      console.log('返回数据:', JSON.stringify(data, null, 2));
      console.log('\n请检查企业微信群是否收到测试消息！');
    }
  } catch (error) {
    console.error('❌ 企业微信 Webhook 调用异常:', error.message);
  }
  console.log('');
}

// 测试 4: 完整流程测试
async function testFullFlow() {
  console.log('测试 4: 完整流程测试...');

  try {
    const testPrompt = '请生成一条关于"AI技术发展"的简短摘要，不超过50字';
    const result = await callDeepSeekAPI(
      { DEEPSEEK_API_KEY, DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com' },
      testPrompt,
      '你是一个专业的资讯编辑'
    );

    const message = `【完整流程测试】\n\nAI 生成内容：\n${result}\n\n如果这条消息成功发送到企业微信群，说明整个流程都正常！`;

    await fetch(WECHAT_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        msgtype: 'text',
        text: {
          content: message
        }
      })
    });

    console.log('✅ 完整流程测试完成');
    console.log('请检查企业微信群！');
  } catch (error) {
    console.error('❌ 完整流程测试失败:', error.message);
  }
}

// 执行所有测试
async function runAllTests() {
  await testDeepSeek();
  await testWeChatWebhook();
  await testFullFlow();

  console.log('=== 所有测试完成 ===');
  console.log('请根据上述测试结果，确定问题所在：');
  console.log('1. 如果测试2失败，说明 DEEPSEEK_API_KEY 配置有问题');
  console.log('2. 如果测试3失败，说明 WECHAT_WEBHOOK_URL 配置有问题');
  console.log('3. 如果测试4失败，说明完整流程有问题');
}

runAllTests().catch(console.error);
