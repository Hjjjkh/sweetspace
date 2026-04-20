-- Gallery Photos Table (使用 D1 存储 Base64 图片数据)
-- 适合中小尺寸图片，简化部署流程

CREATE TABLE IF NOT EXISTS gallery_photos (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  file_data TEXT NOT NULL,  -- Base64 encoded image data
  thumbnail_data TEXT,      -- Base64 encoded thumbnail (optional)
  file_type TEXT NOT NULL,  -- MIME type: image/jpeg, image/png, etc.
  file_size INTEGER NOT NULL,  -- File size in bytes
  taken_at INTEGER,         -- Timestamp when photo was taken
  created_at TEXT NOT NULL, -- ISO 8601 timestamp
  updated_at TEXT,
  
  -- Indexes for fast queries
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gallery_user_id ON gallery_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_gallery_created_at ON gallery_photos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gallery_taken_at ON gallery_photos(taken_at);
