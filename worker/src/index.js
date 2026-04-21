/**
 * Love Space Worker - 情侣专属私密网站系统后端
 * 
 * 核心功能:
 * - 用户认证 (双人系统)
 * - 时间线事件管理
 * - 留言系统 (支持定时解锁)
 * - 情绪记录
 * - 每日互动问答
 * - Cron 定时任务
 */

import { handleAuth } from './handlers/auth.js';
import { handleEvents, handleEventById } from './handlers/events.js';
import { handleMessages } from './handlers/messages.js';
import { handleMoods } from './handlers/moods.js';
import { handleDailyQuestions } from './handlers/daily.js';
import { handleTasks } from './handlers/tasks.js';
import { handleUpload, handleGetPhotos, handleDeletePhoto, handleDownloadFile } from './handlers/upload.js';
import { handleOverview } from './handlers/overview.js';
import { handleCron } from './handlers/cron.js';
import { handleAIRequest } from './handlers/ai.js';
import { handleCycle } from './handlers/cycle.js';
import { corsHeaders } from './utils/cors.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // 获取用户信息 (从 Cloudflare Access JWT)
    const user = await getUserFromRequest(request, env);

    // 路由处理
    try {
      // 健康检查
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() });
      }

      // Cron 任务
      if (path === '/api/cron/daily' && request.method === 'POST') {
        return handleCron(request, env, ctx);
      }

      // 认证相关
      if (path === '/api/auth/me' && request.method === 'GET') {
        return handleAuth(request, env, user);
      }

      // POST /api/auth/init - 初始化双人关系（允许匿名访问）
      if (path === '/api/auth/init' && request.method === 'POST') {
        return handleAuth(request, env, { needs_init: true }, ctx);
      }

      // POST /api/auth/reset - 重置系统（仅开发/测试用）
      if (path === '/api/auth/reset' && request.method === 'POST') {
        return handleReset(env);
      }

      // 事件管理
      if (path === '/api/events' && request.method === 'GET') {
        return handleEvents(request, env, user);
      }
      if (path === '/api/events' && request.method === 'POST') {
        return handleEvents(request, env, user, ctx);
      }
      if (path.match(/^\/api\/events\/[0-9a-f-]+$/)) {
        const id = path.split('/').pop();
        return handleEventById(request, env, user, id, ctx);
      }

      // 留言系统
      if (path.startsWith('/api/messages')) {
        return handleMessages(request, env, user, ctx);
      }

      // 情绪记录
      if (path.startsWith('/api/moods')) {
        return handleMoods(request, env, user, ctx);
      }

      // 每日互动
      if (path.startsWith('/api/daily')) {
        return handleDailyQuestions(request, env, user, ctx);
      }

      // 任务系统
      if (path.startsWith('/api/tasks')) {
        return handleTasks(request, env, user, ctx);
      }

      // 文件上传
      if (path === '/api/upload' && request.method === 'POST') {
        return handleUpload(request, env, user, ctx);
      }
      // 获取照片列表
      if (path === '/api/upload' && request.method === 'GET') {
        return handleGetPhotos(env, user);
      }
      // 删除照片
      if (path.match(/^\/api\/upload\/[0-9a-f-]+$/)) {
        if (request.method === 'DELETE') {
          const photoId = path.split('/').pop();
          return handleDeletePhoto(env, user, photoId);
        }
      }
      // 下载/访问 R2 文件 (代理模式)
      if (path.startsWith('/api/upload/') && request.method === 'GET') {
        const r2Key = decodeURIComponent(path.replace('/api/upload/', ''));
        return handleDownloadFile(env, r2Key);
      }

      // 关系概览
      if (path === '/api/overview' && request.method === 'GET') {
        return handleOverview(request, env, user);
      }

      // AI 功能
      if (path.startsWith('/api/ai/')) {
        return handleAIRequest(request, env, user);
      }

      // 生理周期 + 健康记录
      if (path.startsWith('/api/cycle/')) {
        return handleCycle(request, env, user, ctx);
      }

      // 404
      return jsonResponse({ error: 'Not Found' }, { status: 404 });

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse(
        { error: 'Internal Server Error', message: error.message },
        { status: 500 }
      );
    }
  }
};

/**
 * 从请求中提取用户信息
 */
async function getUserFromRequest(request, env) {
  // 开发环境：绕过认证
  if (env.ENVIRONMENT === 'development') {
    return {
      id: 'dev-user-1',
      email: 'dev@example.com',
      name: 'Developer',
      needs_init: true
    };
  }

  // 生产环境：从 Cloudflare Access JWT 获取
  const jwtAssertion = request.headers.get('Cf-Access-Jwt-Assertion');
  
  if (jwtAssertion) {
    try {
      // 验证 JWT (简化版本，生产环境应完整验证)
      const payload = JSON.parse(atob(jwtAssertion.split('.')[1]));
      return {
        id: payload.sub || payload.email,
        email: payload.email,
        name: payload.name || payload.email.split('@')[0],
        needs_init: false
      };
    } catch (e) {
      console.error('JWT decode error:', e);
    }
  }
  
  // 没有 JWT 时，检查系统是否已初始化
  // 如果已初始化，返回当前用户（从数据库获取第一个用户）
  try {
    const userQuery = await env.DB.prepare(
      'SELECT id, email, name, avatar_url, partner_id FROM users LIMIT 1'
    ).first();
    
    if (userQuery) {
      // 系统已初始化，返回用户信息（允许访问）
      return {
        ...userQuery,
        needs_init: false
      };
    }
  } catch (e) {
    console.log('检查初始化状态失败:', e.message);
  }
  
  // 系统未初始化，返回需要初始化的标记
  return {
    id: null,
    email: null,
    name: null,
    needs_init: true
  };
}

/**
 * JSON 响应工具函数
 */
function jsonResponse(data, options = {}) {
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders
    },
    status: options.status || 200
  });
}

// 导出工具函数供 handlers 使用
export { jsonResponse, getUserFromRequest };
