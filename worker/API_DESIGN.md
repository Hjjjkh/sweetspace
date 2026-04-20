# Love Space API 设计文档

## 基础信息

- Base URL: `https://<worker-name>.<subdomain>.workers.dev`
- 认证方式：Bearer Token (Cloudflare Access JWT)
- 响应格式：JSON

## 认证中间件

所有 API 请求通过 Cloudflare Access 验证，Worker 从 `Cf-Access-Jwt-Assertion` header 获取用户信息。

---

## API 端点

### 1. 认证与用户

#### GET /api/auth/me
获取当前用户信息

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "name": "昵称",
    "avatar_url": "https://...",
    "partner_id": "partner-uuid",
    "partner": {
      "id": "partner-uuid",
      "name": "对方昵称",
      "avatar_url": "https://..."
    }
  }
}
```

#### POST /api/auth/init
初始化双人关系 (首次部署时调用)

**请求：**
```json
{
  "email": "user1@example.com",
  "name": "用户 1 昵称",
  "partner_email": "user2@example.com",
  "partner_name": "用户 2 昵称"
}
```

---

### 2. 时间线事件

#### GET /api/events
获取事件列表

**查询参数：**
- `page`: 页码 (默认 1)
- `limit`: 每页数量 (默认 20)
- `category`: 分类筛选
- `year`: 年份筛选

**响应：**
```json
{
  "success": true,
  "data": {
    "events": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100
    }
  }
}
```

#### POST /api/events
创建新事件

**请求：**
```json
{
  "title": "第一次约会",
  "description": "详细描述...",
  "event_date": "2024-01-15",
  "category": "first_time",
  "is_pinned": false
}
```

#### GET /api/events/:id
获取单个事件详情

#### PUT /api/events/:id
更新事件

#### DELETE /api/events/:id
删除事件

---

### 3. 媒体上传

#### POST /api/upload
上传照片/视频到 R2

**请求：** multipart/form-data

**响应：**
```json
{
  "success": true,
  "data": {
    "r2_key": "uuid-filename",
    "url": "https://r2-endpoint/...",
    "thumbnail_url": "https://..."
  }
}
```

---

### 4. 留言系统

#### GET /api/messages
获取留言列表

**查询参数：**
- `type`: `all` | `received` | `sent` | `scheduled`
- `include_future`: 是否包含未解锁的留言

**响应：**
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg-uuid",
        "sender": { "id": "...", "name": "..." },
        "content": "留言内容",
        "reveal_at": 1704067200,
        "is_read": false,
        "created_at": 1704000000
      }
    ]
  }
}
```

#### POST /api/messages
创建留言

**请求：**
```json
{
  "content": "想对你说的话...",
  "recipient_id": "partner-uuid", // 可选，null 为公开
  "reveal_at": 1704067200 // 可选，定时解锁时间戳
}
```

#### PUT /api/messages/:id/read
标记留言为已读

---

### 5. 情绪记录

#### GET /api/moods
获取情绪记录

**查询参数：**
- `start_date`: YYYY-MM-DD
- `end_date`: YYYY-MM-DD
- `user_id`: 用户 ID (可选，查看对方情绪)

**响应：**
```json
{
  "success": true,
  "data": {
    "moods": [
      {
        "date": "2024-01-15",
        "mood_type": "happy",
        "mood_score": 8,
        "note": "今天很开心"
      }
    ],
    "statistics": {
      "average_score": 7.5,
      "trend": "improving"
    }
  }
}
```

#### POST /api/moods
记录今日情绪

**请求：**
```json
{
  "mood_type": "happy",
  "mood_score": 8,
  "note": "可选备注"
}
```

#### GET /api/moods/trend
获取情绪趋势 (30 天)

---

### 6. 每日互动

#### GET /api/daily/current
获取今日问题

**响应：**
```json
{
  "success": true,
  "data": {
    "question": {
      "id": "q-uuid",
      "question": "今天你最想对我说什么？",
      "category": "general",
      "date": "2024-01-15"
    },
    "my_answer": {
      "id": "a-uuid",
      "answer": "...",
      "is_visible_to_partner": true
    },
    "partner_answer": {
      "answer": "...", // 仅当对方设置可见时返回
      "is_visible": true
    }
  }
}
```

#### POST /api/daily/answer
提交每日答案

**请求：**
```json
{
  "question_id": "q-uuid",
  "answer": "我的回答...",
  "is_visible_to_partner": true
}
```

#### GET /api/daily/history
获取历史问答记录

---

### 7. 互动任务

#### GET /api/tasks
获取任务列表

**查询参数：**
- `status`: `pending` | `completed` | `all`
- `type`: `daily` | `weekly` | `challenge`

#### POST /api/tasks
创建任务 (Cron 自动生成或手动创建)

#### PUT /api/tasks/:id/complete
完成任务

---

### 8. 关系概览

#### GET /api/overview
获取关系概览数据

**响应：**
```json
{
  "success": true,
  "data": {
    "days_together": 365,
    "total_events": 50,
    "total_messages": 120,
    "recent_moods": [...],
    "upcoming_anniversaries": [...],
    "streak_days": 15 // 连续互动天数
  }
}
```

---

### 9. 定时任务 (Cron)

#### POST /api/cron/daily
每日凌晨执行 (Cron Trigger)

**执行内容：**
1. 生成今日问题
2. 检查待解锁留言
3. 发送提醒 (如需要)

---

## 错误响应格式

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "事件不存在",
    "details": {}
  }
}
```

## 错误码

| Code | HTTP Status | 说明 |
|------|-------------|------|
| `UNAUTHORIZED` | 401 | 未授权 |
| `FORBIDDEN` | 403 | 无权限 |
| `NOT_FOUND` | 404 | 资源不存在 |
| `VALIDATION_ERROR` | 400 | 参数验证失败 |
| `ALREADY_EXISTS` | 409 | 资源已存在 |
| `INTERNAL_ERROR` | 500 | 服务器内部错误 |

---

## 限流策略

- 所有 API：100 请求/分钟 per user
- 文件上传：10 文件/分钟
