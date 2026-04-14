const pool = require("../config/db")

async function createReminder({userId, gamesId, reminderType, reminderValue, scheduledTime, scheduledDays}){
    console.log("Creating reminder with params:", {userId, gamesId, reminderType, reminderValue, scheduledTime, scheduledDays});
    
    const query = `
        INSERT INTO reminders (users_id, games_id, reminder_type, reminder_value, scheduled_time, scheduled_days)
        VALUES($1, $2, $3, $4, $5, $6)
        RETURNING *
    `

    try {
        const {rows} = await pool.query(query, [
            userId,
            gamesId || null,
            reminderType,
            reminderValue,
            scheduledTime || null,
            scheduledDays || null
        ])
    
        console.log("Reminder created:", rows[0]);
        return rows[0]
    } catch(err) {
        console.error("SQL error in createReminder:", err.message);
        console.error("SQL error detail:", err.detail);
        console.error("SQL error constraint:", err.constraint);
        throw err;
    }
}

async function getReminders(userId) {
    const query = `
        SELECT r.*, g.name AS game_name
        FROM reminders r
        LEFT JOIN games g ON r.games_id = g.id
        WHERE r.users_id = $1
        ORDER BY r.created_at DESC;
    `;

    const {rows} = await pool.query(query, [userId])
    return rows;
}

async function updateReminder(id, userId, updates) {
    const fields = []
    const values = []
    let index =  1;

    Object.entries(updates).forEach(([key, value]) => {
        fields.push(`${key} = $${index}`)
        values.push(value)
        index++;
    }) 

    const query = `
        UPDATE reminders
        SET ${fields.join(", ")}
        WHERE id = $${index} AND users_id = $${index + 1}
        RETURNING *;
    `;

    values.push(id, userId);

    const {rows} = await pool.query(query, values);
    return rows[0];
}

async function deleteReminders(id, userId) {
    const query = `
        DELETE FROM reminders
        WHERE id = $1 AND users_id = $2
        RETURNING *;
    `

    const { rows } = await pool.query(query, [id, userId])
    return rows[0];
}

module.exports = {
    createReminder,
    getReminders,
    updateReminder,
    deleteReminders
}