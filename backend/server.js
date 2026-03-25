const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const express = require("express");
const app = express();

require("./db");

const verifyToken = require("./middleware/authMiddleware");
const authRoutes = require("./routes/auth");
const newsRoutes = require("./routes/news");
const adminRoutes = require("./routes/admin");
const publicRoutes = require("./routes/public");
const whatsappRoutes = require("./routes/whatsapp");
const settingsRoutes = require("./routes/settings");
const cors = require('cors');
app.use(cors());
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.json({ limit: '50mb' })); // Revert to standard body parser
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use("/api", authRoutes);
app.use("/api/news", newsRoutes);
app.use("/api/admin", verifyToken, adminRoutes);
app.use("/api/public", publicRoutes);
app.use("/api/whatsapp", whatsappRoutes);
app.use("/api/settings", settingsRoutes);


// ✅ Protected Route
app.get("/api/protected", verifyToken, (req, res) => {
  res.json({
    message: "You accessed protected route!",
    user: req.user
  });
});

app.get("/", (req, res) => {
  res.send("NewsFlow Backend Running");
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});