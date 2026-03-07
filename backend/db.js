const mysql = require("mysql2");

const db = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "root@123",
  database: "newsflow",
  charset: 'utf8mb4',
  supportBigNumbers: true,
  bigNumberStrings: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) {
    console.log("Database connection failed:", err);
  } else {
    console.log("MySQL Connected Successfully");

    // Set UTF-8 for Telugu
    connection.query("SET NAMES 'utf8mb4'");
    connection.query("SET character_set_results = 'utf8mb4'");
    connection.query("SET character_set_client = 'utf8mb4'");
    connection.query("SET character_set_connection = 'utf8mb4'");

    initializeDatabase();
    connection.release();
  }
});


function initializeDatabase() {
  const tables = [
    `CREATE TABLE IF NOT EXISTS news_submissions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          phone VARCHAR(20) NOT NULL,
          message LONGTEXT NOT NULL,
          has_image BOOLEAN DEFAULT FALSE,
          status ENUM('pending', 'published', 'reverted', 'archived') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_status (status),
          INDEX idx_phone (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS images (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT NOT NULL,
          image_url TEXT NOT NULL,
          caption TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_submission (submission_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS published_articles (
          id INT PRIMARY KEY AUTO_INCREMENT,
          submission_id INT,
          headline VARCHAR(500) NOT NULL,
          content LONGTEXT NOT NULL,
          category VARCHAR(100) DEFAULT 'సాధారణ',
          image_url TEXT,
          published_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status ENUM('active', 'archived') DEFAULT 'active',
          INDEX idx_category (category),
          INDEX idx_date (published_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS admin_actions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          admin_id VARCHAR(50) DEFAULT 'system',
          action_type ENUM('publish', 'delete', 'revert_text', 'revert_image', 'archive_article') NOT NULL,
          submission_id INT,
          article_id INT,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_action (action_type)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

    `CREATE TABLE IF NOT EXISTS newspaper_editions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          edition_date DATE NOT NULL UNIQUE,
          title VARCHAR(500) NOT NULL,
          status ENUM('draft', 'published', 'archived') DEFAULT 'draft',
          generated_at TIMESTAMP NULL,
          published_at TIMESTAMP NULL,
          prompt TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_edition_date (edition_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`
  ];

  tables.forEach((sql, index) => {
    db.query(sql, (err) => {
      if (err) console.log(`❌ Table ${index + 1} creation error:`, err.message);
      else console.log(`✅ Table ${index + 1} ready`);
    });
  });
}

module.exports = db;