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
      // 根路径 - 显示系统状态
      if (path === '/') {
        return new Response(`
<!DOCTYPE html>
<html>
<head><title>Love Space Worker Status</title></head>
<body style="font-family: monospace; padding: 20px;">
  <h1>🚀 Love Space Worker</h1>
  <p>Worker 正常运行！</p>
  
  <h2>测试接口</h2>
  <ul>
    <li><a href="/api/health">/api/health</a> - 健康检查</li>
    <li><a href="/api/test-db">/api/test-db</a> - 测试数据库</li>
    <li><a href="/api/test-ai">/api/test-ai</a> - 测试 AI 配置</li>
  </ul>
  
  <h2>前端地址</h2>
  <p><a href="https://sweetspace.pages.dev">https://sweetspace.pages.dev</a></p>
</body>
</html>`, {
          headers: { 'Content-Type': 'text/html' }
        });
      }

      // API 文档
      if (path === '/api') {
        return jsonResponse({
          name: 'Love Space API',
          version: '2.0.0',
          endpoints: {
            'GET /api/health': '健康检查',
            'GET /api/test-db': '测试数据库连接',
            'GET /api/test-ai': '测试 AI 配置',
            'POST /api/auth/init': '初始化用户',
            'GET /api/auth/me': '获取当前用户',
            'POST /api/ai/generate-topic': 'AI 生成话题',
            // ... 其他端点
          }
        });
      }

      // 健康检查
      if (path === '/api/health') {
        return jsonResponse({ status: 'ok', timestamp: Date.now() });
      }

      // 测试接口：验证 D1 连接
      if (path === '/api/test-db') {
        try {
          console.log('Testing D1 database connection...');
          const result = await env.DB.prepare('SELECT 1 as test').first();
          console.log('D1 test result:', result);
          
          // 检查用户表
          const userCount = await env.DB.prepare('SELECT COUNT(*) as count FROM users').first();
          
          // 检查 AI 表
          let aiTableExists = false;
          try {
            await env.DB.prepare('SELECT COUNT(*) as count FROM ai_responses LIMIT 1').first();
            aiTableExists = true;
          } catch (e) {
            aiTableExists = false;
          }
          
          return jsonResponse({ 
            success: true, 
            result,
            database: {
              users_count: userCount?.count || 0,
              ai_tables_exist: aiTableExists
            }
          });
        } catch (e) {
          console.error('D1 test failed:', e);
          return jsonResponse({ 
            success: false, 
            error: e.message,
            stack: e.stack 
          }, { status: 500 });
        }
      }

      // 测试接口：验证 AI 配置
      if (path === '/api/test-ai') {
        const hasKey = !!env.OPENROUTER_API_KEY;
        const keyPreview = hasKey ? env.OPENROUTER_API_KEY.substring(0, 10) + '***' : 'none';
        const keyLength = env.OPENROUTER_API_KEY?.length || 0;
        
        return jsonResponse({ 
          hasKey, 
          keyPreview,
          keyLength,
          model: env.AI_MODEL,
          env_vars: {
            AI_MODEL: env.AI_MODEL,
            AI_RATE_LIMIT: env.AI_RATE_LIMIT,
            AI_CACHE_DAYS: env.AI_CACHE_DAYS,
            AI_TIMEOUT_MS: env.AI_TIMEOUT_MS,
            ENVIRONMENT: env.ENVIRONMENT
          }
        });
      }

      // 测试接口：实际调用 AI
      if (path === '/api/test-ai-call') {
        try {
          const { AIService } = await import('./services/ai.js');
          const testUser = { id: 'test-user', email: 'test@test.com', name: 'Test' };
          const aiService = new AIService(env, testUser);
          
          console.log('AI Service created, enabled:', aiService.isEnabled());
          
          if (!aiService.isEnabled()) {
            return jsonResponse({ 
              success: false, 
              error: 'AI not enabled - missing API key' 
            }, { status: 503 });
          }
          
          // 简单测试调用
          const result = await aiService.callAI([
            { role: 'user', content: 'Say "Hello" in Chinese' }
          ]);
          
          return jsonResponse({
            success: true,
            response: result.content,
            model: result.model
          });
        } catch (e) {
          console.error('AI test call failed:', e);
          return jsonResponse({
            success: false,
            error: e.message,
            stack: e.stack
          }, { status: 500 });
        }
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
      console.log('系统已初始化，用户:', userQuery.id);
      // 系统已初始化，返回用户信息（允许访问）
      return {
        ...userQuery,
        needs_init: false
      };
    } else {
      console.log('数据库无用户，需要初始化');
    }
  } catch (e) {
    console.error('检查初始化状态失败:', e.message);
    // 数据库访问失败，返回一个临时用户允许访问
    return {
      id: 'temp-user',
      email: 'temp@unknown.com',
      name: 'Temp User',
      needs_init: false
    };
  }
  
  // 系统未初始化，返回需要初始化的标记
  console.log('系统未初始化，返回 needs_init: true');
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
