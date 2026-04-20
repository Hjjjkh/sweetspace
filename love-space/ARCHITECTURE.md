# 💕 Love Space - 系统架构设计文档

> Relationship OS - 情侣专属私密网站系统

---

## 1. 系统概述

### 1.1 产品定位

一个**完全免费**、**可一键部署**、**无需服务器运维**的情侣数字空间系统，用于两人长期记录关系、互动与情绪连接。

### 1.2 核心能力

```
┌─────────────────────────────────────────────┐
│           Relationship OS                    │
├─────────────────────────────────────────────┤
│  Memory Layer   │ Emotion Layer │ Interaction│
│  - 时间线        │ - 心情记录     │ - 每日问答│
│  - 照片归档      │ - 情绪趋势     │ - 互动任务│
│  - 重要事件      │ - 关系状态     │ - 定时提醒│
└─────────────────────────────────────────────┘
```

### 1.3 技术目标

- ✅ 100% 免费 (Cloudflare 免费套餐)
- ✅ 零运维成本
- ✅ 全球访问低延迟
- ✅ 数据完全私密
- ✅ 支持一键部署

---

## 2. 技术架构

### 2.1 整体架构

```
┌────────────────────────────────────────────────┐
│            Cloudflare Edge Network              │
│         (全球 275+ 数据中心分发)                  │
└────────────────────────────────────────────────┘
                      │
                      ▼
┌────────────────────────────────────────────────┐
│          Cloudflare Access (权限层)             │
│  - JWT Token 认证                               │
│  - 邮箱白名单验证 (仅 2 人)                        │
│  - 会话管理 (12 小时)                           │
└────────────────────────────────────────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
        ▼                           ▼
┌──────────────┐             ┌──────────────┐
│ Pages (前端)  │◄───────────►│ Workers (API)│
│ - React 18    │   REST API  │ - 业务逻辑   │
│ - Vite 构建   │             │ - 数据校验   │
│ - TailwindCSS │             │ - 权限验证   │
└──────────────┘             └──────────────┘
                                      │
                          ┌───────────┴───────────┐
                          │                       │
                          ▼                       ▼
                   ┌──────────────┐       ┌──────────────┐
                   │  D1 (数据库)  │       │   R2 (存储)  │
                   │  - SQLite    │       │  - 图片      │
                   │  - 边缘同步   │       │  - 视频      │
                   │  - 5GB 免费   │       │  - 10GB 免费  │
                   └──────────────┘       └──────────────┘

┌──────────────────────────────────────────────┐
│     Cron Triggers (定时任务 - UTC 每日 0 点)    │
│     - 生成每日问题                            │
│     - 解锁定时留言                            │
│     - 检查到期任务                            │
└──────────────────────────────────────────────┘
```

### 2.2 技术选型对比

| 需求 | 备选方案 | 最终选择 | 原因 |
|------|---------|---------|------|
| 前端框架 | Vue 3 / React / Svelte | React 18 | 生态丰富，组件库多 |
| 构建工具 | Webpack / Vite | Vite | 更快开发和构建速度 |
| UI 框架 | MUI / Ant Design / Tailwind | TailwindCSS | 轻量，易定制 |
| 后端 | Node.js / Python / Edge | Workers | 零运维，边缘计算 |
| 数据库 | MySQL / PostgreSQL / D1 | D1 | 边缘 SQLite，免费 |
| 存储 | S3 / Cloudflare R2 | R2 | 免费额度大，零出口费 |
| 认证 | 自建 / Auth0 / Access | Access | 免费 50 用户，易用 |

---

## 3. 模块设计

### 3.1 前端模块

