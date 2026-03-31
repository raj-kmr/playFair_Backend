const express = require("express");
const sessionsController = require("../controllers/session.controller");
const verifytoken = require("../middleware/auth.middleware");
const {validateGameAccess} = require("../middleware/validateGameAccess")

const router = express.Router();

/**
 * Start a new session for a specific game
 */
router.post("/games/:id/sessions/start", verifytoken, sessionsController.startSession);

/**
 * End the user's currently active session
 */
router.post("/sessions/end", verifytoken, sessionsController.endSession);

/**
 * Get session history for a specific game
 */
router.get("/games/:id/sessions", verifytoken, sessionsController.getSessionsByGame);

/**
 * Get the currently active session for the logged-in user
 */
router.get("/sessions/active", verifytoken, sessionsController.getActiveSession);

module.exports = router;