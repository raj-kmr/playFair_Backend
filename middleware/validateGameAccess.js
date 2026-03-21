const {getAvailableMinutes} = require("../services/unlock.service")

async function validateGameAccess(req, res, next) {
    try {
        const userId = req.user.id;

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