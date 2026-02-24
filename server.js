const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI("AIzaSyClEwusXpq1zJr8lBRakaA_OvExnUxfWms");

let companyInfo = "";
try {
    // Make sure companyData.json is in your root folder on GitHub!
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data);
} catch (err) {
    console.error("Error loading JSON:", err);
    companyInfo = "ABC Technologies is a software development company.";
}

const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are a helpful AI assistant for ABC Technologies. 
    Use this company data to answer questions: ${companyInfo}. 
    If a question is not about the company, answer it politely like a general AI.`
});

let chatHistory = [];

// ADD THIS: Health check for Render
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

app.post("/chat", async (req, res) => {
    const userMessage = req.body.message;
    if (!userMessage) return res.status(400).json({ error: "No message" });

    try {
        const chat = model.startChat({ history: chatHistory });
        const result = await chat.sendMessage(userMessage);
        const responseText = result.response.text();

        // Update history correctly
        chatHistory.push({ role: "user", parts: [{ text: userMessage }] });
        chatHistory.push({ role: "model", parts: [{ text: responseText }] });

        if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

        res.json({ reply: responseText });
    } catch (error) {
        console.error("Gemini Error:", error);
        res.status(500).json({ reply: "I'm having trouble thinking right now. Please try again." });
    }
});

// IMPORTANT: Use process.env.PORT
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));