```
frontend/
├── src/
│   ├── components/
│   │   ├── Layout.jsx        # 布局组件 (导航 + 页脚)
│   │   ├── StatCard.jsx      # 统计卡片
│   │   └── QuickAction.jsx   # 快捷操作
│   ├── pages/
│   │   ├── HomePage.jsx      # 首页 (概览)
│   │   ├── TimelinePage.jsx  # 时间线
│   │   ├── MessagesPage.jsx  # 留言
│   │   ├── MoodsPage.jsx     # 心情
│   │   ├── DailyPage.jsx     # 每日互动
│   │   ├── GalleryPage.jsx   # 相册 (待实现)
│   │   └── InitPage.jsx      # 初始化页面
│   ├── hooks/
│   │   ├── useAuth.js        # 认证 Hook
│   │   └── useApi.js         # API 请求 Hook
│   ├── utils/
│   │   ├── api.js            # API 客户端
│   │   └── formatters.js     # 格式化工具
│   └── styles/
│       └── index.css         # 全局样式
└── public/
    ├── index.html
    └── heart.svg
```

### 3.2 后端模块

```
worker/
├── src/
│   ├── index.js            # Worker 入口
│   ├── handlers/
│   │   ├── auth.js         # 认证处理器
│   │   ├── events.js       # 事件管理
│   │   ├── messages.js     # 留言系统
│   │   ├── moods.js        # 情绪记录
│   │   ├── daily.js        # 每日问答
│   │   ├── tasks.js        # 任务系统
│   │   ├── upload.js       # 文件上传
│   │   ├── overview.js     # 概览数据
│   │   └── cron.js         # 定时任务
│   ├── middleware/
│   │   ├── auth.js         # 认证中间件
│   │   └── cors.js         # CORS 处理
│   └── utils/
│       ├── helpers.js      # 工具函数
│       └── validators.js   # 数据校验
├── schema.sql              # 数据库结构
└── wrangler.toml           # 配置文件
```

### 3.3 数据库设计

#### ER 图

```
┌─────────────┐         ┌──────────────┐
│   users     │◄───────>│   events     │
├─────────────┤  1:N    ├──────────────┤
│ id (PK)     │         │ id (PK)      │
│ email       │         │ user_id (FK) │
│ name        │         │ title        │
│ partner_id  │         │ description  │
└─────────────┘         │ event_date   │
                        │ category     │
┌─────────────┐         └──────────────┘
│  messages   │
├─────────────┤
│ id (PK)     │         ┌──────────────┐
│ sender_id   │         │  daily_q     │
│ recipient_id│<───────>├──────────────┤
│ content     │   1:N   │ id (PK)      │
│ reveal_at   │         │ question     │
└─────────────┘         │ category     │
                        │ date         │
┌─────────────┐         └──────────────┘
│   moods     │
├─────────────┤
│ id (PK)     │         ┌──────────────┐
│ user_id (FK)│         │   tasks      │
│ mood_type   │<───────>├──────────────┤
│ mood_score  │   1:N   │ id (PK)      │
│ record_date │         │ title        │
└─────────────┘         │ due_date     │
                        └──────────────┘
```

#### 核心表结构

详见 `worker/schema.sql`

---

## 4. API 设计

### 4.1 RESTful 端点

```
认证:
  GET    /api/auth/me          # 获取当前用户
  POST   /api/auth/init        # 初始化双人关系

事件:
  GET    /api/events           # 获取事件列表
  POST   /api/events           # 创建事件
  GET    /api/events/:id       # 获取事件详情
  PUT    /api/events/:id       # 更新事件
  DELETE /api/events/:id       # 删除事件

留言:
  GET    /api/messages         # 获取留言
  POST   /api/messages         # 发送留言
  PUT    /api/messages/:id/read # 标记已读

情绪:
  GET    /api/moods            # 获取情绪记录
  POST   /api/moods            # 记录心情
  GET    /api/moods/trend      # 情绪趋势

每日互动:
  GET    /api/daily/current    # 今日问题
  POST   /api/daily/answer     # 提交答案
  GET    /api/daily/history    # 历史记录

其他:
  POST   /api/upload           # 文件上传
  GET    /api/overview         # 关系概览
  POST   /api/cron/daily       # Cron 任务 (内部)
```

