const express = require("express")
const router = express.Router()
const { signup, signin } = require("../controllers/auth.controller")

router.post("/signup",(req, res, next) => {
    console.log("Signup route hit")
    next()
}, signup)

router.post("/signin", signin)

module.exports = router;