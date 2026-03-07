const axios = require('axios');

async function testRegister() {
    try {
        const payload = {
            name: "Test User",
            email: `test${Date.now()}@test.com`,
            password: "password123",
            role: "user",
            layout_preferences: {
                text_size: "Medium",
                theme: "Light Mode",
                sections: ["Politics", "Sports"]
            }
        };

        const res = await axios.post("http://localhost:3000/api/register", payload);
        console.log("Success:", res.data);
    } catch (err) {
        console.log("Failed:", err.response ? err.response.data : err.message);
    }
}

testRegister();
