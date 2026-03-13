const express = require("express");
const router = express.Router();
const db = require("../db");
const bcrypt = require("bcryptjs");

// REGISTER USER
router.post("/register", async (req, res) => {
  console.log("Incoming Registration payload:", req.body);
  const { name, email, password, role, layout_preferences } = req.body;

  try {
    // Check if user already exists
    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error("Database error during registration check:", err);
        return res.status(500).json({ message: "Database error occurred" });
      }
      if (result.length > 0) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Encrypt password
      const hashedPassword = await bcrypt.hash(password, 10);

      const prefsStr = layout_preferences ? JSON.stringify(layout_preferences) : null;

      // Insert user
      db.query(
        "INSERT INTO users (name, email, password, role, layout_preferences) VALUES (?, ?, ?, ?, ?)",
        [name, email, hashedPassword, role, prefsStr],
        (err, result) => {
          if (err) {
            console.error("SQL Insert Error during registration:", err);
            return res.status(500).json({ error: err.message || err });
          }

          res.status(201).json({ message: "User registered successfully" });
        }
      );
    });
  } catch (error) {
    console.error("Catastrophic Catch Error in /register:", error);
    res.status(500).json({ error: error.message || error });
  }
});
const jwt = require("jsonwebtoken");

// LOGIN USER
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    db.query("SELECT * FROM users WHERE email = ?", [email], async (err, result) => {
      if (err) {
        console.error("Database error during login:", err);
        return res.status(500).json({ error: err.message || err });
      }

      if (result.length === 0) {
        console.warn("Login failed: User not found for email:", email);
        return res.status(400).json({ message: "User not found" });
      }

      const user = result[0];

      try {
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
          console.warn("Login failed: Invalid password for email:", email);
          return res.status(400).json({ message: "Invalid password" });
        }
        const secret = process.env.JWT_SECRET || "fallback_super_secret_key_123";
        console.log("JWT Secret resolved. Token generated.");

        const token = jwt.sign(
          { id: user.id, role: user.role },
          secret,
          { expiresIn: "1d" }
        );

        res.json({
          message: "Login successful",
          token: token,
          role: user.role,
          layout_preferences: user.layout_preferences
        });
      } catch (bcryptError) {
        console.error("Bcrypt comparison error:", bcryptError);
        return res.status(500).json({ error: "Password verification failed" });
      }
    });
  } catch (err) {
    console.error("Catastrophic error in /login:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;