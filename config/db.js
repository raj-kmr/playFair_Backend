const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
})

pool.connect((err, release) => {
    if(err) {
        return console.error("Error connecting to the database: " + err.stack)
    }
    console.log("Connected to postgreSql database")
    release();
})

module.exports = pool