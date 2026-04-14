const app = require('./app')
const { startNotificationWorker } = require('./workers/notification.worker')

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`)
    startNotificationWorker()
})