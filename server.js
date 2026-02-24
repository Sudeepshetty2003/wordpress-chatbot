require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.json());

// ✅ 1. Load API Key
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in environment variables.");
}

const genAI = new GoogleGenerativeAI(API_KEY);

// ✅ 2. Load company data safely
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

// ✅ 3. Initialize model (stable version)
const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash-latest", // safer than fixed version
});

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
        // Build structured prompt each time (more stable)
        const prompt = `
You are a helpful AI assistant for ABC Technologies.

Company Data:
${companyInfo}

Instructions:
- If the user question is about the company, answer using the company data above.
- If the question is NOT about the company, answer normally like a general AI assistant.
- Be clear and helpful.

User Question:
${message}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const responseText = response.text();

        return res.json({ reply: responseText });

    } catch (error) {

        console.error("🔥 FULL ERROR OBJECT:");
        console.error(error);
        console.error("🔥 ERROR MESSAGE:", error.message);
        console.error("🔥 ERROR RESPONSE:", error.response?.data);

        return res.status(500).json({
            reply: "Internal error. Check server logs."
        });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});