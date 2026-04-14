const pool = require("../config/db")
const { getAvailableMinutes } = require("./unlock.service")

async function checkAndNotifySessionLimit() {
    try {
        const activeSessions = await pool.query(`
            SELECT DISTINCT users_id 
            FROM game_sessions 
            WHERE ended_at IS NULL
        `)

        for (const row of activeSessions.rows) {
            const userId = row.users_id
            const { availableMinutes, usedMinutes, earnedMinutes } = await getAvailableMinutes(userId)

            if (availableMinutes <= 0 && usedMinutes > 0) {
                const reminder = await pool.query(`
                    SELECT * FROM reminders 
                    WHERE users_id = $1 
                    AND reminder_type = 'session_limit' 
                    AND is_active = true
                    LIMIT 1
                `, [userId])

                if (reminder.rows.length > 0) {
                    await pool.query(`
                        INSERT INTO notification_queue (user_id, title, body, data, created_at)
                        VALUES ($1, $2, $3, $4, NOW())
                    `, [
                        userId,
                        'Session Time Used Up',
                        `You've used all your available game time (${usedMinutes} minutes). Complete more tasks to unlock additional time!`,
                        JSON.stringify({ type: 'session_limit', usedMinutes })
                    ])
                }
            }
        }
    } catch (err) {
        console.error("Error checking session limit notifications:", err)
    }
}

async function checkAndNotifyScheduledGameTime() {
    try {
        const now = new Date()
        const currentTime = now.toISOString().slice(11, 16)
        const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

        const reminders = await pool.query(`
            SELECT r.*, u.expo_push_token 
            FROM reminders r
            JOIN users u ON r.users_id = u.id
            WHERE r.reminder_type = 'game_time'
            AND r.is_active = true
            AND r.scheduled_time = $1
            AND (r.scheduled_days IS NULL OR $2 = ANY(r.scheduled_days))
        `, [currentTime, currentDay])

        for (const reminder of reminders.rows) {
            if (reminder.expo_push_token) {
                await pool.query(`
                    INSERT INTO notification_queue (user_id, title, body, data, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [
                    reminder.users_id,
                    'Game Time!',
                    'It\'s time for your scheduled gaming session. Enjoy!',
                    JSON.stringify({ type: 'game_time', reminderId: reminder.id })
                ])
            }
        }
    } catch (err) {
        console.error("Error checking scheduled game time notifications:", err)
    }
}

async function checkAndNotifyBreakReminder() {
    try {
        const activeSessions = await pool.query(`
            SELECT gs.users_id, gs.games_id, gs.started_at, r.reminder_value, g.name as game_name
            FROM game_sessions gs
            JOIN reminders r ON gs.users_id = r.users_id 
                AND r.reminder_type = 'break_reminder' 
                AND r.is_active = true
            LEFT JOIN games g ON gs.games_id = g.id
            WHERE gs.ended_at IS NULL
        `)

        for (const session of activeSessions.rows) {
            const startedAt = new Date(session.started_at)
            const now = new Date()
            const minutesPlayed = Math.floor((now - startedAt) / 60000)

            if (minutesPlayed >= session.reminder_value) {
                await pool.query(`
                    INSERT INTO notification_queue (user_id, title, body, data, created_at)
                    VALUES ($1, $2, $3, $4, NOW())
                `, [
                    session.users_id,
                    'Break Reminder',
                    `You've been gaming for ${minutesPlayed} minutes. Time to take a break!`,
                    JSON.stringify({ type: 'break_reminder', minutesPlayed, gameName: session.game_name })
                ])
            }
        }
    } catch (err) {
        console.error("Error checking break reminder notifications:", err)
    }
}

async function processNotificationQueue() {
    try {
        const notifications = await pool.query(`
            SELECT * FROM notification_queue 
            WHERE sent = false 
            ORDER BY created_at ASC
            LIMIT 100
        `)

        for (const notification of notifications.rows) {
            const { expo_push_token } = await pool.query(
                'SELECT expo_push_token FROM users WHERE id = $1',
                [notification.user_id]
            )

            if (expo_push_token.rows[0]?.expo_push_token) {
                const message = {
                    to: expo_push_token.rows[0].expo_push_token,
                    sound: 'default',
                    title: notification.title,
                    body: notification.body,
                    data: JSON.parse(notification.data)
                }

                await fetch('https://exp.host/--/api/v2/push/send', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(message)
                })
            }

            await pool.query(
                'UPDATE notification_queue SET sent = true, sent_at = NOW() WHERE id = $1',
                [notification.id]
            )
        }
    } catch (err) {
        console.error("Error processing notification queue:", err)
    }
}

async function runNotificationChecks() {
    await checkAndNotifySessionLimit()
    await checkAndNotifyScheduledGameTime()
    await checkAndNotifyBreakReminder()
    await processNotificationQueue()
}

module.exports = {
    checkAndNotifySessionLimit,
    checkAndNotifyScheduledGameTime,
    checkAndNotifyBreakReminder,
    processNotificationQueue,
    runNotificationChecks
}
