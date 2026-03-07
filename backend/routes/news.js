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

// ✅ Helper to process base64 image
const processBase64Image = (base64Str) => {
  if (!base64Str) return null;
  try {
    console.log("Processing image upload:", base64Str.substring(0, 40) + "...");
    const parts = base64Str.split(',');
    if (parts.length === 2 && parts[0].startsWith('data:')) {
      const match = parts[0].match(/^data:([A-Za-z-+\/]+);base64$/);
      if (match) {
        let extension = match[1].split('/')[1] || 'jpg';
        if (extension === 'jpeg') extension = 'jpg';
        const base64Data = parts[1].replace(/\s/g, ''); // Fixes newline base64 breaks
        const buffer = Buffer.from(base64Data, 'base64');
        const filename = `news_${Date.now()}_${Math.floor(Math.random() * 1000)}.${extension}`;
        const filepath = path.join(uploadDir, filename);
        fs.writeFileSync(filepath, buffer);
        console.log("Saved image:", filename);
        return `/uploads/${filename}`;
      } else {
        console.warn("Image metadata didn't match typical format:", parts[0]);
      }
    }
  } catch (e) {
    console.error("Error saving base64 image:", e);
  }
  return null;
};

// ✅ CREATE NEWS (Logged users only)
router.post("/", verifyToken, (req, res) => {
  const { title, content, image_data } = req.body;
  const image_url = processBase64Image(image_data);

  const query = "INSERT INTO news (title, content, author_id, image_url) VALUES (?, ?, ?, ?)";

  db.query(query, [title, content, req.user.id, image_url], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.status(201).json({ message: "News created successfully" });
  });
});


// ✅ GET ALL NEWS (Public)
router.get("/", (req, res) => {
  db.query("SELECT * FROM news", (err, results) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.json(results);
  });
});


// ✅ DELETE NEWS (Admin only)
router.delete("/:id", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }

  const newsId = req.params.id;

  db.query("DELETE FROM news WHERE id = ?", [newsId], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err });
    }

    res.json({ message: "News deleted successfully" });
  });
});

// UPDATE NEWS
router.put("/:id", verifyToken, (req, res) => {
  const newsId = req.params.id;
  const { title, content, image_data } = req.body;

  // Step 1: Get the news from DB
  db.query("SELECT * FROM news WHERE id = ?", [newsId], (err, results) => {
    if (err) return res.status(500).json({ error: err });

    if (results.length === 0)
      return res.status(404).json({ message: "News not found" });

    const news = results[0];

    // Step 2: Check authorization: Only author or admin
    if (req.user.id !== news.author_id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    // Process new image if provided, otherwise keep old
    let image_url = news.image_url;
    if (image_data && image_data.startsWith('data:image')) {
      const new_img = processBase64Image(image_data);
      if (new_img) image_url = new_img;
    }

    // Step 3: Update news
    db.query(
      "UPDATE news SET title = ?, content = ?, image_url = ? WHERE id = ?",
      [title, content, image_url, newsId],
      (err, result) => {
        if (err) return res.status(500).json({ error: err });

        res.json({ message: "News updated successfully" });
      }
    );
  });
});

module.exports = router;