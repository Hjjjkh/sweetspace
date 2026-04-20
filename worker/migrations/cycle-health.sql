-- ============================================
-- 生理周期 + 健康记录系统
-- D1 Database Schema for Cycle Health Module
-- ============================================

-- 周期日志表（记录周期基础数据）
CREATE TABLE IF NOT EXISTS cycle_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    
    -- 周期基础信息
    cycle_start_date TEXT NOT NULL,  -- YYYY-MM-DD，本次月经开始日期
    cycle_length INTEGER DEFAULT 28,  -- 周期长度（天）
    period_length INTEGER DEFAULT 5,  -- 经期长度（天）
    
    -- 预测信息
    predicted_next_start TEXT,  -- 预测下次月经开始日期
    predicted_ovulation TEXT,   -- 预测排卵日
    
    -- 状态
    is_active INTEGER DEFAULT 1,  -- 是否为当前活跃周期
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_start ON cycle_logs(cycle_start_date);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_active ON cycle_logs(is_active);

-- 每日健康记录表
CREATE TABLE IF NOT EXISTS daily_health (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,  -- YYYY-MM-DD
    
    -- 情绪记录
    mood_type TEXT,  -- happy, neutral, sad, love (与 moods 表保持一致)
    mood_score INTEGER,  -- 1-10
    
    -- 生理指标
    flow_level TEXT,  -- none, light, medium, heavy (经期流量)
    symptoms TEXT,  -- JSON array: ["cramps", "headache", "bloating", ...]
    
    -- 生活习惯（布尔值存储为 0/1）
    habit_water INTEGER DEFAULT 0,     -- 多喝水
    habit_fruit INTEGER DEFAULT 0,     -- 吃水果
    habit_breakfast INTEGER DEFAULT 0, -- 吃早饭
    habit_exercise INTEGER DEFAULT 0,  -- 运动
    habit_bowel INTEGER DEFAULT 0,     -- 排便
    
    -- 周期阶段（自动计算）
    cycle_day INTEGER,  -- 周期第几天
    period_phase TEXT,  -- period, follicular, ovulation, luteal
    
    -- 备注
    note TEXT,
    
    -- 时间戳
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)  -- 每天每条记录
);

CREATE INDEX IF NOT EXISTS idx_daily_health_user ON daily_health(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_health_date ON daily_health(date);
CREATE INDEX IF NOT EXISTS idx_daily_health_phase ON daily_health(period_phase);

-- ============================================
-- 视图：周期概览
-- ============================================
CREATE VIEW IF NOT EXISTS v_cycle_overview AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    MAX(cl.cycle_start_date) as last_period_start,
    cl.cycle_length,
    cl.period_length,
    cl.predicted_next_start,
    cl.predicted_ovulation,
    -- 当前周期阶段
    CASE 
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= cl.period_length 
            THEN 'period'
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= 14 
            THEN 'follicular'
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= 16 
            THEN 'ovulation'
        ELSE 'luteal'
    END as current_phase,
    -- 当前周期天数
    CAST(julianday('now') - julianday(MAX(cl.cycle_start_date)) + 1 AS INTEGER) as current_cycle_day
FROM users u
LEFT JOIN cycle_logs cl ON u.id = cl.user_id AND cl.is_active = 1
GROUP BY u.id;

-- ============================================
-- 视图：本周健康数据
-- ============================================
CREATE VIEW IF NOT EXISTS v_week_health AS
SELECT 
    dh.date,
    dh.mood_type,
    dh.mood_score,
    dh.flow_level,
    dh.cycle_day,
    dh.period_phase,
    dh.habit_water,
    dh.habit_fruit,
    dh.habit_breakfast,
    dh.habit_exercise,
    dh.habit_bowel,
    -- 计算习惯完成数量
    (dh.habit_water + dh.habit_fruit + dh.habit_breakfast + dh.habit_exercise + dh.habit_bowel) as habits_completed
FROM daily_health dh
WHERE dh.date >= date('now', '-6 days')
  AND dh.date <= date('now')
ORDER BY dh.date DESC;

-- ============================================
-- 初始数据：周期阶段颜色配置
-- ============================================
INSERT OR IGNORE INTO settings (key, value) VALUES 
    ('phase_colors', '{"period":"#ef4444","follicular":"#22c55e","ovulation":"#a855f7","luteal":"#f97316"}');
