const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Load company data first
let companyInfo = "Default company info";
try {
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data);
} catch (err) {
    console.error("Error loading JSON:", err);
}

// 2. Initialize Gemini with System Instruction CORRECTLY
const genAI = new GoogleGenerativeAI("AIzaSyClEwusXpq1zJr8lBRakaA_OvExnUxfWms");
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are a helpful AI assistant for ABC Technologies. 
    Use this company data to answer questions: ${companyInfo}. 
    If a question is not about the company, answer it politely like a general AI.`
});

// In-memory storage for chat history
let chatHistory = [];

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    if (!userMessage) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // 3. Start chat with existing history
        const chat = model.startChat({
            history: chatHistory,
        });

        // 4. Send message
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // 5. Update history (Keep it to last 10-20 messages to prevent errors)
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI error", details: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));