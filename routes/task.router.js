const express = require("express")
const router = express.Router();

const {
    createTask,
    getTasks,
    updateTaskDailyStatus,
    getTaskDailyStatus,
    updateTask,
    deleteTask
} = require("../controllers/task.controller")
const authMiddlware = require("../middleware/auth.middleware");

router.post("/tasks", authMiddlware, createTask)
router.get("/tasks", authMiddlware, getTasks)
router.patch("/tasks/:id/daily-status", authMiddlware, updateTaskDailyStatus)
router.get("/tasks/daily-status", authMiddlware, getTaskDailyStatus)
router.patch("/tasks/:id", authMiddlware, updateTask)
router.delete("/tasks/:id", authMiddlware, deleteTask)

module.exports = router;