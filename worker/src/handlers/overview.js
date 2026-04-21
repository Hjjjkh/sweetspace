import { jsonResponse } from '../index.js';
import { formatDate } from '../utils/helpers.js';

/**
 * 关系概览处理器
 */
export async function handleOverview(request, env, user) {
  if (!user || !user.id) {
    return jsonResponse({ success: true, data: { summary: null, stats: {} } });
  }

  try {
    // 使用视图获取概览数据
    const overview = await env.DB.prepare(`
      SELECT 
        total_events,
        total_messages,
        moods_last_7days,
        completed_tasks,
        relationship_start_date,
        days_together
      FROM v_relationship_overview
    `).first();

    // 获取最近 7 天气情绪趋势
    const recentMoods = await env.DB.prepare(`
      SELECT moods.user_id, moods.record_date as date, moods.mood_type, moods.mood_score, users.name
      FROM moods
      JOIN users ON moods.user_id = users.id
      WHERE moods.record_date >= date('now', '-7 days')
      ORDER BY moods.record_date DESC
    `).all();

    // 计算连续互动天数 (streak)
    const streakDays = await calculateStreakDays(env, user);

    // 获取即将到来的纪念日
    const upcomingAnniversaries = await getUpcomingAnniversaries(env);

    return jsonResponse({
      success: true,
      data: {
        days_together: Math.floor(overview?.days_together || 0),
        total_events: overview?.total_events || 0,
        total_messages: overview?.total_messages || 0,
        relationship_start_date: overview?.relationship_start_date,
        recent_moods: recentMoods.results?.slice(0, 7) || [],
        streak_days: streakDays,
        upcoming_anniversaries: upcomingAnniversaries
      }
    });

  } catch (error) {
    console.error('Get overview error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 计算连续互动天数
 */
async function calculateStreakDays(env, user) {
  try {
    // 检查最近连续有活动的天数 (事件、留言、情绪、问答)
    const result = await env.DB.prepare(`
      WITH recent_activity AS (
        SELECT date(created_at, 'unixepoch') as activity_date FROM events WHERE user_id = ?
        UNION
        SELECT date(created_at, 'unixepoch') FROM messages WHERE sender_id = ?
        UNION
        SELECT record_date FROM moods WHERE user_id = ?
        UNION
        SELECT date(created_at, 'unixepoch') FROM daily_answers WHERE user_id = ?
      )
      SELECT COUNT(DISTINCT activity_date) as days
      FROM recent_activity
      WHERE activity_date >= date('now', '-30 days')
    `).bind(user.id, user.id, user.id, user.id).first();

    return result?.days || 0;

  } catch (error) {
    console.error('Calculate streak error:', error);
    return 0;
  }
}

/**
 * 获取即将到来的纪念日
 */
async function getUpcomingAnniversaries(env) {
  try {
    // 获取第一事件作为关系开始日期
    const startDate = await env.DB.prepare(`
      SELECT MIN(event_date) as start_date FROM events WHERE category = 'anniversary' OR category = 'first_time'
    `).first();

    if (!startDate?.start_date) {
      return [];
    }

    const anniversaries = [];
    const startDateObj = new Date(startDate.start_date);
    const now = new Date();
    const currentYear = now.getFullYear();

    // 计算今年的纪念日
    const thisYearAnniversary = new Date(currentYear, startDateObj.getMonth(), startDateObj.getDate());
    
    // 如果今年的纪念日已过，计算明年的
    if (thisYearAnniversary < now) {
      thisYearAnniversary.setFullYear(currentYear + 1);
    }

    const daysUntil = Math.floor((thisYearAnniversary - now) / (1000 * 60 * 60 * 24));
    const yearsTogether = thisYearAnniversary.getFullYear() - startDateObj.getFullYear();

    anniversaries.push({
      date: thisYearAnniversary.toISOString().split('T')[0],
      name: `${yearsTogether}周年纪念`,
      days_until: daysUntil,
      type: 'anniversary'
    });

    return anniversaries;

  } catch (error) {
    console.error('Get anniversaries error:', error);
    return [];
  }
}
