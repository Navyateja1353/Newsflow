require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
const url = 'https://api.twilio.com/2010-04-01/Accounts/ACf722b3a4b357f3c3015ea44b974bf8ce/Messages/MM10ca0a57096da3f4c26cdf93e909aa79/Media/MEb6716230d46d7d1f72a1fd7119a90b21';

console.log('Testing with SID:', sid);

const auth = Buffer.from(`${sid}:${token}`).toString('base64');

axios.get(url, {
    responseType: 'stream',
    headers: {
        'Authorization': `Basic ${auth}`
    }
}).then(res => {
    console.log('✅ Success:', res.headers['content-type']);
}).catch(e => {
    console.error('❌ Error fetching Twilio img:', e.response ? e.response.status : e.message);
});
