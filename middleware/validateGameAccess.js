const { getAvailableMinutes } = require("../services/unlock.service")

async function validateGameAccess(req, res, next) {
    try {
        if (process.env.NODE_ENV === "test") {
            return next();
        }

        console.log("VALIDATE GAME ACCESS:", req.params.id, req.user.id);
        const userId = req.user.id;
        const gameId = Number(req.params.id);

        if (!gameId || isNaN(gameId)) {
            return res.status(400).json({ message: "Invalid game id" })
        }

        const result = await getAvailableMinutes(userId);

        const availableMinutes = result.availableMinutes;

        if (availableMinutes <= 0) {
            return res.status(403).json({
                error: "No gaming time available. Complete tasks first"
            })
        }
        next();
    } catch (err) {
        console.error("Unlock gaming middleware error: ", err);

        res.status(403).json({
            message: "Internal server error"
        })
    }
}

module.exports = {
    validateGameAccess
}