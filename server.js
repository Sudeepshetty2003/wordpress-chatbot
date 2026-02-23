const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Load company data safely
let companyData = {};
try {
  companyData = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
  console.log("companyData loaded:", companyData);
} catch (err) {
  console.error("Failed to load companyData.json:", err);
}

// Health check
app.get("/", (req, res) => {
  res.send("Chatbot backend is running!");
});

// Chat route
app.post("/chat", (req, res) => {
  const userMessage = req.body.message.toLowerCase().trim();

  // 1️⃣ Casual conversation patterns
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon"];
  const howAreYou = ["how are you", "how's it going", "how do you do"];

  for (let g of greetings) {
    if (userMessage.includes(g)) {
      return res.json({ reply: "Hello! How can I help you today?" });
    }
  }

  for (let h of howAreYou) {
    if (userMessage.includes(h)) {
      return res.json({ reply: "I'm doing great! How about you?" });
    }
  }

  // 2️⃣ Company-related keywords
  const companyKeywords = [
    "about",
    "company",
    "service",
    "offer",
    "solution",
    "contact",
    "email",
    "phone",
    "location"
  ];

  const isCompanyRelated = companyKeywords.some(word =>
    userMessage.includes(word)
  );

  if (!isCompanyRelated) {
    return res.json({
      reply:
        "Sorry, I can only answer questions related to our company information."
    });
  }

  // Service / offer / solution
  const serviceKeywords = ["service", "offer", "solution", "solutions"];
  if (serviceKeywords.some(k => userMessage.includes(k))) {
    return res.json({
      reply: `We provide the following services: ${companyData.services.join(
        ", "
      )}.`
    });
  }

  // Contact info
  const contactKeywords = ["contact", "email", "phone"];
  if (contactKeywords.some(k => userMessage.includes(k))) {
    return res.json({
      reply: `You can contact us at ${companyData.contact.email} or call ${companyData.contact.phone}.`
    });
  }

  // Location
  if (userMessage.includes("location")) {
    return res.json({
      reply: `We are located in ${companyData.location}.`
    });
  }

  // Default about
  return res.json({ reply: companyData.about });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});