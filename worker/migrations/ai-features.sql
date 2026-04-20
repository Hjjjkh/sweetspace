-- AI 功能数据库迁移脚本
-- 使用方式：npx wrangler d1 execute love-space-db --file=./migrations/ai-features.sql

-- ============================================
-- AI Responses Cache Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_responses (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    request_type TEXT NOT NULL,  -- mood, photo, message, date, topic
    request_hash TEXT NOT NULL,  -- MD5(request_type + request_content)
    response_content TEXT NOT NULL,
    metadata TEXT,  -- JSON extra info
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    expires_at INTEGER NOT NULL,  -- created_at + 30 days
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_responses_user ON ai_responses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_responses_hash ON ai_responses(request_hash);
CREATE INDEX IF NOT EXISTS idx_ai_responses_expires ON ai_responses(expires_at);

-- ============================================
-- AI Usage Tracking Table
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage_log (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    request_type TEXT NOT NULL,
    tokens_used INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user ON ai_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_date ON ai_usage_log(created_at);

-- ============================================
-- Gallery Photos AI Extension
-- ============================================
ALTER TABLE gallery_photos ADD COLUMN ai_description TEXT;
ALTER TABLE gallery_photos ADD COLUMN ai_tags TEXT;  -- JSON array
ALTER TABLE gallery_photos ADD COLUMN ai_poem TEXT;

-- ============================================
-- Daily Questions AI Extension
-- ============================================
ALTER TABLE daily_questions ADD COLUMN ai_generated INTEGER DEFAULT 0;
