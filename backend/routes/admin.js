const express = require('express');
const router = express.Router();
const db = require('../db');
const { generateHeadline, determineCategory, extractKeywords } = require('../utils/nlp');
const verifyToken = require('../middleware/authMiddleware');

// Helper function to check admin role
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin only" });
    }
    next();
};

// Get all submissions
router.get('/submissions', verifyToken, isAdmin, (req, res) => {
    const query = `
        SELECT ns.*, 
               GROUP_CONCAT(i.image_url) as image_urls,
               MAX(i.id) as has_images
        FROM news_submissions ns
        LEFT JOIN images i ON ns.id = i.submission_id
        WHERE ns.status != 'archived'
        GROUP BY ns.id
        ORDER BY ns.created_at DESC
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('❌ Error fetching submissions:', err.message);
            res.status(500).json({ error: err.message });
        } else {
            const submissions = results.map(row => ({
                ...row,
                image_urls: row.image_urls ? row.image_urls.split(',') : [],
                has_image: row.has_images ? true : false,
                message_length: row.message ? row.message.length : 0
            }));
            res.json(submissions);
        }
    });
});

// Get a single submission by ID
router.get('/submissions/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT ns.*, 
               GROUP_CONCAT(i.image_url) as image_urls,
               MAX(i.id) as has_images
        FROM news_submissions ns
        LEFT JOIN images i ON ns.id = i.submission_id
        WHERE ns.id = ? AND ns.status != 'archived'
        GROUP BY ns.id
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching submission:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Submission not found' });
        }

        const submission = results[0];
        submission.image_urls = submission.image_urls ? submission.image_urls.split(',') : [];
        submission.has_image = submission.has_images ? true : false;

        res.json(submission);
    });
});

// Publish submission
router.post('/publish/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;
    console.log(`📰 Attempting to publish submission #${id} by Admin ${req.user.id}`);

    // First, check if submission exists
    const checkSql = 'SELECT * FROM news_submissions WHERE id = ?';
    db.query(checkSql, [id], (checkErr, checkResults) => {
        if (checkErr || !checkResults || checkResults.length === 0) {
            console.error('❌ Submission not found:', id);
            return res.status(404).json({ error: 'Submission not found' });
        }

        const submission = checkResults[0];
        const message = submission.message || '';

        // Get image if exists
        const imageSql = 'SELECT * FROM images WHERE submission_id = ? ORDER BY created_at DESC LIMIT 1';
        db.query(imageSql, [id], (imgErr, imgResults) => {
            if (imgErr) {
                console.error('❌ Error fetching image for publish:', imgErr);
            }

            const imageUrl = (imgResults && imgResults.length > 0) ? imgResults[0].image_url : null;

            // Generate headline and category using our NLP utility
            const headline = generateHeadline(message);
            const category = determineCategory(message);
            const keywords = extractKeywords(message);

            // Publish article - store FULL content without truncation
            const publishSql = `
                INSERT INTO published_articles 
                (submission_id, headline, content, category, image_url, status) 
                VALUES (?, ?, ?, ?, ?, 'active')
            `;

            db.query(publishSql, [id, headline, message, category, imageUrl], (pubErr, pubResult) => {
                if (pubErr) {
                    console.log('❌ Publish error:', pubErr.message);
                    return res.status(500).json({ error: pubErr.message });
                }

                // Update submission status
                db.query('UPDATE news_submissions SET status = "published" WHERE id = ?', [id], (updateErr) => {
                    if (updateErr) console.log('⚠️ Status update skipped:', updateErr.message);
                });

                // Log action
                db.query(
                    'INSERT INTO admin_actions (action_type, submission_id, article_id, details) VALUES (?, ?, ?, ?)',
                    ['publish', id, pubResult.insertId, JSON.stringify({ headline, category, keywords, content_length: message.length })],
                    (logErr) => {
                        if (logErr) console.log('⚠️ Action log skipped:', logErr.message);
                    }
                );

                res.json({
                    success: true,
                    message: `Published #${id}`,
                    data: {
                        headline,
                        category,
                        keywords,
                        has_image: !!imageUrl,
                        article_id: pubResult.insertId,
                        content_length: message.length
                    }
                });
            });
        });
    });
});

// Manually publish submission with edits
router.post('/publish-manual/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;
    const { headline, content, category, image_url } = req.body;

    console.log(`📰 Attempting to manually publish submission #${id} by Admin ${req.user.id}`);

    // Check if submission exists
    const checkSql = 'SELECT * FROM news_submissions WHERE id = ?';
    db.query(checkSql, [id], (checkErr, checkResults) => {
        if (checkErr || !checkResults || checkResults.length === 0) {
            console.error('❌ Submission not found:', id);
            return res.status(404).json({ error: 'Submission not found' });
        }

        // Publish article with manual edits
        const publishSql = `
            INSERT INTO published_articles 
            (submission_id, headline, content, category, image_url, status) 
            VALUES (?, ?, ?, ?, ?, 'active')
        `;

        db.query(publishSql, [id, headline, content, category, image_url], (pubErr, pubResult) => {
            if (pubErr) {
                console.log('❌ Manual publish error:', pubErr.message);
                return res.status(500).json({ error: pubErr.message });
            }

            // Update submission status
            db.query('UPDATE news_submissions SET status = "published" WHERE id = ?', [id], (updateErr) => {
                if (updateErr) console.log('⚠️ Status update skipped:', updateErr.message);
            });

            // Log action
            db.query(
                'INSERT INTO admin_actions (action_type, submission_id, article_id, details) VALUES (?, ?, ?, ?)',
                ['publish', id, pubResult.insertId, JSON.stringify({ headline, category, is_manual_edit: true, content_length: content.length })],
                (logErr) => {
                    if (logErr) console.log('⚠️ Action log skipped:', logErr.message);
                }
            );

            res.json({
                success: true,
                message: `Manually Published #${id}`,
                data: {
                    headline,
                    category,
                    has_image: !!image_url,
                    article_id: pubResult.insertId,
                    content_length: content.length
                }
            });
        });
    });
});

