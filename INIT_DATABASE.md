# 💕 Love Space - 数据库初始化指南

## 🎯 最简单的方式（推荐）

### 使用在线 SQL 工具执行

1. 访问：https://sqlpad.io/demo/sqlite
2. 复制下面的 SQL
3. 粘贴执行
4. 完成！

---

## 🔧 命令行方式

```bash
# 1. 安装 wrangler
npm install -g wrangler

# 2. 登录
wrangler login

# 3. 初始化数据库
cd worker
npx wrangler d1 execute love-space-db --file=./schema.sql --remote
```

---

## 📋 手动在 Dashboard 执行

访问：https://dash.cloudflare.com/?to=/:account/d1

1. 选择 `love-space-db`
2. Execute a query
3. **逐条复制执行**：

### 第 1 条
```sql
CREATE TABLE users (id TEXT PRIMARY KEY,email TEXT UNIQUE,name TEXT,avatar_url TEXT,partner_id TEXT);
```

### 第 2 条
```sql
CREATE TABLE events (id TEXT PRIMARY KEY,user_id TEXT,title TEXT,event_date TEXT,category TEXT DEFAULT 'memory');
```

### 第 3 条
```sql
CREATE TABLE messages (id TEXT PRIMARY KEY,sender_id TEXT,recipient_id TEXT,content TEXT,reveal_at INTEGER);
```

### 第 4 条
```sql
CREATE TABLE moods (id TEXT PRIMARY KEY,user_id TEXT,mood_type TEXT,record_date TEXT,mood_score INTEGER);
```

### 第 5 条
```sql
CREATE TABLE daily_questions (id TEXT PRIMARY KEY,question TEXT,date TEXT UNIQUE);
```

### 第 6 条
```sql
CREATE TABLE daily_answers (id TEXT PRIMARY KEY,question_id TEXT,user_id TEXT,answer TEXT);
```

### 第 7 条
```sql
CREATE TABLE settings (key TEXT PRIMARY KEY,value TEXT);
```

### 第 8 条
```sql
CREATE TABLE tasks (id TEXT PRIMARY KEY,title TEXT,task_type TEXT DEFAULT 'daily',is_completed INTEGER DEFAULT 0);
```

### 第 9 条
```sql
CREATE TABLE event_media (id TEXT PRIMARY KEY,event_id TEXT,r2_key TEXT,media_type TEXT);
```

### 第 10 条
```sql
INSERT INTO settings (key, value) VALUES ('max_users', '2'), ('system_version', '1.0.0');
```

执行完后，输入 `.tables` 验证看到所有表！

---

## ✅ 验证

访问：https://sweetspace.248851185.pages.dev

应该能看到初始化表单！
