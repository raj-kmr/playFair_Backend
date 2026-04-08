const pool = require("../config/db")

async function getTotalPlaytime (userId) {
    const query = `
        SELECT
            COALESCE(SUM(duration_minutes), 0) AS total_minutes
        FROM game_sessions
        WHERE users_id = $1
        AND ended_at IS NOT NULL
    `

    const { rows } = await pool.query(query, [userId])

    return rows[0];
}

// get playtime for each day (7 days)
async function getWeeklyPlaytime (userId) {
    const query = `
        WITH date_series AS (
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '6 days',
                CURRENT_DATE,
                '1 day'
            )::date AS day
        )
        SELECT 
            ds.day,
            COALESCE(SUM(gs.duration_minutes), 0) AS minutes
        FROM date_series ds
        LEFT JOIN game_sessions gs 
            ON DATE(gs.started_at) = ds.day 
            AND gs.users_id = $1
            AND gs.ended_at IS NOT NULL
        GROUP BY ds.day
        ORDER BY ds.day ASC;
    `

    const {rows} = await pool.query(query, [userId])

    return rows;
}

// Get playtime group by week (last 1 month)
async function getMonthlyPlaytime(userId) {
    const query = `
        SELECT
            DATE_TRUNC('week', started_at) AS week,
            COALESCE(SUM(duration_minutes), 0) AS minutes
        FROM game_sessions
        WHERE users_id = $1
            AND started_at >= NOW() - INTERVAL '1 month'
            AND ended_at IS NOT NULL
        GROUP BY week
        ORDER BY week ASC
    `

    const { rows } = await pool.query(query, [userId])

    return rows;
}

// Session Analytics
// Get session statistics
async function getSessionStats (userId) {
    const query = `
        SELECT 
            COUNT(*) AS total_sessions,
            COALESCE(AVG(duration_minutes), 0)::Float AS avg_session_minutes,
            COALESCE(MAX(duration_minutes), 0) AS max_session_minutes
        FROM game_sessions
        WHERE users_id = $1
            AND ended_at IS NOT NULL
    `

    const { rows }  = await pool.query(query, [userId])

    return {
        total_sessions: parseInt(rows[0].total_sessions, 10),
        avg_session_minutes: parseFloat(rows[0].avg_session_minutes),
        max_session_minutes: parseInt(rows[0].max_session_minutes, 10)
    }
}

// Task analytics
// Get task completion rate
async function getTaskCompletionRate(userId) {
    const query = `
        SELECT
            COUNT(*) FILTER(WHERE is_completed = true) AS completed,
            COUNT(*) AS total
        FROM task_daily_status
        WHERE user_id = $1
            AND date >= NOW() - INTERVAL '7 days'
    `

    const { rows } = await pool.query(query, [userId])

    const completed = parseInt(rows[0].completed, 10)
    const total = parseInt(rows[0].total, 10)
    const percentage = total === 0 ? 0 : (completed / total) * 100;

    return {
        completed,
        total,
        percentage
    }
}

module.exports = {
    getTotalPlaytime,
    getWeeklyPlaytime,
    getMonthlyPlaytime,
    getSessionStats,
    getTaskCompletionRate
}