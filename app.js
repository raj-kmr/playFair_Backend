require("dotenv").config({path: ".env"})
const express = require("express")
const app = express()
const cors = require("cors")
const port = process.env.PORT;
const uploadRoutes = require("./routes/uploads")
const errorHandler = require("./middleware/errorHandler")

//middleware
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(errorHandler);

app.use((req, res, next) => {
    console.log("INCOMING: ", req.method, req.url)
    next();
})

app.use("/igdb", require("./routes/igdb.router"));
const sessionsRoutes = require("./routes/session.router")

app.use("/api", sessionsRoutes)

// Serve uploaded files publicaly, Replace with S3 later
app.use("/uploads", express.static("uploads")) // serve uploaded files
app.use("/uploads", uploadRoutes) // POST /uploads/images


app.get("/test", (req, res) => {
    res.json({message: "Backend is connected succssfully"})
})

const authRoutes = require("./routes/auth.router")
app.use("/auth", authRoutes)

const taskRoutes = require("./routes/task.router")
app.use("/api", taskRoutes);

const gameRoutes = require("./routes/game.router")
app.use("/games", gameRoutes)


app.listen(port, () => {
    console.log(`App is listening on port: ${port}`)
})