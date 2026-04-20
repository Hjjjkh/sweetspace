import { jsonResponse } from '../index.js';
import { generateUUID, formatDate, toTimestamp } from '../utils/helpers.js';

/**
 * 每日互动问答处理器
 */
export async function handleDailyQuestions(request, env, user, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);

  // GET /api/daily/current
  if (pathSegments[pathSegments.length - 1] === 'current') {
    return await getCurrentDailyQuestion(request, env, user);
  }

  // GET /api/daily/history
  if (pathSegments[pathSegments.length - 1] === 'history') {
    return await getDailyHistory(request, env, user);
  }

  // POST /api/daily/answer
  if (pathSegments[pathSegments.length - 1] === 'answer') {
    return await submitDailyAnswer(request, env, user, ctx);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取今日问题
 */
async function getCurrentDailyQuestion(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const today = formatDate(new Date());

  try {
    // 获取今日问题
    const question = await env.DB.prepare(
      'SELECT * FROM daily_questions WHERE date = ?'
    ).bind(today).first();

    if (!question) {
      return jsonResponse({
        success: true,
        data: {
          question: null,
          message: '今日问题尚未生成'
        }
      });
    }

    // 获取我的答案
    const myAnswer = await env.DB.prepare(
      'SELECT * FROM daily_answers WHERE question_id = ? AND user_id = ?'
    ).bind(question.id, user.id).first();

    // 获取伴侣的答案 (仅当对方设置可见时)
    let partnerAnswer = null;
    if (user.partner_id) {
      const partnerAns = await env.DB.prepare(
        'SELECT answer, is_visible_to_partner FROM daily_answers WHERE question_id = ? AND user_id = ?'
      ).bind(question.id, user.partner_id).first();

      if (partnerAns && partnerAns.is_visible_to_partner) {
        partnerAnswer = {
          answer: partnerAns.answer
        };
      }
    }

    return jsonResponse({
      success: true,
      data: {
        question: {
          id: question.id,
          question: question.question,
          category: question.category,
          date: question.date
        },
        my_answer: myAnswer ? {
          id: myAnswer.id,
          answer: myAnswer.answer,
          is_visible_to_partner: myAnswer.is_visible_to_partner
        } : null,
        partner_answer: partnerAnswer
      }
    });

  } catch (error) {
    console.error('Get daily question error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 提交每日答案
 */
async function submitDailyAnswer(request, env, user, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { question_id, answer, is_visible_to_partner } = body;

    // 验证必填字段
    if (!question_id || !answer || answer.trim().length === 0) {
      return jsonResponse(
        { error: 'Validation Error', message: 'question_id 和 answer 是必填项' },
        { status: 400 }
      );
    }

    // 检查问题是否存在
    const question = await env.DB.prepare(
      'SELECT * FROM daily_questions WHERE id = ?'
    ).bind(question_id).first();

    if (!question) {
      return jsonResponse(
        { error: 'Not Found', message: '问题不存在' },
        { status: 404 }
      );
    }

    // 检查是否已回答
    const existing = await env.DB.prepare(
      'SELECT id FROM daily_answers WHERE question_id = ? AND user_id = ?'
    ).bind(question_id, user.id).first();

    if (existing) {
      return jsonResponse(
        { error: 'Conflict', message: '你已经回答过这个问题了' },
        { status: 409 }
      );
    }

    const id = generateUUID();
    const now = toTimestamp(new Date());

    await env.DB.prepare(`
      INSERT INTO daily_answers (id, question_id, user_id, answer, is_visible_to_partner, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      question_id,
      user.id,
      answer.trim(),
      is_visible_to_partner !== false ? 1 : 0,
      now,
      now
    ).run();

    // 更新问题的回答状态
    const updateField = user.id === (await env.DB.prepare('SELECT user_id FROM daily_questions WHERE id = ?').bind(question_id).first())?.user_id 
      ? 'is_answered_user1' 
      : 'is_answered_user2';
    
    // 简化处理：更新两个字段中的任意一个
    await env.DB.prepare(`
      UPDATE daily_questions 
      SET is_answered_user1 = CASE WHEN is_answered_user1 = 0 THEN 1 ELSE is_answered_user1 END,
          is_answered_user2 = CASE WHEN is_answered_user2 = 0 THEN 1 ELSE is_answered_user2 END
      WHERE id = ?
    `).bind(question_id).run();

    return jsonResponse({
      success: true,
      message: '答案提交成功',
      data: {
        id,
        answer: answer.trim(),
        is_visible_to_partner: is_visible_to_partner !== false
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Submit daily answer error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 获取历史问答记录
 */
async function getDailyHistory(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit')) || 30;

  try {
    const history = await env.DB.prepare(`
      SELECT 
        q.id as question_id,
        q.question,
        q.category,
        q.date,
        a.id as answer_id,
        a.answer as my_answer,
        a.is_visible_to_partner
      FROM daily_questions q
      LEFT JOIN daily_answers a ON q.id = a.question_id AND a.user_id = ?
      ORDER BY q.date DESC
      LIMIT ?
    `).bind(user.id, limit).all();

    return jsonResponse({
      success: true,
      data: {
        history: history.results || []
      }
    });

  } catch (error) {
    console.error('Get daily history error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
