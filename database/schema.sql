
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

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_reminder_user 
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE

    CONSTRAINT fk_reminder_game
        FOREIGN KEY (games_id)
        REFERENCES games(id)
        ON DELETE CASCADE
);

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    users_id INTEGER NOT  NULL,

    title VARCHAR(100) NOT NULL,
    category VARCHAR(50),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_task_user 
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

CREATE TABLE daily_task_status (
    id SERIAL PRIMARY KEY,
    tasks_id INTEGER NOT NULL,
    date DATE NOT NULL,

    is_completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,

    CONSTRAINT fk_daily_tasks 
        FOREIGN KEY (tasks_id)
        REFERENCES tasks(id)
        ON DELETE CASCADE

    CONSTRAINT unique_task_per_day
        UNIQUE (tasks_id, date),
);


CREATE TABLE gaming_unlock_rules (
    id SERIAL PRIMARY KEY,
    users_id INTEGER NOT NULL,

    required_tasks INTEGER NOT NULL,
    unlock_minutes INTEGER NOT NULL,

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_unlock_user 
        FOREIGN KEY (users_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
);
