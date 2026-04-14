-- Add scheduled time columns to reminders table
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS scheduled_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_days VARCHAR(20)[];

-- Add notification queue table
CREATE TABLE IF NOT EXISTS notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notification_queue_sent ON notification_queue(sent);
CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);

-- Add expo push token column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;
