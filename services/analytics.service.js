const pool = require("../config/db")

async function getTotalPlaytime (userId, timeRange = '7d') {
    let dateFilter = '';
    let prevDateFilter = '';
    
    // Calculate current period filter
    if (timeRange === '7d') {
        dateFilter = 'AND ended_at >= NOW() - INTERVAL \'7 days\'';
        prevDateFilter = 'AND ended_at >= NOW() - INTERVAL \'14 days\' AND started_at < NOW() - INTERVAL \'7 days\'';
    } else if (timeRange === '30d') {
        dateFilter = 'AND ended_at >= NOW() - INTERVAL \'30 days\'';
        prevDateFilter = 'AND ended_at >= NOW() - INTERVAL \'60 days\' AND started_at < NOW() - INTERVAL \'30 days\'';
    }

    const query = `
        SELECT
            COALESCE(SUM(duration_seconds) / 60.0, 0)::FLOAT AS total_minutes
        FROM game_sessions
        WHERE users_id = $1
        AND ended_at IS NOT NULL
        ${dateFilter}
    `

    const { rows } = await pool.query(query, [userId])
    
    // Also get previous period data for trend calculation
    const prevQuery = `
        SELECT
            COALESCE(SUM(duration_seconds)/ 60.0, 0)::FLOAT AS previous_total_minutes
        FROM game_sessions
        WHERE users_id = $1
        AND ended_at IS NOT NULL
        ${prevDateFilter}
    `
    
    const { rows: prevRows } = await pool.query(prevQuery, [userId])

    return {
        total_minutes: rows[0].total_minutes,
        previous_total_minutes: prevRows[0].previous_total_minutes || 0
    };
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
            TO_CHAR(ds.day, 'YYYY-MM-DD') AS day,
            COALESCE(SUM(gs.duration_seconds) / 60.0, 0)::FLOAT AS minutes
        FROM date_series ds
        LEFT JOIN game_sessions gs 
            ON DATE(gs.ended_at) = ds.day 
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
            TO_CHAR(DATE_TRUNC('week', ended_at), 'YYYY-MM-DD') AS week,
            COALESCE(SUM(duration_seconds) / 60.0, 0)::FLOAT AS minutes
        FROM game_sessions
        WHERE users_id = $1
            AND ended_at >= NOW() - INTERVAL '1 month'
            AND ended_at IS NOT NULL
        GROUP BY DATE_TRUNC('week', ended_at)
        ORDER BY DATE_TRUNC('week', ended_at) ASC
    `

    const { rows } = await pool.query(query, [userId])

    return rows;
}

// Session Analytics
// Get session statistics
async function getSessionStats (userId, timeRange = '7d') {
    let dateFilter = '';
    let prevDateFilter = '';
    if (timeRange === '7d') {
        dateFilter = 'AND started_at >= NOW() - INTERVAL \'7 days\'';
        prevDateFilter = 'AND started_at >= NOW() - INTERVAL \'14 days\' AND started_at < NOW() - INTERVAL \'7 days\'';
    } else if (timeRange === '30d') {
        dateFilter = 'AND started_at >= NOW() - INTERVAL \'30 days\'';
        prevDateFilter = 'AND started_at >= NOW() - INTERVAL \'60 days\' AND started_at < NOW() - INTERVAL \'30 days\'';
    } else if (timeRange === '90d') {
        dateFilter = 'AND started_at >= NOW() - INTERVAL \'90 days\'';
        prevDateFilter = 'AND started_at >= NOW() - INTERVAL \'180 days\' AND started_at < NOW() - INTERVAL \'90 days\'';
    }

    const query = `
        SELECT 
            COUNT(*) AS total_sessions,
            COALESCE(AVG(duration_seconds) / 60.0, 0)::FLOAT AS avg_session_minutes,
            COALESCE(MAX(duration_seconds) / 60.0, 0)::FLOAT AS max_session_minutes
        FROM game_sessions
        WHERE users_id = $1
            AND ended_at IS NOT NULL
            ${dateFilter}
    `

    const { rows }  = await pool.query(query, [userId])

    const prevQuery = `
        SELECT 
            COUNT(*) AS previous_week_sessions
        FROM game_sessions
        WHERE users_id = $1
            AND ended_at IS NOT NULL
            ${prevDateFilter}
    `

    const { rows: prevRows } = await pool.query(prevQuery, [userId])

    return {
        total_sessions: parseInt(rows[0].total_sessions, 10),
        avg_session_minutes: Number(rows[0].avg_session_minutes),
        max_session_minutes: Number(rows[0].max_session_minutes, 10),
        previous_week_sessions: parseInt(prevRows[0].previous_week_sessions, 10) || 0
    }
}

// Task analytics
// Get task completion rate
async function getTaskCompletionRate(userId, timeRange = '7d') {
    let dateFilter = '';
    if (timeRange === '7d') {
        dateFilter = 'AND date >= NOW() - INTERVAL \'7 days\'';
    } else if (timeRange === '30d') {
        dateFilter = 'AND date >= NOW() - INTERVAL \'30 days\'';
    } else if (timeRange === '90d') {
        dateFilter = 'AND date >= NOW() - INTERVAL \'90 days\'';
    }

    const query = `
        SELECT
            COUNT(*) FILTER(WHERE is_completed = true) AS completed,
            COUNT(*) AS total
        FROM task_daily_status
        WHERE user_id = $1
            ${dateFilter}
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