const pool = require("../config/db")

async function createReminder({userId, gamesId, reminderType, reminderValue}){
    const query = `
        INSERT INTO reminders (users_id, games_id, reminder_type, reminder_value)
        VALUES($1, $2, $3, $4)
        RETURNING *
    `

    const {rows} = await pool.query(query, [
        userId,
        gamesId || null,
        reminderType,
        reminderValue
    ])

    return rows[0]
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