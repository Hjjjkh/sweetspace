# D1 数据库迁移指南

## 📋 在 D1 Console 中执行

### 步骤 1：访问 D1 Console

https://dash.cloudflare.com/?to=/:account/d1

### 步骤 2：选择数据库

点击 `love-space-db`

### 步骤 3：进入 Console 标签

### 步骤 4：执行 SQL（分两次）

#### 第一次：基础表结构

复制 `worker/migrations/001-schema-console.sql` 的内容，粘贴到 Console 并执行。

#### 第二次：经期健康表

复制 `worker/migrations/002-cycle-health-console.sql` 的内容，粘贴到 Console 并执行。

---

## ✅ 验证

执行以下 SQL 验证表是否创建成功：

```sql
SELECT name FROM sqlite_master WHERE type='table';
```

应该看到所有表：
- users
- events
- event_media
- messages
- moods
- tasks
- daily_questions
- daily_answers
- gallery_items
- cycle_logs
- daily_health

---

## 🚀 完成后

刷新网站：https://sweetspace.pages.dev

然后填写注册信息！
