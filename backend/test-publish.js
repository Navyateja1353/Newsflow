const axios = require('axios');

async function verifyAndPublish() {
    try {
        // 1. Get submissions (from our new admin endpoint)
        // Note: this simulates an admin fetch, so we bypass the jwt for a quick local test
        // Let's directly hit the database to confirm it inserted
        const db = require('./db');

        db.query('SELECT * FROM news_submissions ORDER BY id DESC LIMIT 1', async (err, results) => {
            if (err) {
                console.error("DB Error:", err);
                process.exit(1);
            }

            console.log("📨 Latest Submission in DB:", results[0]);

            if (results.length > 0) {
                const subId = results[0].id;
                console.log(`\n🚀 Attempting to publish submission #${subId} using NLP...`);

                // Hit the publish endpoint
                try {
                    const pubRes = await axios.post(`http://localhost:3000/api/admin/publish/${subId}`);
                    console.log("\n✅ Publish Result:", pubRes.data);

                    // Confirm in published_articles table
                    db.query(`SELECT * FROM published_articles WHERE id = ${pubRes.data.data.article_id}`, (err2, paResults) => {
                        console.log("\n📰 Published Article in DB:", paResults[0]);
                        process.exit(0);
                    });

                } catch (pubErr) {
                    console.error("Publish Error:", pubErr.response ? pubErr.response.data : pubErr.message);
                    process.exit(1);
                }
            } else {
                console.log("No submissions found.");
                process.exit(0);
            }
        });

    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}

// Small workaround for the test since we added verifyToken to admin routes
// We will temporarily comment verifyToken in server.js for the test, or just test via DB
