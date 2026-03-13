const axios = require('axios');
const qs = require('qs');

async function sendSplitTest() {
    const url = 'http://localhost:3000/api/whatsapp/webhook';
    console.log("Sending explicit IMAGE payload...");

    const imagePayload = qs.stringify({
        SmsMessageSid: 'SM111',
        NumMedia: '1',
        MessageType: 'image',
        From: 'whatsapp:+1234567890',
        Body: '', // Twilio genuinely sends empty body
        MediaUrl0: 'https://api.twilio.com/2010-04-01/Accounts/ACf722b3a4b357f3c3015ea44b974bf8ce/Messages/MM10ca0a57096da3f4c26cdf93e909aa79/Media/MEb6716230d46d7d1f72a1fd7119a90b21',
        MediaContentType0: 'image/jpeg'
    });

    try {
        const res1 = await axios.post(url, imagePayload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("Image Success");

        console.log("Waiting 2 seconds (simulating user typing caption)...");
        await new Promise(r => setTimeout(r, 2000));

        console.log("Sending explicit TEXT payload...");
        const textPayload = qs.stringify({
            SmsMessageSid: 'SM222',
            NumMedia: '0',
            MessageType: 'text',
            From: 'whatsapp:+1234567890',
            Body: 'PERFECT Fallback Test Caption Appended Successfully!'
        });

        const res2 = await axios.post(url, textPayload, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        console.log("Text Success. Check Database!");

    } catch (err) {
        console.error("Failed:", err.message);
    }
}

sendSplitTest();
