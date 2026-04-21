CREATE TABLE IF NOT EXISTS cycle_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    cycle_start_date TEXT NOT NULL,
    cycle_length INTEGER DEFAULT 28,
    period_length INTEGER DEFAULT 5,
    predicted_next_start TEXT,
    predicted_ovulation TEXT,
    is_active INTEGER DEFAULT 1,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_cycle_logs_user ON cycle_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_start ON cycle_logs(cycle_start_date);
CREATE INDEX IF NOT EXISTS idx_cycle_logs_active ON cycle_logs(is_active);

CREATE TABLE IF NOT EXISTS daily_health (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    date TEXT NOT NULL,
    mood_type TEXT,
    mood_score INTEGER,
    flow_level TEXT,
    symptoms TEXT,
    habit_water INTEGER DEFAULT 0,
    habit_fruit INTEGER DEFAULT 0,
    habit_breakfast INTEGER DEFAULT 0,
    habit_exercise INTEGER DEFAULT 0,
    habit_bowel INTEGER DEFAULT 0,
    cycle_day INTEGER,
    period_phase TEXT,
    note TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_health_user ON daily_health(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_health_date ON daily_health(date);
CREATE INDEX IF NOT EXISTS idx_daily_health_phase ON daily_health(period_phase);

CREATE VIEW IF NOT EXISTS v_cycle_overview AS
SELECT 
    u.id as user_id,
    u.name as user_name,
    MAX(cl.cycle_start_date) as last_period_start,
    cl.cycle_length,
    cl.period_length,
    cl.predicted_next_start,
    cl.predicted_ovulation,
    CASE 
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= cl.period_length 
            THEN 'period'
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= 14 
            THEN 'follicular'
        WHEN julianday('now') - julianday(MAX(cl.cycle_start_date)) <= 16 
            THEN 'ovulation'
        ELSE 'luteal'
    END as current_phase,
    CAST(julianday('now') - julianday(MAX(cl.cycle_start_date)) + 1 AS INTEGER) as current_cycle_day
FROM users u
LEFT JOIN cycle_logs cl ON u.id = cl.user_id AND cl.is_active = 1
GROUP BY u.id;

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
    (dh.habit_water + dh.habit_fruit + dh.habit_breakfast + dh.habit_exercise + dh.habit_bowel) as habits_completed
FROM daily_health dh
WHERE dh.date >= date('now', '-6 days')
  AND dh.date <= date('now')
ORDER BY dh.date DESC;
