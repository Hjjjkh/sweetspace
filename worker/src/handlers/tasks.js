import { jsonResponse } from '../index.js';
import { generateUUID, formatDate } from '../utils/helpers.js';

/**
 * 任务系统处理器
 */
export async function handleTasks(request, env, user, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const taskId = pathSegments[pathSegments.length - 1];

  if (url.pathname === '/api/tasks' || url.pathname === '/api/tasks/') {
    if (request.method === 'GET') {
      return await getTasks(request, env, user);
    }

    if (request.method === 'POST') {
      return await createTask(request, env, user, ctx);
    }
  }

  // PUT /api/tasks/:id/complete
  if (request.method === 'PUT') {
    if (taskId === 'complete') {
      const tid = pathSegments[pathSegments.length - 2];
      return await completeTask(env, user, tid, ctx);
    }
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取任务列表
 */
async function getTasks(request, env, user) {
  if (!user || !user.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'all';
  const type = url.searchParams.get('type') || 'all';

  try {
    const conditions = [];
    const bindings = [];

    if (status === 'pending') {
      conditions.push('is_completed = 0');
    } else if (status === 'completed') {
      conditions.push('is_completed = 1');
    }

    if (type !== 'all') {
      conditions.push('task_type = ?');
      bindings.push(type);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const tasks = await env.DB.prepare(`
      SELECT t.*, 
             u.name as completed_by_name
      FROM tasks t
      LEFT JOIN users u ON t.completed_by = u.id
      ${whereClause}
      ORDER BY t.created_at DESC
    `).bind(...bindings).all();

    return jsonResponse({
      success: true,
      data: {
        tasks: tasks.results || []
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 创建任务
 */
async function createTask(request, env, user, ctx) {
  if (!user || !user.id) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, task_type, points, due_date } = body;

    // 验证必填字段
    if (!title) {
      return jsonResponse(
        { error: 'Validation Error', message: 'title 是必填项' },
        { status: 400 }
      );
    }

    const id = generateUUID();

    await env.DB.prepare(`
      INSERT INTO tasks (id, title, description, task_type, points, is_completed, due_date, created_at)
      VALUES (?, ?, ?, ?, ?, 0, ?, strftime('%s', 'now'))
    `).bind(
      id,
      title,
      description || null,
      task_type || 'daily',
      points || 10,
      due_date || null
    ).run();

    return jsonResponse({
      success: true,
      message: '任务创建成功',
      data: {
        id,
        title,
        description,
        task_type,
        points,
        due_date
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create task error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 完成任务
 */
async function completeTask(env, user, taskId, ctx) {
  try {
    // 检查任务是否存在且未完成
    const task = await env.DB.prepare(
      'SELECT * FROM tasks WHERE id = ? AND is_completed = 0'
    ).bind(taskId).first();

    if (!task) {
      return jsonResponse(
        { error: 'Not Found', message: '任务不存在或已完成' },
        { status: 404 }
      );
    }

    const now = Math.floor(Date.now() / 1000);

    await env.DB.prepare(`
      UPDATE tasks 
      SET is_completed = 1, 
          completed_by = ?, 
          completed_at = ?
      WHERE id = ?
    `).bind(user.id, now, taskId).run();

    return jsonResponse({
      success: true,
      message: '任务已完成',
      data: {
        completed_at: now,
        points: task.points
      }
    });

  } catch (error) {
    console.error('Complete task error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
