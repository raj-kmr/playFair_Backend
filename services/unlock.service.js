const pool = require("../config/db")

// Get user unlock rules
async function getUnlockRule(userId) {
    const result = await pool.query(`
            SELECT * FROM unlock_rules WHERE user_id = $1 LIMIT 1
        `, [userId])

    return result.rows[0] || null;
}

// Get completed tasks count for today
async function getCompletedTasksToday(userId) {
    const result = await pool.query(`
        SELECT COUNT(*) FROM task_daily_status
        WHERE user_id = $1
        AND is_completed = true
        AND date = CURRENT_DATE
    `, [userId]);

    console.log("DEBUG TASK COUNT:", result.rows[0].count);

    return parseInt(result.rows[0].count, 10);
}

// Get total used minutes today from sessions
async function getUsedMinutesToday(userId) {
    const result = await pool.query(`
        SELECT COALESCE(SUM(duration_seconds), 0) AS total_seconds
        FROM game_sessions
        WHERE users_id = $1
        AND DATE(started_at) = CURRENT_DATE
        AND ended_at IS NOT NULL
    `, [userId]);

    const totalSeconds = parseInt(result.rows[0].total_seconds, 10);

    // convert seconds → minutes
    return Math.ceil(totalSeconds / 60);
}

// Calculate Available minutes
async function getAvailableMinutes(userId, dbClient = pool) {
    console.log("INSIDE getAvailableMinutes");

    const rule = await getUnlockRule(userId);
    console.log("Rule,:  ", rule);

    if (!rule) {
        return {
            availableMinutes: 0,
            earnedMinutes: 0,
            usedMinutes: 0
        }
    }

    const completedTasks = await getCompletedTasksToday(userId)
    const usedMinutes = await getUsedMinutesToday(userId)

    const earnedMinutes = completedTasks * rule.minutes_per_task;

    let availableMinutes = earnedMinutes - usedMinutes;

    if (rule.daily_limit_minutes) {
        availableMinutes = Math.min(availableMinutes, rule.daily_limit_minutes);
    }

    if (availableMinutes < 0) availableMinutes = 0;

    return {
        availableMinutes,
        earnedMinutes,
        usedMinutes
    }
}

module.exports = {
    getUnlockRule,
    getAvailableMinutes
}