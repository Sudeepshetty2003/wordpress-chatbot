const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 1. Use ENV variable (NEVER hardcode API key)
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ 2. Load company data safely
let companyInfo = "";

try {
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data);
    console.log("✅ Company data loaded.");
} catch (err) {
    console.error("❌ Error loading companyData.json:", err.message);
    companyInfo = "ABC Technologies is a tech firm based in Bangalore specializing in Web, Mobile and AI solutions.";
}

// ✅ 3. Create model
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: `
You are a helpful AI assistant for ABC Technologies.

Use this company data to answer company-related questions:
${companyInfo}

If a question is NOT about the company,
answer normally like a friendly AI assistant.

Always be clear and helpful.
`
});

// In-memory chat history
let chatHistory = [];

// Health check
app.get("/", (req, res) => {
    res.send("✅ Server is running properly.");
});

// ✅ 4. Chat endpoint
app.post("/chat", async (req, res) => {
    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const responseText = response.text();

        // Save history correctly
        chatHistory.push({
            role: "user",
            parts: [{ text: message }],
        });

        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }],
        });

        // Keep only last 10 exchanges
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        return res.json({ reply: responseText });

    } catch (error) {

        console.error("🔥 Gemini API Error FULL:", error);

        // If quota exceeded or invalid key
        if (error.message?.includes("API key") || error.message?.includes("quota")) {
            return res.status(500).json({
                reply: "⚠️ API key issue or quota exceeded. Please check your Gemini key."
            });
        }

        // If history mismatch
        if (error.message?.includes("400")) {
            chatHistory = [];
            return res.status(500).json({
                reply: "⚠️ Chat history reset. Please send your message again."
            });
        }

        return res.status(500).json({
            reply: "⚠️ AI service temporarily unavailable. Please try again."
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});