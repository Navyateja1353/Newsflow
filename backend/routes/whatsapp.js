const express = require('express');
const router = express.Router();
const db = require('../db');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Store temporary data for image submissions
const pendingImageSubmissions = new Map();

// Please store Twilio Account SID and Auth Token in .env
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;

// Function to download image
async function downloadImage(url) {
    try {
        const config = {
            url,
            method: 'GET',
            responseType: 'stream'
        };

        // Add Basic Auth if it's a Twilio URL
        if (url.includes('twilio.com') || url.includes('Twilio')) {
            let sid = process.env.TWILIO_ACCOUNT_SID;
            let token = process.env.TWILIO_AUTH_TOKEN;

            // If process.env fails, manually read from the file as a fallback
            if (!sid || sid === 'YOUR_TWILIO_ACCOUNT_SID') {
                try {
                    const envPath = require('path').join(__dirname, '../../.env');
                    const envFile = require('fs').readFileSync(envPath, 'utf8');
                    const sidMatch = envFile.match(/TWILIO_ACCOUNT_SID=(.+)/);
                    const tokenMatch = envFile.match(/TWILIO_AUTH_TOKEN=(.+)/);
                    if (sidMatch) sid = sidMatch[1].trim();
                    if (tokenMatch) token = tokenMatch[1].trim();
                } catch (e) {
                    console.error('Failed manual .env parse', e.message);
                }
            }

            if (!sid || !token || sid === 'YOUR_TWILIO_ACCOUNT_SID' || token === 'YOUR_TWILIO_AUTH_TOKEN') {
                console.error('❌ Twilio credentials missing! Cannot download image.');
                return null;
            }
            const auth = Buffer.from(`${sid}:${token}`).toString('base64');
            config.headers = {
                'Authorization': `Basic ${auth}`
            };
        }

        const response = await axios(config);

        const extension = url.includes('.png') ? '.png' : '.jpg';
        const filename = `image_${Date.now()}_${Math.floor(Math.random() * 1000)}${extension}`;
        const filepath = path.join(uploadDir, filename);

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(`/uploads/${filename}`));
            writer.on('error', reject);
        });
    } catch (error) {
        console.error('❌ Error downloading image:', error.message);
        return null;
    }
}

// Process image submission
function processImageSubmission(phone, message, mediaUrl) {
    console.log(`📸 Processing image from ${phone}`);

    if (pendingImageSubmissions.has(phone)) {
        const pendingImage = pendingImageSubmissions.get(phone);
        const caption = message.trim() || "చిత్రం వివరణ లేదు";

        console.log(`📝 User ${phone} is sending caption: "${caption.substring(0, 100)}..."`);

        const sql = "INSERT INTO news_submissions (phone, message, has_image) VALUES (?, ?, ?)";
        db.query(sql, [phone, caption, 1], (err, result) => {
            if (err) {
                console.log('❌ Database save error:', err.message);
            } else {
                const submissionId = result.insertId;
                console.log(`✅ Submission saved. ID: ${submissionId}`);

                const imageSql = "INSERT INTO images (submission_id, image_url) VALUES (?, ?)";
                db.query(imageSql, [submissionId, pendingImage.imageUrl], (err, imgResult) => {
                    if (err) {
                        console.log('❌ Image save error:', err.message);
                    } else {
                        console.log(`✅ Image URL saved immediately: ${pendingImage.imageUrl}`);

                        // Background download and update
                        downloadImage(pendingImage.imageUrl).then(localPath => {
                            if (localPath) {
                                db.query("UPDATE images SET image_url = ? WHERE id = ?", [localPath, imgResult.insertId], (upErr) => {
                                    if (upErr) console.log('❌ Failed to update image path:', upErr.message);
                                    else console.log(`✅ Updated image to local path: ${localPath}`);
                                });
                            }
                        });
                    }
                });
            }
        });

        pendingImageSubmissions.delete(phone);
        return `✅ ధన్యవాదాలు! మీ చిత్రం మరియు వివరణ సేవ్ చేయబడ్డాయి. నిర్వాహకులు సమీక్షిస్తారు.`;

    }
    else {
        if (message.trim() === '') {
            console.log(`📸 Standalone Image received without caption.`);

            const sql = "INSERT INTO news_submissions (phone, message, has_image) VALUES (?, ?, ?)";
            db.query(sql, [phone, "", 1], (err, result) => {
                if (err) {
                    console.log('❌ Database save error:', err.message);
                } else {
                    const submissionId = result.insertId;

                    // Cache the submission ID so the next text message links to it
                    pendingImageSubmissions.set(phone, {
                        submissionId: submissionId,
                        timestamp: Date.now()
                    });

                    const imageSql = "INSERT INTO images (submission_id, image_url) VALUES (?, ?)";
                    db.query(imageSql, [submissionId, mediaUrl], (err, imgResult) => {
                        if (err) {
                            console.log('❌ Image save error:', err.message);
                        } else {
                            // Background download and update
                            downloadImage(mediaUrl).then(localPath => {
                                if (localPath) {
                                    db.query("UPDATE images SET image_url = ? WHERE id = ?", [localPath, imgResult.insertId], (upErr) => {
                                        if (upErr) console.log('❌ Failed to update image path:', upErr.message);
                                        else console.log(`✅ Updated image to local path: ${localPath}`);
                                    });
                                }
                            });
                        }
                    });
                }
            });

            return `🖼️ చిత్రం స్వీకరించబడింది!\n\nదయచేసి ఈ చిత్రానికి వివరణ/వార్తను టైప్ చేయండి (గరిష్ఠంగా 5000 అక్షరాలు):\n\nఉదాహరణ:\n"హైదరాబాద్లో కొత్త మెట్రో నిర్మాణం. ఈ చిత్రం శివంపేటలో తీయబడింది."`;
        } else {
            console.log(`📸 Image with caption: "${message.substring(0, 100)}..."`);

            const sql = "INSERT INTO news_submissions (phone, message, has_image) VALUES (?, ?, ?)";
            db.query(sql, [phone, message, 1], (err, result) => {
                if (err) {
                    console.log('❌ Database save error:', err.message);
                } else {
                    const submissionId = result.insertId;

                    const imageSql = "INSERT INTO images (submission_id, image_url) VALUES (?, ?)";
                    db.query(imageSql, [submissionId, mediaUrl], (err, imgResult) => {
                        if (err) {
                            console.log('❌ Image save error:', err.message);
                        } else {
                            // Background download and update
                            downloadImage(mediaUrl).then(localPath => {
                                if (localPath) {
                                    db.query("UPDATE images SET image_url = ? WHERE id = ?", [localPath, imgResult.insertId], (upErr) => {
                                        if (upErr) console.log('❌ Failed to update image path:', upErr.message);
                                        else console.log(`✅ Updated image to local path: ${localPath}`);
                                    });
                                }
                            });
                        }
                    });
                }
            });

            return `✅ చిత్రం మరియు వివరణ స్వీకరించబడ్డాయి! మీ వార్త సేవ్ చేయబడింది.`;
        }
    }
}

