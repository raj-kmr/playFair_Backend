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
        const timeRange = req.query.range || '7d';

        const total = await getTotalPlaytime(userId, timeRange);
        const weekly = await getWeeklyPlaytime(userId, timeRange);
        const monthly = await getMonthlyPlaytime(userId, timeRange);

        res.json({
            total_minute: total.total_minutes,
            previous_total_minute: total.previous_total_minutes,
            weekly,
            monthly
        })
    } catch (err) {
        console.error("Playtime Analytics Error: ", err)
        res.status(500).json({
            message: "Internal server error"
        })
    }
}

async function getSessionAnalytics(req, res) {
    try{
        const userId = req.user.id;
        const timeRange = req.query.range || '7d';

        const stats = await getSessionStats(userId, timeRange);

        res.json(stats)
    } catch(err){
        console.error("Session Analytics Error: ", err);
        res.status(500).json({
            message: "Internal server error"
        })
    }
}


async function getTaskAnalytics(req, res){
    try{
        const userId = req.user.id;
        const timeRange = req.query.range || '7d';

        const data = await getTaskCompletionRate(userId, timeRange);

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