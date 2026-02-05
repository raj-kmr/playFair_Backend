const pool = require("../config/db")
const bcrypt = require("bcrypt")

exports.signup = async (req, res) => {
    const {username, email, password} = req.body;

    const userExists = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
    );

    if(userExists.rows.length > 0){
        return res.status(400).json({message: "User Already Exists!"})
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await pool.query(
        "INSERT INTO users (username, email, password) VALUES ($1, $2, $3)",
        [username, email, hashedPassword]
    )

    res.json({message: "Signup Successful"})
}