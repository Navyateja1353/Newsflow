const axios = require('axios');

async function testWebhook() {
    try {
        const res = await axios.post('http://localhost:3000/api/whatsapp/webhook', {
            Body: "ఈ రోజు మధ్యాహ్నం 12 గంటలకు నగరంలో భారీ ట్రాఫిక్ జామ్ ఏర్పడింది. వాహనదారులు తీవ్ర ఇబ్బందులు పడ్డారు. పోలీసులు ట్రాఫిక్ ను నియంత్రించడానికి ప్రయత్నిస్తున్నారు.",
            From: "whatsapp:+919876543210",
            NumMedia: "0"
        });
        console.log("Response:", res.data);
    } catch (e) {
        console.error("Error:", e.message);
    }
}

testWebhook();
