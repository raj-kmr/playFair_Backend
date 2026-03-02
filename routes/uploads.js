const express = require("express")
const router = express.Router();
const multer = require("multer")
const path = require("path")


// multer handles multipart/form-data file uploads
// Store files on Disk (MVP), later will replace with S3
const storage = multer.diskStorage({
    destination: (_req, _file, cb) => ( cb(null, "uploads/")),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "");
        const safeExt = ext || ".jpg";
        cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`)
    }
})

// Validate mimetype to allow images only
const fileFilter = (_req, file, cb) => {
    if(file.mimetype?.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image uploads are allowed"))
}

const upload = multer({storage, fileFilter});

router.post("/images", upload.single("image"), (req, res) => {
    // Multer attaches file metadata on req.file
    if(!req.file) return res.status(400).json({message: "No file uploaded"});

    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/${req.file.filename}`
    res.json({imageUrl})
})

export default router;