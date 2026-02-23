const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

// Safe JSON loading
let companyData = {};
try {
  companyData = JSON.parse(fs.readFileSync("./companyData.json", "utf-8"));
  console.log("companyData loaded:", companyData);
} catch (err) {
  console.error("Failed to load companyData.json:", err);
}

// Health check route (for Render)
app.get("/", (req, res) => {
  res.send("Chatbot backend is running!");
});

// Chat route
app.post("/chat", (req, res) => {
  const userMessage = req.body.message.toLowerCase();

  const allowedKeywords = [
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

  const isRelated = allowedKeywords.some(word =>
    userMessage.includes(word)
  );

  if (!isRelated) {
    return res.json({
      reply: "Sorry, I can only answer questions related to our company information."
    });
  }

  // Handle service-related questions
  const serviceKeywords = ["service", "offer", "solution", "solutions"];
  if (serviceKeywords.some(k => userMessage.includes(k))) {
    return res.json({
      reply: `We provide the following services: ${companyData.services.join(", ")}.`
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
  return res.json({
    reply: companyData.about
  });
});

// Start server (must be at bottom)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});