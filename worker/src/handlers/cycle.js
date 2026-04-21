// Cycle Health Module - API Handlers
// 生理周期 + 健康记录系统 API

import { 
  calculateCycleDay, 
  calculatePeriodPhase, 
  predictNextPeriod, 
  predictOvulation 
} from '../utils/cycleCalculator.js';

/**
 * 处理周期相关请求
 */
export async function handleCycle(request, env, user, ctx) {
  const url = new URL(request.url);
  const path = url.pathname.replace('/api/cycle/', '');

  try {
    switch (path) {
      case 'start':
        return await handleSetCycleStart(request, env, user);
      case 'week':
        return await handleGetWeekData(request, env, user);
      case 'daily':
        return await handleUpdateDaily(request, env, user, ctx);
      case 'overview':
        return await handleGetOverview(request, env, user);
      default:
        return new Response('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('Cycle API Error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}

/**
 * POST /api/cycle/start
 * 设置周期开始日期
 */
async function handleSetCycleStart(request, env, user) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { cycle_start_date, cycle_length = 28, period_length = 5 } = await request.json();

  if (!cycle_start_date) {
    return new Response(JSON.stringify({ error: 'cycle_start_date is required' }), { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // 计算预测信息
  const predicted_next = predictNextPeriod(cycle_start_date, cycle_length);
  const predicted_ov = predictOvulation(cycle_start_date, cycle_length);

  // 停用之前的周期
  await env.DB.prepare(
    'UPDATE cycle_logs SET is_active = 0, updated_at = ? WHERE user_id = ? AND is_active = 1'
  ).bind(now, user.id).run();

  // 创建新周期记录
  await env.DB.prepare(`
    INSERT INTO cycle_logs (id, user_id, cycle_start_date, cycle_length, period_length, 
                           predicted_next_start, predicted_ovulation, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `).bind(id, user.id, cycle_start_date, cycle_length, period_length, 
          predicted_next, predicted_ov, now, now).run();

  return new Response(JSON.stringify({
    success: true,
    data: {
      id,
      cycle_start_date,
      cycle_length,
      period_length,
      predicted_next_start: predicted_next,
      predicted_ovulation: predicted_ov
    }
  }), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * GET /api/cycle/week
 * 获取一周的健康数据
 */
async function handleGetWeekData(request, env, user) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 如果用户未登录，返回空数据
  if (!user || !user.id) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        current_cycle: null,
        days: []
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const url = new URL(request.url);
  const weekStart = url.searchParams.get('week_start') || new Date().toISOString().split('T')[0];

  // 获取当前活跃周期
  const cycle = await env.DB.prepare(`
    SELECT * FROM cycle_logs 
    WHERE user_id = ? AND is_active = 1 
    ORDER BY cycle_start_date DESC 
    LIMIT 1
  `).bind(user.id).first();

  // 获取一周的日期数组
  const dates = getWeekDates(weekStart);

  // 获取这些日期的健康记录
  const healthRecords = await env.DB.prepare(`
    SELECT * FROM daily_health 
    WHERE user_id = ? AND date IN (${dates.map(() => '?').join(',')})
    ORDER BY date
  `).bind(user.id, ...dates).all();
  
  const healthRecordsArray = healthRecords.results || [];

  // 计算每一天的周期信息
  const weekData = dates.map(date => {
    const health = healthRecordsArray.find(h => h.date === date);
    const cycleDay = cycle ? calculateCycleDay(cycle.cycle_start_date, date) : null;
    const periodPhase = cycle && cycleDay ? calculatePeriodPhase(cycleDay, cycle.period_length, cycle.cycle_length) : null;
    const isPeriod = cycle && cycleDay <= cycle.period_length;

    return {
      date,
      cycle_day: cycleDay,
      period_phase: periodPhase,
      is_period: isPeriod || false,
      mood_type: health?.mood_type,
      mood_score: health?.mood_score,
      flow_level: health?.flow_level || (isPeriod ? 'light' : 'none'),
      symptoms: health?.symptoms ? JSON.parse(health.symptoms) : [],
      habits: {
        water: health?.habit_water || 0,
        fruit: health?.habit_fruit || 0,
        breakfast: health?.habit_breakfast || 0,
        exercise: health?.habit_exercise || 0,
        bowel: health?.habit_bowel || 0
      },
      note: health?.note,
      has_record: !!health
    };
  });

  return new Response(JSON.stringify({
    success: true,
    data: {
      week_start: weekStart,
      week_end: dates[dates.length - 1],
      current_cycle: cycle ? {
        start_date: cycle.cycle_start_date,
        cycle_length: cycle.cycle_length,
        period_length: cycle.period_length,
        current_day: calculateCycleDay(cycle.cycle_start_date, new Date().toISOString().split('T')[0]),
        current_phase: calculatePeriodPhase(
          calculateCycleDay(cycle.cycle_start_date, new Date().toISOString().split('T')[0]),
          cycle.period_length,
          cycle.cycle_length
        )
      } : null,
      days: weekData
    }
  }), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * POST /api/cycle/daily
 * 更新每日健康记录
 */
async function handleUpdateDaily(request, env, user, ctx) {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { 
    date, 
    mood_type, 
    mood_score, 
    flow_level, 
    symptoms = [], 
    habits = {},
    note 
  } = await request.json();

  if (!date) {
    return new Response(JSON.stringify({ error: 'date is required' }), { status: 400 });
  }

  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  // 获取周期信息计算阶段
  const cycle = await env.DB.prepare(`
    SELECT * FROM cycle_logs 
    WHERE user_id = ? AND is_active = 1 
    ORDER BY cycle_start_date DESC 
    LIMIT 1
  `).bind(user.id).first();

  const cycleDay = cycle ? calculateCycleDay(cycle.cycle_start_date, date) : null;
  const periodPhase = cycle && cycleDay ? calculatePeriodPhase(cycleDay, cycle.period_length, cycle.cycle_length) : null;

  // Upsert 操作
  await env.DB.prepare(`
    INSERT INTO daily_health (
      id, user_id, date, mood_type, mood_score, flow_level, symptoms,
      habit_water, habit_fruit, habit_breakfast, habit_exercise, habit_bowel,
      cycle_day, period_phase, note, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      mood_type = excluded.mood_type,
      mood_score = excluded.mood_score,
      flow_level = excluded.flow_level,
      symptoms = excluded.symptoms,
      habit_water = excluded.habit_water,
      habit_fruit = excluded.habit_fruit,
      habit_breakfast = excluded.habit_breakfast,
      habit_exercise = excluded.habit_exercise,
      habit_bowel = excluded.habit_bowel,
      cycle_day = excluded.cycle_day,
      period_phase = excluded.period_phase,
      note = excluded.note,
      updated_at = excluded.updated_at
  `).bind(
    id, user.id, date, mood_type || null, mood_score || null, flow_level || 'none',
    symptoms.length > 0 ? JSON.stringify(symptoms) : null,
    habits.water ? 1 : 0, habits.fruit ? 1 : 0, habits.breakfast ? 1 : 0,
    habits.exercise ? 1 : 0, habits.bowel ? 1 : 0,
    cycleDay, periodPhase, note || null, now, now
  ).run();

  return new Response(JSON.stringify({
    success: true,
    data: {
      id,
      date,
      mood_type,
      mood_score,
      flow_level,
      symptoms,
      habits,
      cycle_day: cycleDay,
      period_phase: periodPhase
    }
  }), { headers: { 'Content-Type': 'application/json' } });
}

/**
 * GET /api/cycle/overview
 * 获取周期概览
 */
async function handleGetOverview(request, env, user) {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // 如果用户未登录，返回空数据
  if (!user || !user.id) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        has_cycle: false,
        message: '请先登录或注册'
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const overview = await env.DB.prepare(`
    SELECT * FROM v_cycle_overview WHERE user_id = ?
  `).bind(user.id).first();

  if (!overview || !overview.last_period_start) {
    return new Response(JSON.stringify({
      success: true,
      data: {
        has_cycle: false,
        message: '还没有周期记录，请先设置'
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  }

  const today = new Date().toISOString().split('T')[0];
  const cycleDay = calculateCycleDay(overview.last_period_start, today);
  const periodPhase = calculatePeriodPhase(cycleDay, overview.period_length, overview.cycle_length);

  return new Response(JSON.stringify({
    success: true,
    data: {
      has_cycle: true,
      user_id: overview.user_id,
      user_name: overview.user_name,
      last_period_start: overview.last_period_start,
      cycle_length: overview.cycle_length,
      period_length: overview.period_length,
      predicted_next_start: overview.predicted_next_start,
      predicted_ovulation: overview.predicted_ovulation,
      current_phase: periodPhase,
      current_cycle_day: cycleDay,
      days_until_next: Math.floor(
        (new Date(overview.predicted_next_start) - new Date(today)) / (1000 * 60 * 60 * 24)
      )
    }
  }), { headers: { 'Content-Type': 'application/json' } });
}

// Helper: 获取一周日期数组
function getWeekDates(weekStart) {
  const dates = [];
  const start = new Date(weekStart);
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(date.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

export default handleCycle;
