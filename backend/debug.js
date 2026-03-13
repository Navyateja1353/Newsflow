const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Explicit dot env setup mimicking server
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

async function testDownload() {
    const url = 'https://api.twilio.com/2010-04-01/Accounts/ACf722b3a4b357f3c3015ea44b974bf8ce/Messages/MM10ca0a57096da3f4c26cdf93e909aa79/Media/MEb6716230d46d7d1f72a1fd7119a90b21';
    console.log("Starting test download...");

    try {
        const config = { url, method: 'GET', responseType: 'stream' };

        let sid = process.env.TWILIO_ACCOUNT_SID;
        let token = process.env.TWILIO_AUTH_TOKEN;
        console.log(`Initial SID from process.env: ${sid}`);

        if (!sid || sid === 'YOUR_TWILIO_ACCOUNT_SID') {
            try {
                const envPath = path.join(__dirname, '../.env');
                const envFile = fs.readFileSync(envPath, 'utf8');
                const sidMatch = envFile.match(/TWILIO_ACCOUNT_SID=(.+)/);
                const tokenMatch = envFile.match(/TWILIO_AUTH_TOKEN=(.+)/);
                if (sidMatch) sid = sidMatch[1].trim();
                if (tokenMatch) token = tokenMatch[1].trim();
                console.log(`Parsed SID from .env: ${sid}`);
            } catch (e) {
                console.error('Failed manual .env parse', e.message);
            }
        }

        if (!sid || !token || sid === 'YOUR_TWILIO_ACCOUNT_SID' || token === 'YOUR_TWILIO_AUTH_TOKEN') {
            console.error('❌ Twilio credentials missing! Cannot download image.');
            return;
        }

        const auth = Buffer.from(`${sid}:${token}`).toString('base64');
        config.headers = { 'Authorization': `Basic ${auth}` };

        console.log("Sending AXIOS request...");
        const response = await axios(config);
        console.log("AXIOS response received. Status: ", response.status);

        const filename = `test_image_${Date.now()}.jpg`;
        const filepath = path.join(uploadDir, filename);
        console.log(`Writing to: ${filepath}`);

        const writer = fs.createWriteStream(filepath);
        response.data.pipe(writer);

        writer.on('finish', () => console.log('✅ File written successfully!'));
        writer.on('error', (err) => console.error('❌ Writer Error:', err));
    } catch (err) {
        console.error("AXIOS error: ", err.message);
    }
}

testDownload();
