require("dotenv").config({path: ".env"})
const express = require("express")
const app = express()
const pool = require("./config/db")
app.use(express.json())
const port = process.env.PORT;

app.use("/", (req, res) => {
    res.send("hello world")
})

app.listen(port, () => {
    console.log(`App is listening on port: ${port}`)
})