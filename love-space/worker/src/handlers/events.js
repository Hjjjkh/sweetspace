import { jsonResponse } from '../index.js';
import { generateUUID, formatDate, toTimestamp } from '../utils/helpers.js';

/**
 * 事件管理处理器
 */
export async function handleEvents(request, env, user, ctx) {
  const url = new URL(request.url);

  if (request.method === 'GET') {
    return await getEvents(request, env, user);
  }

  if (request.method === 'POST') {
    return await createEvent(request, env, user, ctx);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取事件列表
 */
async function getEvents(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get('page')) || 1;
  const limit = parseInt(url.searchParams.get('limit')) || 20;
  const category = url.searchParams.get('category');
  const year = url.searchParams.get('year');
  const offset = (page - 1) * limit;

  try {
    // 构建查询
    let whereClause = 'WHERE 1=1';
    const bindings = [];

    if (category) {
      whereClause += ' AND category = ?';
      bindings.push(category);
    }

    if (year) {
      whereClause += " AND strftime('%Y', event_date) = ?";
      bindings.push(year.toString());
    }

    // 获取总数
    const countQuery = await env.DB.prepare(
      `SELECT COUNT(*) as total FROM events ${whereClause}`
    ).bind(...bindings).first();

    // 获取事件列表
    const events = await env.DB.prepare(`
      SELECT e.*, u.name as user_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      ${whereClause}
      ORDER BY e.event_date DESC, e.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...bindings, limit, offset).all();

    return jsonResponse({
      success: true,
      data: {
        events: events.results || [],
        pagination: {
          page,
          limit,
          total: countQuery.total,
          totalPages: Math.ceil(countQuery.total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Get events error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 创建新事件
 */
async function createEvent(request, env, user, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, description, event_date, category, is_pinned } = body;

    // 验证必填字段
    if (!title || !event_date) {
      return jsonResponse(
        { error: 'Validation Error', message: 'title 和 event_date 是必填项' },
        { status: 400 }
      );
    }

    const id = generateUUID();
    const now = toTimestamp(new Date());

    await env.DB.prepare(`
      INSERT INTO events (id, user_id, title, description, event_date, category, is_pinned, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      title,
      description || null,
      event_date,
      category || 'memory',
      is_pinned ? 1 : 0,
      now,
      now
    ).run();

    return jsonResponse({
      success: true,
      message: '事件创建成功',
      data: {
        id,
        user_id: user.id,
        title,
        description,
        event_date,
        category,
        is_pinned: is_pinned || false,
        created_at: now
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create event error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 获取单个事件详情
 */
export async function handleEventById(request, env, user, eventId, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  if (request.method === 'GET') {
    return await getEvent(env, eventId);
  }

  if (request.method === 'PUT') {
    return await updateEvent(request, env, user, eventId, ctx);
  }

  if (request.method === 'DELETE') {
    return await deleteEvent(env, eventId, ctx);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取单个事件
 */
async function getEvent(env, eventId) {
  try {
    const event = await env.DB.prepare(`
      SELECT e.*, u.name as user_name
      FROM events e
      JOIN users u ON e.user_id = u.id
      WHERE e.id = ?
    `).bind(eventId).first();

    if (!event) {
      return jsonResponse({ error: 'Not Found' }, { status: 404 });
    }

    // 获取关联的媒体文件
    const media = await env.DB.prepare(`
      SELECT * FROM event_media WHERE event_id = ? ORDER BY sort_order
    `).bind(eventId).all();

    return jsonResponse({
      success: true,
      data: {
        ...event,
        media: media.results || []
      }
    });

  } catch (error) {
    console.error('Get event error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 更新事件
 */
async function updateEvent(request, env, user, eventId, ctx) {
  try {
    const body = await request.json();
    const { title, description, event_date, category, is_pinned } = body;

    // 检查事件是否存在且属于当前用户
    const existing = await env.DB.prepare(
      'SELECT * FROM events WHERE id = ? AND user_id = ?'
    ).bind(eventId, user.id).first();

    if (!existing) {
      return jsonResponse(
        { error: 'Not Found', message: '事件不存在或无权限修改' },
        { status: 404 }
      );
    }

    const now = toTimestamp(new Date());

    await env.DB.prepare(`
      UPDATE events 
      SET title = ?, description = ?, event_date = ?, category = ?, is_pinned = ?, updated_at = ?
      WHERE id = ?
    `).bind(
      title || existing.title,
      description !== undefined ? description : existing.description,
      event_date || existing.event_date,
      category || existing.category,
      is_pinned !== undefined ? (is_pinned ? 1 : 0) : existing.is_pinned,
      now,
      eventId
    ).run();

    return jsonResponse({
      success: true,
      message: '事件更新成功'
    });

  } catch (error) {
    console.error('Update event error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 删除事件
 */
async function deleteEvent(env, eventId, ctx) {
  try {
    const result = await env.DB.prepare(
      'DELETE FROM events WHERE id = ?'
    ).bind(eventId).run();

    if (!result || result.changes === 0) {
      return jsonResponse({ error: 'Not Found' }, { status: 404 });
    }

    return jsonResponse({
      success: true,
      message: '事件已删除'
    });

  } catch (error) {
    console.error('Delete event error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
