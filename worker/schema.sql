-- Love Space D1 Database Schema
-- Cloudflare D1 (SQLite) 数据库结构

-- ============================================
-- 用户表 (仅支持双人)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    partner_id TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (partner_id) REFERENCES users(id)
);

-- ============================================
-- 关系事件表 (时间线核心)
-- ============================================
CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    event_date TEXT NOT NULL,
    category TEXT DEFAULT 'memory', -- memory, anniversary, first_time, trip, other
    is_pinned INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 事件媒体关联表
-- ============================================
CREATE TABLE IF NOT EXISTS event_media (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    r2_key TEXT NOT NULL,
    media_type TEXT NOT NULL, -- image, video
    caption TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
);

-- ============================================
-- 留言表 (支持延迟显示)
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    sender_id TEXT NOT NULL,
    recipient_id TEXT, -- NULL 表示公开留言
    content TEXT NOT NULL,
    reveal_at INTEGER, -- 定时解锁时间戳 (NULL 表示立即显示)
    is_read INTEGER DEFAULT 0,
    is_hidden INTEGER DEFAULT 0, -- 隐藏留言 (私密)
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 情绪记录表
-- ============================================
CREATE TABLE IF NOT EXISTS moods (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    mood_type TEXT NOT NULL, -- happy, neutral, sad, love, excited, tired, stressed
    mood_score INTEGER, -- 1-10 情绪强度
    note TEXT,
    record_date TEXT NOT NULL, -- YYYY-MM-DD
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    UNIQUE(user_id, record_date), -- 每天每条记录
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 互动任务表
-- ============================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    task_type TEXT DEFAULT 'daily', -- daily, weekly, special, challenge
    points INTEGER DEFAULT 10,
    is_completed INTEGER DEFAULT 0,
    completed_by TEXT,
    completed_at INTEGER,
    due_date TEXT, -- YYYY-MM-DD
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- 每日问题表 (Cron 自动生成)
-- ============================================
CREATE TABLE IF NOT EXISTS daily_questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    category TEXT DEFAULT 'general', -- general, deep, fun, memory, future
    date TEXT UNIQUE NOT NULL, -- YYYY-MM-DD
    is_answered_user1 INTEGER DEFAULT 0,
    is_answered_user2 INTEGER DEFAULT 0,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ============================================
-- 每日问题答案表
-- ============================================
CREATE TABLE IF NOT EXISTS daily_answers (
    id TEXT PRIMARY KEY,
    question_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    is_visible_to_partner INTEGER DEFAULT 1, -- 是否对伴侣可见
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (question_id) REFERENCES daily_questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(question_id, user_id) -- 每人每天每问题只答一次
);

-- ============================================
-- 系统配置表
-- ============================================
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

-- ============================================
-- 索引优化
-- ============================================
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date DESC);
CREATE INDEX IF NOT EXISTS idx_events_user ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_reveal ON messages(reveal_at) WHERE reveal_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_moods_date ON moods(record_date DESC);
CREATE INDEX IF NOT EXISTS idx_moods_user ON moods(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due ON tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_daily_questions_date ON daily_questions(date DESC);

-- ============================================
-- 初始数据 - 系统配置
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('max_users', '2'),
    ('system_version', '1.0.0'),
    ('timezone', 'UTC');

-- ============================================
-- 视图：关系概览
-- ============================================
CREATE VIEW IF NOT EXISTS v_relationship_overview AS
SELECT 
    (SELECT COUNT(*) FROM events) as total_events,
    (SELECT COUNT(*) FROM messages) as total_messages,
    (SELECT COUNT(*) FROM moods WHERE record_date >= date('now', '-7 days')) as moods_last_7days,
    (SELECT COUNT(*) FROM tasks WHERE is_completed = 1) as completed_tasks,
    (SELECT MIN(event_date) FROM events) as relationship_start_date,
    (SELECT julianday('now') - julianday(MIN(event_date)) FROM events) as days_together;

-- ============================================
-- 视图：最近情绪趋势
-- ============================================
CREATE VIEW IF NOT EXISTS v_mood_trend AS
SELECT 
    m.record_date,
    u.name as user_name,
    m.mood_type,
    m.mood_score,
    m.note
FROM moods m
JOIN users u ON m.user_id = u.id
WHERE m.record_date >= date('now', '-30 days')
ORDER BY m.record_date DESC, u.name;
