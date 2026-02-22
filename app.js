require("dotenv").config({path: ".env"})
const express = require("express")
const app = express()
const cors = require("cors")
const port = process.env.PORT;

//middleware
app.use(cors())
app.use(express.json())

app.use("/igdb", require("./routes/igdb.router"));


app.get("/test", (req, res) => {
    res.json({message: "Backend is connected succssfully"})
})

const authRoutes = require("./routes/auth.router")
app.use("/auth", authRoutes)

const gameRoutes = require("./routes/game.router")
app.use("/games", gameRoutes)


app.listen(port, () => {
    console.log(`App is listening on port: ${port}`)
})