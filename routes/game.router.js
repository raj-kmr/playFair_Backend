const express = require("express")
const router = express.Router()

const {getGame, createGame, updateGame, deleteGame, addIgdbGame} = require("../controllers/game.controller")

const verifyToken = require("../middleware/auth.middleware")

router.get("/",verifyToken, getGame)
router.post("/",verifyToken, createGame)
router.patch("/:id",verifyToken, updateGame)
router.delete("/:id",verifyToken, deleteGame)
router.post("/igdb", verifyToken, addIgdbGame)

module.exports = router;