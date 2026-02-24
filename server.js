require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

if (!OPENROUTER_API_KEY) {
    console.error("❌ OPENROUTER_API_KEY missing in environment variables.");
}

// =======================
// Health Check
// =======================
app.get("/", (req, res) => {
    res.send("✅ AI Chatbot Server Running");
});

// =======================
// Chat Endpoint
// =======================
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: "Message is required." });
    }

    try {
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "mistralai/mistral-7b-instruct",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful AI assistant. Answer all user questions clearly and naturally."
                    },
                    {
                        role: "user",
                        content: message
                    }
                ]
            })
        });

        const data = await response.json();

        if (!response.ok) {
            console.error("🔥 OpenRouter Error:", data);
            return res.status(500).json({
                reply: "⚠️ AI service error. Please try again."
            });
        }

        const reply = data.choices?.[0]?.message?.content || "⚠️ No response generated.";

        res.json({ reply });

    } catch (error) {
        console.error("🔥 SERVER ERROR:", error);
        res.status(500).json({
            reply: "⚠️ Internal server error."
        });
    }
});

// =======================
// Start Server
// =======================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});