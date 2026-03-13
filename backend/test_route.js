const axios = require('axios');
const qs = require('qs'); // To properly encode form data

async function testWebhook() {
    const url = 'http://localhost:3000/api/whatsapp/webhook';
    console.log("Sending explicit test payload to:", url);

    const payload = qs.stringify({
        SmsMessageSid: 'SM1234567890',
        NumMedia: '1',
        MessageType: 'image',
        Body: 'Test caption from mock script',
        From: 'whatsapp:+1234567890',
        MediaUrl0: 'https://api.twilio.com/2010-04-01/Accounts/ACf722b3a4b357f3c3015ea44b974bf8ce/Messages/MM10ca0a57096da3f4c26cdf93e909aa79/Media/MEb6716230d46d7d1f72a1fd7119a90b21',
        MediaContentType0: 'image/jpeg'
    });

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        console.log("Response Type:", response.headers['content-type']);
        console.log("Response Body:\n", response.data);
    } catch (err) {
        console.error("Webhook POST Failed:", err.message);
        if (err.response) {
            console.error("Status:", err.response.status);
            console.error("Data:", err.response.data);
        }
    }
}

testWebhook();
