const express = require("express")
const router = express.Router();
const {gettingReminders, creatingReminder, updatingReminder, deletingReminder} = require("../controllers/reminders.controller");
const verifyToken = require("../middleware/auth.middleware");

router.post("/", verifyToken, creatingReminder);
router.get("/", verifyToken, gettingReminders);
router.patch("/:id", verifyToken, updatingReminder);
router.delete("/:id", verifyToken, deletingReminder);

module.exports = router;