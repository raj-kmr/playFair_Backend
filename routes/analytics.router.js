const express  = require("express")
const router = express.Router();

const {
    getPlaytimeAnalytics,
    getSessionAnalytics,
    getTaskAnalytics
} = require("../controllers/analytics.controller")
const authMiddleware = require("../middleware/auth.middleware")


router.get("/playtime", authMiddleware, getPlaytimeAnalytics);
router.get("/sessions", authMiddleware, getSessionAnalytics);
router.get("/tasks", authMiddleware, getTaskAnalytics)

module.exports = router;