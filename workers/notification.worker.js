const { runNotificationChecks } = require("../services/notifications.service")

const NOTIFICATION_INTERVAL = 60 * 1000

function startNotificationWorker() {
    console.log("Notification worker started - checking every 60 seconds")
    
    setInterval(async () => {
        // console.log("Running notification checks...")
        await runNotificationChecks()
    }, NOTIFICATION_INTERVAL)

    try {
        runNotificationChecks()
    } catch(err){
        console.error("Notification worker error: ", err);
    }

}

module.exports = { startNotificationWorker }
