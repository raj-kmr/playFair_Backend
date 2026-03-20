const express = require('express')
const router = express.Router();

const verifytoken = require("../middleware/auth.middleware");
const { createAndUpdateRule, getRule, getAvailableTime } = require('../controllers/unlock.controller');

router.post("/", verifytoken, createAndUpdateRule)
router.get("/", verifytoken, getRule)
router.get("/available-time", verifytoken, getAvailableTime)

module.exports = router;