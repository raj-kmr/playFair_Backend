const pool = require("../config/db")

// Creates new task for user
async function createTaskService(userId, payload) {
    const { title, description, category, frequency, targetDays } = payload;

    const query = `
        INSERT INTO tasks (
        user_id,
        title,
        description,
        category,
        frequency,
        target_days
        ) VALUES ($1, $2, $3, $4, $5, $6)

        RETURNING
            id,
            title,
            description,
            category,
            frequency,
            target_days AS "targetDays",
            is_active AS "isActive",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
    `;

    const values = [userId, title, description, category, frequency, targetDays];

    const { rows } = await pool.query(query, values);

    return rows[0];
}

// Return all task to user
async function getTasksService(userId, options = {}) {

    let query = `
        SELECT 
            id,
            title,
            description,
            category,
            frequency,
            target_days AS "targetDays",
            is_active AS "isActive",
            created_as AS "createdAt",
            updated_at AS "updatedAt"
        FROM tasks
        WHERE user_id = $1
    `;

    const values = [userId]

    if (options.active === "true") {
        query += `AND is_active = true`
    }

    query += `ORDER BY created_at DESC`

    const { rows } = await pool.query(query, values)

    return rows;
}

// Marks a task complete or incomplete for the day
async function updateTaskDailyStatusService(userId, taskId, payload) {
    const { date, isCompleted } = payload;

    const taskCheckQuery = `
        SELECT id, is_active
        FROM tasks
        WHERE id = $1 and user_id = $2
        LIMIT 1
    `;

    const taskCheck = await pool.query(taskCheckQuery, [taskId, userId])

    if (!taskCheck.rows.length) {
        throw new Error("Task not found")
    }

    if (!taskCheck.rows[0].is_active) {
        throw new Error("Task Inactive")
    }

    const query = `
        INSERT INTO task_daily_status (
            task_id,
            user_id,
            date,
            is_completed,
            completed_at
        )
        VALUES (
            $1, $2, $3, $4,
            CASE WHEN $4 = true THEN NOW() ELSE NULL end
        )

        ON CONFLICT(task_id, date)

        DO UPDATE SET
            is_completed = EXCLUDED.is_completed,

            completed_at = CASE WHEN EXCLUDED.is_completed = true THEN NOW() ELSE NULL END,

            updated_at = NOW()
        
        RETURNING
            task_id AS "taskId",
            date,
            is_completed AS "isCompleted",
            completed_at AS "completedAt"
    `;

    const values = [taskId, userId, date, isCompleted];

    const { rows } = await pool.query(query, values)

    return rows[0];
}

// Returns all tasks and completion summary
async function getTaskDailyStatusService(userId, date) {
    const query = `
        SELECT
            t.id,
            t.title,
            t.description,
            t.category,
            t.frequency,
            t.target_days AS "targetDays",

            COALESCE(tds.is_completed, false) AS "isCompleted",

            tds.completed_at AS "completedAt"

            FROM tasks t
                LEFT JOIN task_daily_status tds
                ON t.id = tds.task_id
                AND tds.date = $2

            WHERE 
                t.user_id = $1
                AND t.is_active = true

            ORDER BY t.created_at DESC
    `;

    const { rows } = await pool.query(query, [userId, date])

    const total = rows.length;

    const completed = rows.filter((task) => task.isCompleted).length;

    const percentage = total === 0 ? 0 : Math.round((completed / total) * 100);

    // console.log("DAILY STATUS ROWS:", rows);
    // console.log("SUMMARY DEBUG:", {
    //     total: rows.length,
    //     completed: rows.filter((task) => task.isCompleted).length,
    // });

    return {
        date,
        summary: {
            total,
            completed,
            percentage
        },
        tasks: rows
    }
}

async function updateTaskService(userId, taskId, payload) {
    const {title, description, category, frequency, targetDays} = payload;

    const existingTaskQuery = `
        SELECT id
        FROM tasks
        WHERE id = $1
            AND user_id = $2
            AND is_active = true
        LIMIT 1
    `

    const existingTaskResult = await pool.query(existingTaskQuery, [taskId, userId]);

    if(!existingTaskResult){
        throw new Error("TASK_NOT_FOUND");
    }

    const duplicateCheckQuery = `
        SELECT id
        FROM tasks
        WHERE user_id = $1
            AND is_active = true
            AND LOWER(TRIM(title)) = LOWER(TRIM($2))
            AND id != $3
        LIMIT 1
    `

    const duplicateCheckResult = await pool.query(duplicateCheckQuery, [userId, title, taskId]);

    if(duplicateCheckResult.rows.length){
        throw new Error("DUPLICATE_TASK")
    }

    const updateQuery = `
        UPDATE tasks
        SET
            title = $1,
            description = $2,
            category = $3,
            frequency = $4,
            target_days = $5,
            updated_at = now()
        WHERE id = $6
            AND user_id = $7
            AND is_active = true
        RETURNING
            id,
            title,
            description,
            category,
            frequency,
            target_days AS "targetDays",
            created_at AS "createdAt",
            updated_at AS "updatedAt"
    `;

    const {rows} = await pool.query(updateQuery, [
        title,
        description,
        category,
        frequency,
        targetDays,
        taskId,
        userId
    ]);

    return rows[0];
}

async function deleteTaskService(userId, taskId) {
    const query = `
        UPDATE tasks
        SET
            is_active = false,
            updated_at = now()
        WHERE id = $1
            AND user_id = $2
            AND is_active = true
        RETURNING id
    `

    const {rows} = await pool.query(query, [taskId, userId])
    
    if(!rows.length){
        throw new Error("TASK_NOT_FOUND")
    }
}

module.exports = {
    createTaskService,
    getTasksService,
    updateTaskDailyStatusService,
    getTaskDailyStatusService,
    updateTaskService,
    deleteTaskService
}