### 4.2 响应格式

成功响应:
```json
{
  "success": true,
  "data": { ... },
  "message": "操作成功"
}
```

错误响应:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "参数验证失败",
    "details": { ... }
  }
}
```

### 4.3 错误码

| Error Code | HTTP Status | 说明 |
|------------|-------------|------|
| UNAUTHORIZED | 401 | 未登录或 Token 过期 |
| FORBIDDEN | 403 | 无权限访问 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 400 | 参数验证失败 |
| CONFLICT | 409 | 资源冲突 (如重复记录) |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

---

## 5. 安全设计

### 5.1 认证流程

```
用户请求
   │
   ▼
┌─────────────────────────────┐
│  Cloudflare Access 拦截      │
│  - 检查是否有有效 JWT        │
│  - 无则跳转到登录页          │
└─────────────────────────────┘
   │ 有 JWT
   ▼
┌─────────────────────────────┐
│  JWT 验证                    │
│  - 校验签名                  │
│  - 检查有效期                │
│  - 验证邮箱白名单            │
└─────────────────────────────┘
   │ 验证通过
   ▼
┌─────────────────────────────┐
│  Worker 处理业务逻辑          │
│  - 从 JWT 提取用户 ID         │
│  - 执行权限检查              │
│  - 数据库操作                │
└─────────────────────────────┘
```

### 5.2 数据隔离

所有数据库查询自动添加 `user_id` 过滤:

```javascript
// 错误示例 ❌
const events = await db.prepare('SELECT * FROM events').all();

// 正确示例 ✅
const events = await db.prepare(
  'SELECT * FROM events WHERE user_id = ?'
).bind(user.id).all();
```

### 5.3 文件上传安全

```javascript
// 1. 验证文件类型
const allowedTypes = ['image/jpeg', 'image/png', 'video/mp4'];
if (!allowedTypes.includes(file.type)) {
  throw new Error('不支持的文件类型');
}

// 2. 限制文件大小
const maxSize = 10 * 1024 * 1024; // 10MB
if (file.size > maxSize) {
  throw new Error('文件过大');
}

// 3. 生成随机文件名
const filename = `${userId}/${Date.now()}-${random()}.${ext}`;

// 4. R2 私有存储，通过签名 URL 访问
```

---

## 6. 性能优化

### 6.1 缓存策略

```javascript
// API 响应缓存
Cache-Control: public, max-age=300

// 静态资源缓存 (Pages 自动处理)
JavaScript: 1 年
CSS: 1 年
Images: 1 年
```

### 6.2 数据库优化

```sql
-- 索引优化
CREATE INDEX idx_events_date ON events(event_date DESC);
CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_moods_user_date ON moods(user_id, record_date);

-- 查询优化
-- 使用分页减少数据量
SELECT * FROM events 
WHERE user_id = ? 
ORDER BY event_date DESC 
LIMIT 20 OFFSET 0;
```

### 6.3 前端优化

```javascript
// Vite 代码分割
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        charts: ['recharts']
      }
    }
  }
}

// 图片懒加载
<img loading="lazy" src={image} />

// React.memo 减少重渲染
const StatCard = React.memo(({ icon, label, value }) => {
  // ...
});
```

---

## 7. 监控与日志

### 7.1 Worker 日志

```javascript
console.log('请求处理开始');
console.error('错误详情:', error);
```

查看日志:
```bash
wrangler tail
```

### 7.2 错误追踪

```javascript
try {
  await processRequest();
} catch (error) {
  console.error('API 错误:', {
    endpoint: request.url,
    userId: user?.id,
    error: error.message,
    stack: error.stack
  });
  throw error;
}
```

### 7.3 性能指标

监控:
- API 响应时间
- 数据库查询时间
- 错误率
- 用户活跃度

---

## 8. 扩展性设计

### 8.1 支持多情侣 (未来 SaaS 化)

```sql
-- 添加情侣组 ID
ALTER TABLE users ADD COLUMN couple_id TEXT;

