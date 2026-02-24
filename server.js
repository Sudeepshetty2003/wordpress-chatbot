require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// ===============================
// 1️⃣ Load API Key
// ===============================
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in environment variables.");
}

// ===============================
// 2️⃣ Load Company Data
// ===============================
let companyInfo = "";

try {
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data, null, 2);
    console.log("✅ Company data loaded.");
} catch (err) {
    console.error("❌ Error loading companyData.json:", err.message);
    companyInfo =
        "ABC Technologies is a tech firm based in Bangalore specializing in Web, Mobile and AI solutions.";
}

// ===============================
// 3️⃣ Health Check
// ===============================
app.get("/", (req, res) => {
    res.send("✅ Server is running properly.");
});

// ===============================
// 4️⃣ Chat Endpoint
// ===============================
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {

        const prompt = `
You are a helpful AI assistant for ABC Technologies.

Company Data:
${companyInfo}

Instructions:
- If the question is about the company, answer using the company data.
- If not, answer normally like a general AI assistant.
- Be clear and helpful.

User Question:
${message}
        `;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: prompt }]
                        }
                    ]
                }),
            }
        );

        const data = await response.json();

        // 🔥 If Gemini returns error
        if (!response.ok) {
            console.error("🔥 Gemini API Error:", data);
            return res.status(500).json({
                reply: "⚠️ AI service error. Check server logs."
            });
        }

        const reply =
            data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "⚠️ No response generated.";

        return res.json({ reply });

    } catch (error) {
        console.error("🔥 SERVER ERROR:", error);
        return res.status(500).json({
            reply: "⚠️ Internal server error."
        });
    }
});

// ===============================
// 5️⃣ Start Server
// ===============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});