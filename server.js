const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini API (Get your key at aistudio.google.com)
const genAI = new GoogleGenerativeAI("AIzaSyClEwusXpq1zJr8lBRakaA_OvExnUxfWms");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// Load company data to use as "Context"
let companyInfo = "";
try {
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data);
} catch (err) {
    console.error("Error loading JSON:", err);
}

// In-memory storage for chat history (Note: resets on server restart)
let chatHistory = [];

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;

    try {
        // 1. Create a System Instruction so the AI knows about your company
        const systemPrompt = `You are a helpful AI assistant for ABC Technologies. 
        Use this company data to answer questions: ${companyInfo}. 
        If a question is not about the company, answer it politely like a general AI.`;

        // 2. Start or continue a chat session with history
        const chat = model.startChat({
            history: chatHistory,
            systemInstruction: systemPrompt,
        });

        // 3. Send the message to Gemini
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // 4. Update history (Save both user and model messages)
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "Something went wrong with the AI." });
    }
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));