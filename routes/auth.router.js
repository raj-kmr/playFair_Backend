const express = require("express")
const router = express.Router()
const { signup, signin, savePushToken } = require("../controllers/auth.controller")
const rateLimit = require("express-rate-limit")
const authMiddleware = require("../middleware/auth.middleware")

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many attempts, please try again after 15 minutes" }
})

const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: "Too many signup attempts, please try again after 1 hour" }
})

router.post("/signup", strictLimiter, signup)

router.post("/signin", authLimiter, signin)

router.post("/push-token", authMiddleware, savePushToken)

module.exports = router;