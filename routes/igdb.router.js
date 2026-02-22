const router = require("express").Router();
const { searchGames } = require("../controllers/igdb.controller");
const verifyToken = require("../middleware/auth.middleware")

router.get("/search", verifyToken,  searchGames)

module.exports =router;