import { jsonResponse } from '../index.js';
import { generateUUID } from '../utils/helpers.js';

/**
 * 认证处理器
 */
export async function handleAuth(request, env, user, ctx) {
  const url = new URL(request.url);

  // GET /api/auth/me - 获取当前用户信息
  if (request.method === 'GET' && url.pathname === '/api/auth/me') {
    return await getCurrentUser(request, env, user);
  }

  // POST /api/auth/init - 初始化双人关系
  if (request.method === 'POST' && url.pathname === '/api/auth/init') {
    return await initializeUsers(request, env, ctx);
  }

  return jsonResponse({ error: 'Method not allowed' }, { status: 405 });
}

/**
 * 获取当前用户信息
 */
async function getCurrentUser(request, env, user) {
  // 如果用户未登录，返回需要初始化的标记
  if (!user || !user.id || user.needs_init) {
    return jsonResponse({
      success: true,
      data: {
        id: null,
        email: null,
        name: null,
        needs_init: true,
        message: '请先注册或登录'
      }
    });
  }

  try {
    // 从数据库获取完整用户信息
    const userQuery = await env.DB.prepare(
      'SELECT id, email, name, avatar_url, partner_id, created_at FROM users WHERE id = ? OR email = ?'
    ).bind(user.id, user.email).first();

    if (!userQuery) {
      // 用户不存在，返回基本信息（前端应引导初始化）
      return jsonResponse({
        success: true,
        data: {
          ...user,
          needs_init: true
        }
      });
    }

    // 获取伴侣信息
    let partner = null;
    if (userQuery.partner_id) {
      const partnerQuery = await env.DB.prepare(
        'SELECT id, name, avatar_url FROM users WHERE id = ?'
      ).bind(userQuery.partner_id).first();
      partner = partnerQuery;
    }

    return jsonResponse({
      success: true,
      data: {
        id: userQuery.id,
        email: userQuery.email,
        name: userQuery.name,
        avatar_url: userQuery.avatar_url,
        partner_id: userQuery.partner_id,
        partner: partner,
        created_at: userQuery.created_at
      }
    });

  } catch (error) {
    console.error('Get user error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}

/**
 * 初始化双人关系系统
 */
async function initializeUsers(request, env, ctx) {
  try {
    const body = await request.json();
    const { email, name, partner_email, partner_name } = body;

    // 验证必填字段
    if (!email || !name || !partner_email || !partner_name) {
      return jsonResponse(
        { error: 'Validation Error', message: '缺少必填字段' },
        { status: 400 }
      );
    }

    // 检查是否已存在用户
    const existingUsers = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
    
    if (existingUsers.count >= 2) {
      return jsonResponse(
        { error: 'Forbidden', message: '系统仅支持双人，初始化已完成' },
        { status: 403 }
      );
    }

    // 检查邮箱是否已使用
    const existing = await env.DB.prepare(
      'SELECT id FROM users WHERE email = ? OR email = ?'
    ).bind(email, partner_email).first();

    if (existing) {
      return jsonResponse(
        { error: 'Conflict', message: '邮箱已被使用' },
        { status: 409 }
      );
    }

    // 创建两个用户
    const user1Id = generateUUID();
    const user2Id = generateUUID();
    const now = Math.floor(Date.now() / 1000);

    // 第一步：先插入用户（partner_id 为 NULL）
    const insertStmt = env.DB.prepare(`
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    await env.DB.batch([
      insertStmt.bind(user1Id, email, name, now, now),
      insertStmt.bind(user2Id, partner_email, partner_name, now, now)
    ]);

    // 第二步：更新 partner_id（此时两个用户都已存在）
    const updateStmt = env.DB.prepare(`
      UPDATE users SET partner_id = ?, updated_at = ? WHERE id = ?
    `);

    await env.DB.batch([
      updateStmt.bind(user2Id, now, user1Id),
      updateStmt.bind(user1Id, now, user2Id)
    ]);

    return jsonResponse({
      success: true,
      message: '初始化成功',
      data: {
        users: [
          { id: user1Id, email, name },
          { id: user2Id, email: partner_email, name: partner_name }
        ]
      }
    });

  } catch (error) {
    console.error('Init users error:', error);
    return jsonResponse(
      { error: 'Database error', message: error.message },
      { status: 500 }
    );
  }
}
