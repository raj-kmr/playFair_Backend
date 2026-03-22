const {
    getTotalPlaytime,
    getWeeklyPlaytime,
    getMonthlyPlaytime,
    getSessionStats,
    getTaskCompletionRate
} = require("../services/analytics.service")


async function getPlaytimeAnalytics(req, res) {
    try {
        const userId = req.user.id;

        const total = await getTotalPlaytime(userId);
        const weekly = await getWeeklyPlaytime(userId);
        const monthly = await getMonthlyPlaytime(userId);

        res.json({
            total_minutes: total.total_minutes,
            weekly,
            monthly
        })
    } catch (err) {
        console.err("Playtime Analytics Error: ", err)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

async function getSessionAnalytics(req, res) {
    try{
        const userId = req.user.id;

        const stats = await getSessionStats(userId);

        res.json(stats)
    } catch(err){
        console.err("Session Analytics Error: ", err);
        res.status(500).json({
            message: "Internal server error"
        })
    }
}


async function getTaskAnalytics(req, res){
    try{
        const userId = req.user.id;

        const data = await getTaskCompletionRate(userId);

        res.json(data);
    } catch(err){
        console.error("Task analytics error: ", err);
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

module.exports = {
    getPlaytimeAnalytics,
    getSessionAnalytics,
    getTaskAnalytics
}