// Process text message
function processTextMessage(phone, message) {
    const lowerMsg = message.toLowerCase().trim();
    const cleanMsg = message.trim();

    // Menu commands - check exact matches first
    if (cleanMsg === 'hi' || cleanMsg === 'Hi' || cleanMsg === 'HI' ||
        cleanMsg === 'hello' || cleanMsg === 'Hello' ||
        lowerMsg.includes('హాయ్') || lowerMsg.includes('హలో')) {
        pendingImageSubmissions.delete(phone);
        return `Welcome to the Newspaper! \n\nPlease select:\n1. Text News\n2. Image News\n3. View Today's Newspaper\n\nReply with 1, 2, or 3`;
    }
    else if (cleanMsg === '1') {
        pendingImageSubmissions.delete(phone);
        return `📝 టెక్స్ట్ వార్తలు\n\nదయచేసి మీ వార్తను టైప్ చేయండి (గరిష్ఠంగా 5000 అక్షరాలు):\n\nఉదాహరణ:\n"హైదరాబాద్లో భారీ వర్షాలు. రోడ్లు నీటితో నిమజ్జనం..."`;
    }
    else if (cleanMsg === '2') {
        pendingImageSubmissions.delete(phone);
        return `🖼️ ఇమేజ్ వార్తలు\n\nదయచేసి మీ వార్త చిత్రాన్ని పంపండి. చిత్రం పంపిన తర్వాత, దాని వివరణను టెక్స్ట్గా పంపండి.`;
    }
    else if (cleanMsg === '3') {
        return `📰 నేటి వార్తాపత్రిక:\nhttp://localhost:3000/newspaper\n\nలేదా వెబ్‌సైట్ చూడండి:\nhttp://localhost:3000`;
    }
    else {
        // Check database for a recently pending image from this user (nodemon-proof fallback)
        const checkSql = `
            SELECT id FROM news_submissions 
            WHERE phone = ? AND has_image = 1 AND message = '' 
            AND created_at > (NOW() - INTERVAL 15 MINUTE) 
            ORDER BY id DESC LIMIT 1
        `;

        db.query(checkSql, [phone], (err, results) => {
            if (err) {
                console.log('❌ Database check error:', err.message);
                fallbackTextSave();
                return;
            }

            if (results && results.length > 0) {
                const submissionId = results[0].id;
                // Append the text to the recently saved image
                const updateSql = "UPDATE news_submissions SET message = ? WHERE id = ?";
                db.query(updateSql, [message, submissionId], (upErr, upResult) => {
                    if (upErr) {
                        console.log('❌ Database update error:', upErr.message);
                        fallbackTextSave();
                    } else {
                        console.log(`✅ Appended text caption to existing image submission ID: ${submissionId}`);
                    }
                });
            } else {
                fallbackTextSave();
            }
        });

        function fallbackTextSave() {
            // Save text submission - now supports LONGTEXT
            const sql = "INSERT INTO news_submissions (phone, message) VALUES (?, ?)";
            db.query(sql, [phone, message], (err, result) => {
                if (err) {
                    console.log('❌ Database save error:', err.message);
                } else {
                    console.log(`✅ Text submission from ${phone} saved. ID: ${result.insertId}, Length: ${message.length} characters`);
                    console.log(`📝 Message preview: ${message.substring(0, 200)}...`);
                }
            });
        }

        pendingImageSubmissions.delete(phone);
        return `✅ ధన్యవాదాలు! మీ వార్త సేవ్ చేయబడింది. వార్త పొడవు: ${message.length} అక్షరాలు. నిర్వాహకులు సమీక్షిస్తారు.`;
    }
}