-- 查询时按 couple_id 隔离
SELECT * FROM events 
WHERE couple_id = (SELECT couple_id FROM users WHERE id = ?)
```

### 8.2 AI 功能扩展

```javascript
// 情绪分析
import { analyzeSentiment } from './ai/sentiment.js';

const sentiment = await analyzeSentiment(message.content);
await db.prepare(
  'UPDATE messages SET sentiment = ? WHERE id = ?'
).bind(sentiment.score, message.id).run();
```

### 8.3 推送通知

```javascript
// Web Push API
await sendNotification(userId, {
  title: '新留言',
  body: 'TA 给你写了一封信 💌',
  url: '/messages'
});
```

---

## 9. 成本估算

### 9.1 免费套餐资源

| 服务 | 免费额度 | 实际用量 | 是否免费 |
|------|---------|---------|---------|
| Workers | 100k 请求/天 | ~1k/天 | ✅ |
| Pages | 无限 | - | ✅ |
| D1 | 5GB 存储 | < 100MB | ✅ |
| R2 | 10GB 存储 | < 1GB | ✅ |
| Access | 50 用户 | 2 用户 | ✅ |
| **总计** | - | - | **$0/月** |

### 9.2 用量预测

按每天活跃使用计算:
- API 请求：~1000 次/天
- 数据库写入：~20 次/天
- 图片上传：~5 张/天
- 存储增长：~50MB/月

**1 年总成本：$0**

---

## 10. 部署架构

### 10.1 部署流程图

```
GitHub Push
    │
    ▼
┌──────────────────┐
│  GitHub Actions  │
│  (CI/CD Pipeline)│
└──────────────────┘
    │
    ├─────────────┬─────────────┐
    │             │             │
    ▼             ▼             ▼
┌───────┐   ┌──────────┐  ┌────────┐
│ D1    │   │ Worker   │  │ Pages  │
│ 迁移  │   │ 部署     │  │ 构建    │
└───────┘   └──────────┘  └────────┘
    │             │             │
    └─────────────┴─────────────┘
                  │
                  ▼
         ┌────────────────┐
         │ Cloudflare CDN │
         │ (全球分发)     │
         └────────────────┘
```

### 10.2 环境配置

```toml
# wrangler.toml
name = "love-space-worker"
environment = "production"

# 开发环境
[env.dev]
name = "love-space-worker-dev"
routes = []

# 生产环境
[env.production]
name = "love-space-worker"
routes = ["love-space.workers.dev/*"]
```

---

## 11. 技术决策记录

### 11.1 为什么选择 D1 而不是 KV？

**决策**: 使用 D1 (SQLite)

**原因**:
1. 支持复杂查询 (关系型数据)
2. SQL 语法，易于开发
3. 事务支持
4. 同样免费 (5GB)

### 11.2 为什么选择 Pages 而不是直接 Worker?

**决策**: Cloudflare Pages

**原因**:
1. 自动构建和部署
2. 预览部署功能
3. 更好的开发体验
4. 与 Workers 无缝集成

### 11.3 为什么不使用第三方认证？

**决策**: Cloudflare Access

**原因**:
1. 免费 50 用户 (够用)
2. 无需管理 session
3. 与 Cloudflare 生态集成
4. 安全性高

---

## 12. 未来规划

### Phase 1 (MVP) - 已完成 ✅
- 核心功能实现
- 基础 UI
- 一键部署

### Phase 2 (优化)
- 相册管理
- 性能优化
- 移动端增强

### Phase 3 (AI) - 计划中
- 智能问题推荐
- 情绪趋势预测
- 关系健康度分析

### Phase 4 (SaaS) - 考虑
- 多情侣支持
- 付费增值服务
- 数据导出服务

---

**架构设计完成日期**: 2024
**最后更新**: 2024
