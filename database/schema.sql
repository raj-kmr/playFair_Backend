
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE gameList (
    id SERIAL PRIMARY KEY,
    users_id INTEGER UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user 
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE games (
    id SERIAL PRIMARY KEY,
    gamelist_id INTEGER NOT NULL,
    igdb_id INTEGER,
    description TEXT,
    name VARCHAR(150) NOT NULL,
    image TEXT,
    playtime_hours INTEGER DEFAULT 0,
    initial_playtime_minutes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_gamelist 
        FOREIGN KEY (gamelist_id)
        REFERENCES gamelist(id)
        ON DELETE CASCADE
);

CREATE TABLE game_sessions (
    id SERIAL PRIMARY KEY,
    users_id INTEGER NOT NULL,
    games_id INTEGER NOT NULL,

    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ended_at TIMESTAMPTZ NULL,
    duration_seconds INTEGER NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT fk_session_user 
            FOREIGN KEY (users_id)
            REFERENCES users(id)
            ON DELETE CASCADE,

    CONSTRAINT fk_session_game
            FOREIGN KEY (games_id)
            REFERENCES games(id)
            ON DELETE CASCADE
);

ALTER TABLE game_sessions 
ADD COLUMN duration_minutes INTEGER;

-- 
CREATE UNIQUE INDEX uniq_one_active_session_per_user
ON game_sessions(users_id)
WHERE ended_at IS NULL;

CREATE INDEX idx_sessions_user_game_started 
ON game_sessions(users_id, games_id, started_at DESC);


CREATE TABLE reminders (
    id SERIAL PRIMARY KEY,
    users_id INTEGER NOT NULL,
    games_id INTEGER,

    reminder_type VARCHAR(50) NOT NULL,
    reminder_value INTEGER NOT NULL,
    scheduled_time TIME,
    scheduled_days VARCHAR(20)[],

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reminder_user 
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reminder_game
        FOREIGN KEY (games_id)
        REFERENCES games(id)
        ON DELETE CASCADE
);

CREATE TABLE tasks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(100) NOT NULL,
  description TEXT,
  category VARCHAR(50),
  frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
  target_days TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE task_daily_status (
  id SERIAL PRIMARY KEY,
  task_id INTEGER NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  is_completed BOOLEAN NOT NULL default false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL default now(),
  updated_at TIMESTAMPTZ NOT NULL default now(),
  unique (task_id, date)
);

CREATE INDEX  idx_tasks_user_id ON tasks(user_id);
CREATE INDEX  idx_tasks_user_active ON tasks(user_id, is_active);
CREATE INDEX  idx_task_daily_status_user_date ON task_daily_status(user_id, date);


CREATE TABLE unlock_rules (
     id SERIAL PRIMARY KEY,
     user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
     minutes_per_task INTEGER NOT NULL DEFAULT 30,
     daily_limit_minutes INTEGER DEFAULT NULL,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notification_queue (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP
);

CREATE INDEX idx_notification_queue_sent ON notification_queue(sent);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);

ALTER TABLE users ADD COLUMN IF NOT EXISTS expo_push_token TEXT;