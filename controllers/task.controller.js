const { validateCreateTaskBody, validateDailyStatusBody, validateUpdateTaskBody } = require("../validators/task.validator");
const {
    createTaskService,
    getTasksService,
    updateTaskDailyStatusService,
    getTaskDailyStatusService,
    updateTaskService,
    deleteTaskService
} = require("../services/task.service")


// Create task controller 
async function createTask(req, res) {
    try {
        // validate the request body
        const validation = validateCreateTaskBody(req.body);

        // if validation fails
        if (validation.error) {
            return res.status(400).json({ message: validation.error })
        }

        const userId = req.user.id; // coming from auth middleware

        const task = await createTaskService(userId, validation.value);

        return res.status(201).json({
            message: "Task created successfully",
            task
        })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error"
        })
    }
}

// Get tasks controller
async function getTasks(req, res) {
    try {
        const userId = req.user.id;

        const active = req.query.active;
        const tasks = await getTasksService(userId, { active })

        return res.status(200).json({ tasks })
    } catch (error) {
        return res.status(500).json({
            message: error.message || "Internal server error"
        })
    }
}

// Update task daily status
async function updateTaskDailyStatus(req, res) {
    try {
        const validation = validateDailyStatusBody(req.body)

        if (validation.error) {
            return res.status(400).json({ message: validation.error })
        }

        const userId = req.user.id;
        const taskId = Number(req.params.id)

        if (!taskId) {
            return res.status(400).json({ message: "Invalid task Id" })
        }

        const status = await updateTaskDailyStatusService(
            userId,
            taskId,
            validation.value
        );

        return res.status(200).json({
            message: "Task Updated Successfully",
            status
        })
    } catch (err) {
        if (err.message === "TASK NOT FOUND") {
            return res.status(404).json({ message: "task not found" })
        }

        if (err.message === "TASK_INACTIVE") {
            return res.status(400).json({ message: "Inactive task can not be updated" })
        }

        return res.status(500).json({
            message: err.message || "Internal Server error"
        })
    }
}

async function getTaskDailyStatus(req, res) {
    try {
        const userId = req.user.id;

        const date = req.query.date;

        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return res.status(400).json({
                message: "Valid date query param is required"
            })
        }

        const result = await getTaskDailyStatusService(userId, date)

        return res.status(200).json(result)
    } catch (err) {
        return res.status(500).json({
            message: err.message || "Internal server error"
        })
    }
}

async function updateTask(req, res) {
    try {
        const validation = validateUpdateTaskBody(req.body);

        if (validation.error) {
            return res.status(400).json({ message: validation.error })
        }

        const userId = req.user.id;
        const taskId = Number(req.params.id);

        if (!taskId) {
            return res.status(400).json({ message: "Invalid task ID" });
        }

        const task = await updateTaskService(userId, taskId, validation.value);

        return res.status(200).json({
            message: "Task updated successfully",
            task
        })
    } catch (err) {
        if (err.message === "TASK_NOT_FOUND") {
            return res.status(404).json({ message: "Task not found" })
        }

        if (err.message === "DUPLICATE_TASK") {
            return res.status(404).json({ message: "A similar active task already exist" })
        }

        return res.status(500).json({
            message: err.message || "Internal server error"
        })
    }
}

async function deleteTask(req, res) {
    try {
        const userId = req.user.id;
        const taskId = Number(req.params.id);

        if(!taskId) {
            return res.status(400).json({message: "Invalid task ID"})
        }

        await deleteTaskService(userId, taskId);

        return res.status(200).json({
            message: "Task deleted successfully"
        })
    } catch(err){
        if(err.message === "TASK_NOT_FOUND"){
            return res.status(404).json({message: "Task not found"})
        }

        return res.status(500).json({
            message: err.message || "Internal server error"
        })
    }
}

module.exports = {
    createTask,
    getTasks,
    updateTaskDailyStatus,
    getTaskDailyStatus,
    updateTask,
    deleteTask
}