const express = require("express")
const authValidation = require("../middleware/auth.middleware");
const sessionsController = require("../controllers/session.controller")

// Session route:
// Start/end are POST because they create/update state
// list is GET


const router = express.Router();

router.post("/games/:id/sessions/start", authValidation, sessionsController.start)
router.post("/games/:id/sessions/end", authValidation, sessionsController.end)
router.get("/games/:id/sessions", authValidation, sessionsController.listByGame)

// server hydration endpoint:

router.get("/sessions/active", authValidation, sessionsController.active)

module.exports = router;