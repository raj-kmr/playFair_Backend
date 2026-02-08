const pool = require("../config/db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")

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

exports.signin = async(req, res) => {
    const {email, password} = req.body;

    const result = await pool.query(
        "SELECT id, password FROM users WHERE email = $1",
        [email]
    );

    if(result.rows.length === 0){
        return res.status(400).json({message: "No account with this email!"})
    }

    const user = result.rows[0];
    console.log(user)
    const isMatch = await bcrypt.compare(password, user.password);

    if(!isMatch){
        return res.status(400).json({message: "Invalid credentials"})
    }

    const token = jwt.sign(
        {userId: user.id}, process.env.JWT_SECRET
    )

    res.json({message: "Login successful", userId: user.id, "token": token})
}