const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// 1. Initialize Gemini with your NEW API Key
// Note: It's better to use process.env.GEMINI_API_KEY on Render for safety
const API_KEY = "AIzaSyBrkvyvCZSy8Z7kFSoUcRMEwGHnmqN19AI";
const genAI = new GoogleGenerativeAI(API_KEY);

// 2. Load company data safely
let companyInfo = "";
try {
    const data = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
    companyInfo = JSON.stringify(data);
    console.log("Data loaded successfully.");
} catch (err) {
    console.error("Error loading JSON:", err.message);
    companyInfo = "ABC Technologies is a tech firm based in Bangalore specializing in Web and AI.";
}

// 3. Configure the model with the system instruction
const model = genAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    systemInstruction: `You are a helpful AI assistant for ABC Technologies. 
    Use this company data to answer questions: ${companyInfo}. 
    If a question is not about the company, answer it politely like a general AI assistant.`
});

// In-memory chat history
let chatHistory = [];

// Health check for Render deployment
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

// 4. Chat endpoint
app.post("/chat", async (req, res) => {
    const { message } = req.body;
    
    if (!message) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        // Start chat with current history
        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(message);
        const response = await result.response;
        const responseText = response.text();

        // Update history strictly following the required format
        chatHistory.push({
            role: "user",
            parts: [{ text: message }],
        });
        chatHistory.push({
            role: "model",
            parts: [{ text: responseText }],
        });

        // Limit history to last 10 exchanges to keep requests fast
        if (chatHistory.length > 20) {
            chatHistory = chatHistory.slice(-20);
        }

        res.json({ reply: responseText });

    } catch (error) {
        console.error("Gemini API Error:", error.message);
        
        // If the error is a history mismatch, clear history and try once more
        if (error.message.includes("400")) {
            chatHistory = []; 
            res.status(500).json({ reply: "I had a connection glitch. Please try typing that one more time!" });
        } else {
            res.status(500).json({ reply: "I'm having trouble thinking right now. Please check your API quota or connection." });
        }
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));