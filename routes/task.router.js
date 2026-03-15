const express = require("express")
const router = express.Router();

const {
    createTask,
    getTasks,
    updateTaskDailyStatus,
    getTaskDailyStatus
} = require("../controllers/task.controller")
const authMiddlware = require("../middleware/auth.middleware");

router.post("/tasks", authMiddlware, createTask)
router.get("/tasks", authMiddlware, getTasks)
router.patch("/tasks/:id/daily-status", authMiddlware, (req, res, next) => {
    console.log("PATCH /:id/daily-status route hit", req.params, req.body);
    next();
}, updateTaskDailyStatus)
router.get("/tasks/daily-status", authMiddlware, getTaskDailyStatus)

module.exports = router;