const express = require('express');
const router = express.Router();
const db = require('../db');

// Get all published articles (including archived if needed, but primary is active)
router.get('/all-published', (req, res) => {
    const query = `
        SELECT * FROM (
            SELECT pa.id, pa.submission_id, pa.headline, pa.content, pa.category, pa.image_url, 
                   pa.published_date, pa.status, ns.phone as reporter_phone, 
                   ns.status as submission_status, LENGTH(pa.content) as content_length
            FROM published_articles pa
            LEFT JOIN news_submissions ns ON pa.submission_id = ns.id
            WHERE pa.status = 'active'
            
            UNION ALL
            
            SELECT (n.id + 1000000) as id, NULL as submission_id, n.title as headline, 
                   n.content, _utf8mb4'సాధారణ' COLLATE utf8mb4_unicode_ci as category, NULL as image_url, 
                   n.created_at as published_date, _utf8mb4'active' COLLATE utf8mb4_unicode_ci as status, 
                   _utf8mb4'Web Dashboard' COLLATE utf8mb4_unicode_ci as reporter_phone, 
                   _utf8mb4'published' COLLATE utf8mb4_unicode_ci as submission_status, 
                   LENGTH(n.content) as content_length
            FROM news n
        ) as combined_news
        ORDER BY published_date DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching published articles:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            res.json(results);
        }
    });
});

// ✅ GET Single Article by ID
router.get('/article/:id', (req, res) => {
    const articleId = parseInt(req.params.id, 10);
    
    const query = `
        SELECT * FROM (
            SELECT pa.id, pa.submission_id, pa.headline, pa.content, pa.category, pa.image_url, 
                   pa.published_date, pa.status, ns.phone as reporter_phone, 
                   ns.status as submission_status, LENGTH(pa.content) as content_length
            FROM published_articles pa
            LEFT JOIN news_submissions ns ON pa.submission_id = ns.id
            WHERE pa.status = 'active'
            
            UNION ALL
            
            SELECT (n.id + 1000000) as id, NULL as submission_id, n.title as headline, 
                   n.content, _utf8mb4'సాధారణ' COLLATE utf8mb4_unicode_ci as category, NULL as image_url, 
                   n.created_at as published_date, _utf8mb4'active' COLLATE utf8mb4_unicode_ci as status, 
                   _utf8mb4'Web Dashboard' COLLATE utf8mb4_unicode_ci as reporter_phone, 
                   _utf8mb4'published' COLLATE utf8mb4_unicode_ci as submission_status, 
                   LENGTH(n.content) as content_length
            FROM news n
        ) as combined_news
        WHERE id = ?
    `;

    db.query(query, [articleId], (err, results) => {
        if (err) {
            console.error('❌ Error fetching single article:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Article not found' });
        }
        res.json(results[0]);
    });
});

module.exports = router;
