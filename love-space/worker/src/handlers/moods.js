import { jsonResponse } from '../index.js';
import { generateUUID, formatDate, toTimestamp } from '../utils/helpers.js';

/**
 * 情绪记录处理器
 */
export async function handleMoods(request, env, user, ctx) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    return await getMoods(request, env, user);
  }

  if (request.method === 'POST') {
    return await createMood(request, env, user, ctx);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取情绪记录
 */
async function getMoods(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const startDate = url.searchParams.get('start_date') || formatDate(new Date(new Date().setDate(new Date().getDate() - 30)));
  const endDate = url.searchParams.get('end_date') || formatDate(new Date());
  const userId = url.searchParams.get('user_id');

  try {
    // 查询情绪记录
    const moods = await env.DB.prepare(`
      SELECT m.*, u.name as user_name
      FROM moods m
      JOIN users u ON m.user_id = u.id
      WHERE m.record_date BETWEEN ? AND ?
        AND (m.user_id = ? OR ? IS NULL OR m.user_id = ?)
      ORDER BY m.record_date DESC
    `).bind(startDate, endDate, user.id, userId || null, userId || null).all();

    // 计算统计数据
    const stats = await env.DB.prepare(`
      SELECT 
        AVG(mood_score) as average_score,
        COUNT(*) as total_records,
       MAX(CASE WHEN mood_score >= 7 THEN 1 ELSE 0 END) as good_days
      FROM moods
      WHERE record_date BETWEEN ? AND ? AND user_id = ?
    `).bind(startDate, endDate, user.id).first();

    return jsonResponse({
      success: true,
      data: {
        moods: moods.results || [],
        statistics: {
          average_score: Math.round(stats.average_score * 10) / 10 || 0,
          total_records: stats.total_records || 0,
          trend: stats.average_score >= 7 ? 'positive' : stats.average_score >= 5 ? 'neutral' : 'needs_attention'
        }
      }
    });

  } catch (error) {
    console.error('Get moods error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 记录今日情绪
 */
async function createMood(request, env, user, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { mood_type, mood_score, note } = body;
    const today = formatDate(new Date());

    // 验证必填字段
    if (!mood_type) {
      return jsonResponse(
        { error: 'Validation Error', message: 'mood_type 是必填项' },
        { status: 400 }
      );
    }

    // 检查今天是否已记录
    const existing = await env.DB.prepare(
      'SELECT id FROM moods WHERE user_id = ? AND record_date = ?'
    ).bind(user.id, today).first();

    if (existing) {
      return jsonResponse(
        { error: 'Conflict', message: '今日情绪已记录，每个用户每天只能记录一次' },
        { status: 409 }
      );
    }

    const id = generateUUID();
    const now = toTimestamp(new Date());

    await env.DB.prepare(`
      INSERT INTO moods (id, user_id, mood_type, mood_score, note, record_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      mood_type,
      mood_score || 5,
      note || null,
      today,
      now
    ).run();

    return jsonResponse({
      success: true,
      message: '情绪记录成功',
      data: {
        id,
        mood_type,
        mood_score: mood_score || 5,
        note,
        record_date: today
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create mood error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
