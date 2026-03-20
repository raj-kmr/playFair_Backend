const pool = require("../config/db")
const { getAvailableMinutes, getUnlockRule} = require("../services/unlock.service")

// Create or update Rule
async function createAndUpdateRule(req, res) {
    try {
        const userId = req.user.id;
        const {minutesPerTask, dailyLimit} = req.body;

        if(!minutesPerTask) {
            return res.status(404).json({
                message: "minutesPerTask is required"
            })
        }

        const existingRule = await getUnlockRule(userId);

        // If rule exist we update 
        if(existingRule){
            const result = await pool.query(`
                    UPDATE unlock_rules
                    SET minutes_per_task = $1
                        daily_limit_minutes = $2
                    WHERE user_id = $3
                    RETURNING *
                `, [minutesPerTask, dailyLimit || null, userId])

            return res.json(result.rows[0])
        }

        // if rule does not exist we create
        const result = await pool.query(`
                INSERT INTO unlock_rules
                (user_id, minutes_per_task, daily_limit_minutes)
                VALUES($1, $2, $3)
                RETURNING *
            `, [userId, minutesPerTask, dailyLimit || null])

        return res.status(201).json(result.rows[0])
    } catch(err) {
        console.error("Create/update rule error", err)

        res.status(500).json({
            message: "Internal server error"
        })
    }
}

// Getting user unlock rule
async function getRule(req, res){
    try {
        const userId = req.user.id;
        const rule = await getUnlockRule(userId)

        res.json(rule);
    } catch(err) {
        console.error("Get rule error", err)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

async function getAvailableTime(req, res){
    try {
        const userId = req.user.id;
        console.log("USER ID FROM TOKEN:", userId);
        const data = await getAvailableMinutes(userId)
        res.json(data);
    } catch(err){
        console.error("Get Available minutes error: ", err)

        res.status(500).json({
            message: "Internal server error"
        })
    }
}

module.exports = {
    createAndUpdateRule,
    getRule,
    getAvailableTime
}