// Delete submission
router.post('/delete/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;
    db.query('DELETE FROM news_submissions WHERE id = ?', [id], (err) => {
        if (err) res.status(500).json({ error: err.message });
        else {
            db.query(
                'INSERT INTO admin_actions (action_type, submission_id) VALUES (?, ?)',
                ['delete', id],
                (logErr) => {
                    if (logErr) console.log('⚠️ Action log skipped');
                }
            );
            res.json({ success: true, message: `Deleted #${id}` });
        }
    });
});

// Archive/Remove article from newspaper
router.post('/archive-article/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;

    db.query('UPDATE published_articles SET status = "archived" WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Article not found' });
        } else {
            db.query(
                'INSERT INTO admin_actions (action_type, article_id) VALUES (?, ?)',
                ['archive_article', id],
                (logErr) => {
                    if (logErr) console.log('⚠️ Action log skipped');
                }
            );
            res.json({ success: true, message: `Article #${id} archived/removed from newspaper` });
        }
    });
});

// Restore article to newspaper
router.post('/restore-article/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;

    db.query('UPDATE published_articles SET status = "active" WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Article not found' });
        } else {
            res.json({ success: true, message: `Article #${id} restored to newspaper` });
        }
    });
});

// ============================================
// PUBLISHED ARTICLES MANAGEMENT
// ============================================

// Get all published articles for Admin Dashboard
router.get('/published', isAdmin, (req, res) => {
    const query = `
        SELECT pa.*, ns.phone as reporter_phone 
        FROM published_articles pa
        LEFT JOIN news_submissions ns ON pa.submission_id = ns.id
        WHERE pa.status = 'active'
        ORDER BY pa.published_date DESC
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

// Get a single published article for editing
router.get('/published/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    const query = `
        SELECT pa.*, ns.phone as reporter_phone, ns.message as original_message 
        FROM published_articles pa
        LEFT JOIN news_submissions ns ON pa.submission_id = ns.id
        WHERE pa.id = ?
    `;

    db.query(query, [id], (err, results) => {
        if (err) {
            console.error('❌ Error fetching published article:', err.message);
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }
        res.json(results[0]);
    });
});

// Update a LIVE published article in place
router.put('/published/:id', isAdmin, (req, res) => {
    const id = req.params.id;
    const { headline, content, category, image_url } = req.body;

    console.log(`📰 Editing Live Article #${id} by Admin ${req.user.id}`);

    const updateSql = `
        UPDATE published_articles 
        SET headline = ?, content = ?, category = ?, image_url = ?
        WHERE id = ?
    `;

    db.query(updateSql, [headline, content, category, image_url, id], (err, result) => {
        if (err) {
            console.error('❌ Edit live article error:', err.message);
            return res.status(500).json({ error: err.message });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Article not found' });
        }

        // Log action
        db.query(
            'INSERT INTO admin_actions (action_type, article_id, details) VALUES (?, ?, ?)',
            ['edit_published', id, JSON.stringify({ headline, category, is_live_edit: true })],
            (logErr) => {
                if (logErr) console.log('⚠️ Action log skipped:', logErr.message);
            }
        );

        res.json({ success: true, message: `Updated LIVE Article #${id}` });
    });
});

// Hard delete a published article entirely
router.delete('/published/:id', isAdmin, (req, res) => {
    const id = req.params.id;

    // First get the submission_id to optionally clean it up too, but for safety we only delete the published_article row
    db.query('DELETE FROM published_articles WHERE id = ?', [id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Article not found' });
        } else {
            db.query(
                'INSERT INTO admin_actions (action_type, article_id) VALUES (?, ?)',
                ['hard_delete_article', id],
                (logErr) => {
                    if (logErr) console.log('⚠️ Action log skipped');
                }
            );
            res.json({ success: true, message: `Permanently deleted article #${id}` });
        }
    });
});

// Revert text submission
router.post('/revert/text/:id', verifyToken, isAdmin, (req, res) => {
    const id = req.params.id;

    const sql = `
        UPDATE news_submissions ns
        LEFT JOIN published_articles pa ON ns.id = pa.submission_id
        SET ns.status = 'pending', pa.status = 'archived'
        WHERE ns.id = ? AND pa.submission_id = ?
    `;

    db.query(sql, [id, id], (err, result) => {
        if (err) {
            res.status(500).json({ error: err.message });
        } else if (result.affectedRows === 0) {
            res.status(404).json({ error: 'Submission not found or not published' });
        } else {
            db.query(
                'INSERT INTO admin_actions (action_type, submission_id) VALUES (?, ?)',
                ['revert_text', id],
                (logErr) => {
                    if (logErr) console.log('⚠️ Action log skipped');
                }
            );
            res.json({ success: true, message: `Reverted text #${id}` });
        }
    });
});

module.exports = router;
