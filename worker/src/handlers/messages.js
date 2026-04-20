import { jsonResponse } from '../index.js';
import { generateUUID, toTimestamp } from '../utils/helpers.js';

/**
 * 留言系统处理器
 */
export async function handleMessages(request, env, user, ctx) {
  const url = new URL(request.url);
  const pathSegments = url.pathname.split('/').filter(Boolean);
  const messageId = pathSegments[pathSegments.length - 1];

  if (url.pathname === '/api/messages' || url.pathname === '/api/messages/') {
    if (request.method === 'GET') {
      return await getMessages(request, env, user);
    }

    if (request.method === 'POST') {
      return await createMessage(request, env, user, ctx);
    }
  }

  // PUT /api/messages/:id/read
  if (request.method === 'PUT' && messageId === 'read') {
    const msgId = pathSegments[pathSegments.length - 2];
    return await markMessageAsRead(env, user, msgId);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取留言列表
 */
async function getMessages(request, env, user) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  const url = new URL(request.url);
  const type = url.searchParams.get('type') || 'all';
  const includeFuture = url.searchParams.get('include_future') === 'true';
  const now = toTimestamp(new Date());

  try {
    let query = `
      SELECT m.*, 
             sender.name as sender_name, sender.avatar_url as sender_avatar,
             recipient.name as recipient_name
      FROM messages m
      JOIN users sender ON m.sender_id = sender.id
      LEFT JOIN users recipient ON m.recipient_id = recipient.id
    `;

    const conditions = [];
    const bindings = [];

    // 根据类型筛选
    if (type === 'received') {
      conditions.push('m.recipient_id = ?');
      bindings.push(user.id);
    } else if (type === 'sent') {
      conditions.push('m.sender_id = ?');
      bindings.push(user.id);
    } else if (type === 'scheduled') {
      conditions.push('m.reveal_at IS NOT NULL AND m.reveal_at > ?');
      bindings.push(now);
      conditions.push('(m.sender_id = ? OR m.recipient_id = ?)');
      bindings.push(user.id, user.id);
    }

    // 默认只显示已解锁的留言
    if (!includeFuture) {
      conditions.push('(m.reveal_at IS NULL OR m.reveal_at <= ?)');
      bindings.push(now);
    }

    // 不显示隐藏的私密留言 (除非是发送者)
    conditions.push('(m.is_hidden = 0 OR m.sender_id = ?)');
    bindings.push(user.id);

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const messages = await env.DB.prepare(`${query} ${whereClause} ORDER BY m.created_at DESC`).bind(...bindings).all();

    return jsonResponse({
      success: true,
      data: {
        messages: messages.results || []
      }
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 创建留言
 */
async function createMessage(request, env, user, ctx) {
  if (!user) {
    return jsonResponse({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { content, recipient_id, reveal_at } = body;

    // 验证必填字段
    if (!content || content.trim().length === 0) {
      return jsonResponse(
        { error: 'Validation Error', message: '留言内容不能为空' },
        { status: 400 }
      );
    }

    const id = generateUUID();
    const now = toTimestamp(new Date());

    await env.DB.prepare(`
      INSERT INTO messages (id, sender_id, recipient_id, content, reveal_at, is_hidden, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      user.id,
      recipient_id || null,
      content.trim(),
      reveal_at || null,
      recipient_id ? 1 : 0, // 发送给特定人的留言默认隐藏
      now,
      now
    ).run();

    return jsonResponse({
      success: true,
      message: '留言创建成功',
      data: {
        id,
        content: content.trim(),
        recipient_id,
        reveal_at,
        created_at: now
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Create message error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 标记留言为已读
 */
async function markMessageAsRead(env, user, messageId) {
  try {
    // 检查留言是否存在且属于当前用户
    const message = await env.DB.prepare(
      'SELECT * FROM messages WHERE id = ? AND recipient_id = ?'
    ).bind(messageId, user.id).first();

    if (!message) {
      return jsonResponse(
        { error: 'Not Found', message: '留言不存在或无权限' },
        { status: 404 }
      );
    }

    await env.DB.prepare(`
      UPDATE messages SET is_read = 1, updated_at = ? WHERE id = ?
    `).bind(toTimestamp(new Date()), messageId).run();

    return jsonResponse({
      success: true,
      message: '留言已标记为已读'
    });

  } catch (error) {
    console.error('Mark message read error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
