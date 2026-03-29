const express = require("express")
const router = express.Router()
const { signup, signin } = require("../controllers/auth.controller")
const rateLimit = require("express-rate-limit")

const loginLimiter = rateLimit({
    windowMs: 15 * 10 * 1000,
    max: 10,
    message: "Too many login attempts. Try again later"
})

router.post("/signup", signup)

router.post("/signin", loginLimiter, signin)

module.exports = router;