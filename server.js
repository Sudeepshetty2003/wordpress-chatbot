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
  console.log("companyData loaded successfully");
} catch (err) {
  console.error("Failed to load companyData.json:", err);
}

// Health check
app.get("/", (req, res) => {
  res.send("Chatbot backend is running!");
});

// Chat route
app.post("/chat", (req, res) => {
  if (!req.body.message) {
    return res.json({ reply: "Please send a valid message." });
  }

  const userMessage = req.body.message.toLowerCase().trim();

  // =========================
  // 1️⃣ Casual conversation
  // =========================
  const greetings = ["hello", "hi", "hey", "good morning", "good afternoon"];
  if (greetings.some(g => userMessage.includes(g))) {
    return res.json({ reply: "Hello 👋 How can I assist you today?" });
  }

  if (userMessage.includes("how are you")) {
    return res.json({ reply: "I'm doing great! 😊 How can I help you?" });
  }

  // =========================
  // 2️⃣ About Company
  // =========================
  if (userMessage.includes("about") || userMessage.includes("company")) {
    return res.json({
      reply: companyData.about
    });
  }

  // =========================
  // 3️⃣ smartDNA Technology
  // =========================
  if (userMessage.includes("smartdna") || userMessage.includes("technology")) {
    return res.json({
      reply: `${companyData.core_technology.technology_name} is ${companyData.core_technology.description}`
    });
  }

  // =========================
  // 4️⃣ Services / Solutions
  // =========================
  if (
    userMessage.includes("solution") ||
    userMessage.includes("service") ||
    userMessage.includes("offer")
  ) {
    const solutions = companyData.solutions
      .map(sol => sol.solution_name)
      .join(", ");

    return res.json({
      reply: `We provide the following solutions: ${solutions}.`
    });
  }

  // =========================
  // 5️⃣ Use Cases
  // =========================
  if (userMessage.includes("use case") || userMessage.includes("application")) {
    return res.json({
      reply: `Our solutions are used for: ${companyData.use_cases.join(", ")}.`
    });
  }

  // =========================
  // 6️⃣ Industries
  // =========================
  if (userMessage.includes("industry") || userMessage.includes("industries")) {
    return res.json({
      reply: `We serve industries such as: ${companyData.target_industries.join(", ")}.`
    });
  }

  // =========================
  // 7️⃣ Leadership
  // =========================
  if (
    userMessage.includes("director") ||
    userMessage.includes("founder") ||
    userMessage.includes("managing")
  ) {
    const leaders = companyData.leadership
      .map(person => `${person.name} (${person.designation})`)
      .join(", ");

    return res.json({
      reply: `Our leadership team includes: ${leaders}.`
    });
  }

  // =========================
  // 8️⃣ Location
  // =========================
  if (userMessage.includes("location") || userMessage.includes("where")) {
    const hq = companyData.company_profile.headquarters;
    return res.json({
      reply: `We are headquartered in ${hq.city}, ${hq.state}, ${hq.country}.`
    });
  }

  // =========================
  // 9️⃣ Website
  // =========================
  if (userMessage.includes("website")) {
    return res.json({
      reply: `You can visit us at ${companyData.digital_presence.official_website}`
    });
  }

  // =========================
  // 🔟 Fallback
  // =========================
  return res.json({
    reply:
      "Sorry, I can only answer questions related to Linksmart Technologies and smartDNA solutions."
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});