// Process WhatsApp messages
function processWhatsAppMessage(phone, message, isImage, mediaUrl) {
    let reply = "Send 'hi' to start";

    phone = phone.replace('whatsapp:', '').replace('+', '');

    // If it's an image AND has media URL, process as image
    if (isImage && mediaUrl) {
        return processImageSubmission(phone, message, mediaUrl);
    }
    // If there's message text, process as text (even if it's long)
    else if (message && message.trim() !== '') {
        return processTextMessage(phone, message);
    }
    // If it's marked as image but no media URL, treat as text
    else if (isImage && !mediaUrl) {
        return processTextMessage(phone, message || "చిత్రం");
    }

    return reply;
}

// WhatsApp webhook
router.get('/webhook', (req, res) => {
    res.send("Webhook GET endpoint is active!");
});

router.post('/webhook', (req, res) => {
    console.log('\n📨 ===== WHATSAPP WEBHOOK RECEIVED =====');
    console.dir(req.body, { depth: null, colors: true });

    let message = '';
    let phone = '';
    let mediaUrl = '';
    let isImage = false;
    let mediaContentType = '';

    // Handle Twilio format
    if (req.body.Body !== undefined || req.body.body !== undefined) {
        message = req.body.Body || req.body.body || '';
        phone = req.body.From || req.body.from || '';

        // Check if it's actually an image
        if (req.body.NumMedia && parseInt(req.body.NumMedia) > 0) {
            mediaContentType = req.body.MediaContentType0 || '';
            if (mediaContentType && mediaContentType.startsWith('image/')) {
                isImage = true;
                mediaUrl = req.body.MediaUrl0 || req.body.MediaUrl || '';
            }
        }

        // Also check for MediaContentType0 directly
        if (req.body.MediaContentType0 && req.body.MediaContentType0.startsWith('image/')) {
            isImage = true;
            mediaUrl = req.body.MediaUrl0 || req.body.MediaUrl || '';
        }
    }
    // Handle WhatsApp Business API format
    else if (req.body.entry && Array.isArray(req.body.entry)) {
        const entry = req.body.entry[0];
        if (entry.changes && Array.isArray(entry.changes)) {
            const change = entry.changes[0];
            if (change.value.messages && Array.isArray(change.value.messages)) {
                const msg = change.value.messages[0];
                phone = msg.from || '';

                if (msg.type === 'text') {
                    message = msg.text?.body || '';
                    isImage = false;
                } else if (msg.type === 'image') {
                    isImage = true;
                    mediaUrl = msg.image?.link || msg.image?.id || '';
                    message = msg.image?.caption || '';
                    mediaContentType = 'image/';
                }
            }
        }
    }
    // Try other formats
    else {
        message = req.body.message || req.body.text || req.body.Message || '';
        phone = req.body.phone || req.body.sender || req.body.Phone || '';

        if ((req.body.MediaUrl0 || req.body.media_url || req.body.image_url) &&
            !message && !req.body.Body && !req.body.body) {
            isImage = true;
            mediaUrl = req.body.MediaUrl0 || req.body.media_url || req.body.image_url || '';
        }
    }

    // Clean phone number
    phone = phone.replace('whatsapp:', '').replace('+', '');

    console.log(`📱 From: ${phone}`);
    console.log(`💬 Message length: ${message.length} characters`);
    console.log(`🖼️ Is Image: ${isImage}`);

    let reply = processWhatsAppMessage(phone, message, isImage, mediaUrl);

    const twilio = require('twilio');
    const twiml = new twilio.twiml.MessagingResponse();
    twiml.message(reply);

    res.set('Content-Type', 'text/xml');
    res.send(twiml.toString());
});

// Clean old pending submissions every 10 minutes
setInterval(() => {
    const now = Date.now();
    for (const [phone, data] of pendingImageSubmissions.entries()) {
        if (now - data.timestamp > 10 * 60 * 1000) {
            pendingImageSubmissions.delete(phone);
            console.log(`🧹 Cleared old pending submission for ${phone}`);
        }
    }
}, 10 * 60 * 1000);

module.exports = router;
