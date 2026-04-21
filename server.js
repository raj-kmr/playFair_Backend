const app = require('./app')
const { startNotificationWorker } = require('./workers/notification.worker')

const PORT = process.env.PORT || 3000
const HOST = '192.168.1.5' // Listen on all network interfaces (allows phone connections)

app.listen(PORT, HOST, () => {
    console.log(`Server running on ${HOST}:${PORT}`)
    console.log(`Local access: http://localhost:${PORT}`)
    console.log(`Network access: http://192.168.1.5:${PORT}`)
    startNotificationWorker()
})