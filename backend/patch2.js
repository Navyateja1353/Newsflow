const fs = require('fs');
const filepath = 'c:/Users/HP/OneDrive/Desktop/newsflow/backend/routes/whatsapp.js';
let code = fs.readFileSync(filepath, 'utf8');

const targetSection = code.substring(code.indexOf('if (NumMedia > 0) {'), code.indexOf('return; // Important: Don\'t process as text') + 43);

const replacement = `if (NumMedia > 0) {
        console.log(\`📸 Image received from \${senderPhone}\`);
        
        const mediaUrl = req.body.MediaUrl0;
        const localImagePath = await downloadImage(mediaUrl);

        if (!localImagePath) {
            twiml.message('❌ చిత్రాన్ని డౌన్‌లోడ్ చేయడంలో సమస్య ఏర్పడింది. దయచేసి మళ్ళీ పంపండి.');
            return res.type('text/xml').send(twiml.toString());
        }

        db.query('SELECT * FROM news_submissions WHERE phone = ? AND status = ? ORDER BY id DESC LIMIT 1', [senderPhone, 'pending'], async (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).send('Database Error');
            }

            let submissionId;
            let finalMessage = '✅ చిత్రం స్వీకరించబడింది! దయచేసి ఈ వార్త యొక్క వివరణ (Caption) పంపండి.';

            if (results.length > 0) {
                submissionId = results[0].id;
                db.query('UPDATE news_submissions SET has_image = TRUE WHERE id = ?', [submissionId]);
                
                if (results[0].message && results[0].message.trim() !== "") {
                    finalMessage = '✅ చిత్రం మరియు వివరణ స్వీకరించబడ్డాయి! మీ వార్త సేవ్ చేయబడింది.';
                }

                const insertImgSql = \`INSERT INTO images (submission_id, image_url, caption) VALUES (?, ?, ?)\`;
                db.query(insertImgSql, [submissionId, localImagePath, incomingMessage], () => {
                    twiml.message(finalMessage);
                    return res.type('text/xml').send(twiml.toString());
                });
            } else {
                const insertNewsSql = \`INSERT INTO news_submissions (phone, message, has_image, status) VALUES (?, ?, TRUE, 'pending')\`;
                db.query(insertNewsSql, [senderPhone, incomingMessage], (err, result) => {
                    if (err) {
                        console.error('Error inserting standalone image:', err);
                        return;
                    }
                    submissionId = result.insertId;
                    
                    const insertImgSql = \`INSERT INTO images (submission_id, image_url, caption) VALUES (?, ?, ?)\`;
                    db.query(insertImgSql, [submissionId, localImagePath, incomingMessage], () => {
                        twiml.message(finalMessage);
                        return res.type('text/xml').send(twiml.toString());
                    });
                });
            }
        });
        return; // Important: Don't process as text`;

code = code.replace(targetSection, replacement);
fs.writeFileSync(filepath, code);
console.log('✅ Updated whatsapp.js routing logic successfully.');
