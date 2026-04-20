import { jsonResponse } from '../index.js';
import { generateUUID, formatDate } from '../utils/helpers.js';

/**
 * Cron 定时任务处理器
 */
export async function handleCron(request, env, ctx) {
  // 验证 Cron 请求 (生产环境由 Cloudflare 调用)
  const cronHeader = request.headers.get('X-Cron-Secret');
  if (env.ENVIRONMENT === 'production' && cronHeader !== env.CRON_SECRET) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const today = formatDate(new Date());

    // 1. 生成今日问题
    await generateDailyQuestion(env, today);

    // 2. 检查待解锁的留言
    await processScheduledMessages(env);

    // 3. 检查到期的任务
    await processDueTasks(env);

    return jsonResponse({
      success: true,
      message: 'Cron 任务执行成功',
      data: {
        date: today,
        tasks: ['generate_daily_question', 'process_scheduled_messages', 'process_due_tasks']
      }
    });

  } catch (error) {
    console.error('Cron job error:', error);
    return jsonResponse(
      { error: 'Cron job failed', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 生成每日问题
 */
async function generateDailyQuestion(env, date) {
  // 检查今日问题是否已存在
  const existing = await env.DB.prepare(
    'SELECT id FROM daily_questions WHERE date = ?'
  ).bind(date).first();

  if (existing) {
    console.log(`今日问题已存在：${date}`);
    return;
  }

  // 问题库
  const questions = {
    general: [
      '今天你最想对我说什么？',
      '今天发生了什么开心的事情想和我分享？',
      '今天你觉得我们之间的哪个瞬间最美好？',
      '今天的你，心情怎么样？',
      '有什么事情是我今天可以为你做的吗？'
    ],
    deep: [
      '你觉得我们的关系最近有什么变化吗？',
      '最近有什么事情让你感到压力吗？',
      '你对我们的未来有什么新的期待？',
      '你觉得我们在沟通上有什么可以改进的地方？',
      '最近有什么事情让你感到被爱？'
    ],
    fun: [
      '如果可以重来，你最想重现我们的哪个回忆？',
      '你觉得我最像什么动物？为什么？',
      '如果我们一起去旅行，你最想去哪里？',
      '用三个词形容今天的我',
      '你最想和我一起做什么疯狂的事情？'
    ],
    memory: [
      '你还记得我们第一次见面时的场景吗？',
      '我们在一起后，你最感动的瞬间是什么？',
      '你最珍藏的我们的照片是哪一张？',
      '我们一起做过的最有趣的事情是什么？',
      '你觉得哪个时刻让你确定"就是 TA 了"？'
    ],
    future: [
      '明年这个时候，你想我们在做什么？',
      '你对我们明年有什么期待？',
      '你想我们一起学习什么新技能？',
      '你理想中的周末是怎样的？',
      '有什么愿望是你希望我们一起实现的？'
    ]
  };

  // 随机选择类别和问题
  const categories = Object.keys(questions);
  const randomCategory = categories[Math.floor(Math.random() * categories.length)];
  const categoryQuestions = questions[randomCategory];
  const randomQuestion = categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)];

  const id = generateUUID();

  await env.DB.prepare(`
    INSERT INTO daily_questions (id, question, category, date, created_at)
    VALUES (?, ?, ?, ?, strftime('%s', 'now'))
  `).bind(id, randomQuestion, randomCategory, date).run();

  console.log(`生成今日问题 (${randomCategory}): ${randomQuestion}`);
}

/**
 * 处理定时留言 (到解锁时间)
 */
async function processScheduledMessages(env) {
  const now = Math.floor(Date.now() / 1000);

  const scheduledMessages = await env.DB.prepare(`
    SELECT m.*, sender.name as sender_name, recipient.name as recipient_name
    FROM messages m
    JOIN users sender ON m.sender_id = sender.id
    LEFT JOIN users recipient ON m.recipient_id = recipient.id
    WHERE m.reveal_at IS NOT NULL 
      AND m.reveal_at <= ? 
      AND m.is_hidden = 1
  `).bind(now).all();

  if (scheduledMessages.results && scheduledMessages.results.length > 0) {
    // 解锁留言
    const unlockStmt = env.DB.prepare(`
      UPDATE messages SET is_hidden = 0 WHERE id = ?
    `);

    const promises = scheduledMessages.results.map(msg => 
      unlockStmt.bind(msg.id).run()
    );

    await Promise.all(promises);

    console.log(`解锁 ${scheduledMessages.results.length} 条定时留言`);
  }
}

/**
 * 处理到期任务
 */
async function processDueTasks(env) {
  const today = formatDate(new Date());

  // 查找今天到期的任务
  const dueTasks = await env.DB.prepare(`
    SELECT * FROM tasks 
    WHERE due_date = ? AND is_completed = 0
  `).bind(today).all();

  if (dueTasks.results && dueTasks.results.length > 0) {
    console.log(`发现 ${dueTasks.results.length} 个到期任务`);
    // 可以在这里添加通知逻辑
  }
}

/**
 * 手动触发每日问题生成 (用于测试)
 */
export async function generateDailyQuestionManual(env, date = null) {
  const targetDate = date || formatDate(new Date());
  await generateDailyQuestion(env, targetDate);
}
