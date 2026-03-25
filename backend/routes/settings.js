const express = require("express");
const router = express.Router();
const db = require("../db");
const verifyToken = require("../middleware/authMiddleware");
const fs = require("fs");
const path = require("path");

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// ✅ GET global settings (e.g., logo)
router.get("/:key", (req, res) => {
  const { key } = req.params;
  db.query("SELECT setting_value FROM site_settings WHERE setting_key = ?", [key], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      res.json({ value: results[0].setting_value });
    } else {
      res.json({ value: null });
    }
  });
});

// ✅ SET global settings (Admin only)
router.post("/:key", verifyToken, (req, res) => {
  if (req.user.role !== "admin") return res.status(403).json({ message: "Admin only" });
  
  const { key } = req.params;
  const { value } = req.body; // Base64 or plain string
  
  if (!value) return res.status(400).json({ message: "Value is required" });

  let finalValue = value;

  // Process image if base64 provided
  if (value.startsWith('data:image')) {
    try {
      const parts = value.split(',');
      const match = parts[0].match(/^data:([A-Za-z-+\/]+);base64$/);
      if (match) {
        let extension = match[1].split('/')[1] || 'png';
        if (extension === 'jpeg') extension = 'jpg';
        const base64Data = parts[1].replace(/\s/g, ''); 
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `logo_${Date.now()}.${extension}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        finalValue = `/uploads/${filename}`;
      }
    } catch (e) {
      console.error("Error saving base64 image:", e);
      return res.status(500).json({ message: "Failed to process image" });
    }
  }

  // Insert or Update the setting
  const query = "INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = ?";
  db.query(query, [key, finalValue, finalValue], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "Setting updated successfully", url: finalValue });
  });
});

module.exports = router;
