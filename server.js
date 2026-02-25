const express = require("express");
const cors = require("cors");
const fs = require("fs");
const Fuse = require("fuse.js");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================================
   LOAD COMPANY DATA
========================================= */

let companyData = {};
try {
  companyData = JSON.parse(
    fs.readFileSync("./companyData.json", "utf-8")
  );
  console.log("companyData loaded successfully");
} catch (err) {
  console.error("Failed to load companyData.json:", err);
}

/* =========================================
   BUILD SEARCHABLE KNOWLEDGE BASE
========================================= */

function buildKnowledgeBase() {
  const kb = [];

  // About
  kb.push({
    category: "about",
    text: companyData.about,
    reply: companyData.about
  });

  // Vision & Mission
  if (companyData.vision) {
    kb.push({
      category: "vision",
      text: "vision future goal",
      reply: companyData.vision
    });
  }

  if (companyData.mission) {
    kb.push({
      category: "mission",
      text: "mission objective purpose",
      reply: companyData.mission
    });
  }

  // Core Technology
  kb.push({
    category: "technology",
    text:
      companyData.core_technology.technology_name +
      " " +
      companyData.core_technology.description,
    reply:
      `${companyData.core_technology.technology_name} is ` +
      companyData.core_technology.description
  });

  // Key Features
  companyData.core_technology.key_features.forEach(feature => {
    kb.push({
      category: "feature",
      text: feature,
      reply: `Key Feature: ${feature}`
    });
  });

  // Solutions
  companyData.solutions.forEach(solution => {
    kb.push({
      category: "solution",
      text: solution.solution_name + " " + solution.description,
      reply: solution.description
    });
  });

  // Use Cases
  companyData.use_cases.forEach(useCase => {
    kb.push({
      category: "usecase",
      text: useCase,
      reply: `smartDNA supports ${useCase}.`
    });
  });

  // Industries
  companyData.target_industries.forEach(industry => {
    kb.push({
      category: "industry",
      text: industry,
      reply: `We serve the ${industry} industry.`
    });
  });

  // Leadership
  companyData.leadership.forEach(person => {
    kb.push({
      category: "leadership",
      text: person.name + " " + person.designation,
      reply: `${person.name} is the ${person.designation} of Linksmart Technologies.`
    });
  });

  // Competitive Positioning
  if (companyData.competitive_positioning) {
    companyData.competitive_positioning.why_linksmart_is_better.forEach(
      point => {
        kb.push({
          category: "competitive",
          text: "why better competitor comparison difference",
          reply: point
        });
      }
    );
  }

  // FAQ
  if (companyData.faq_knowledge) {
    companyData.faq_knowledge.forEach(faq => {
      kb.push({
        category: "faq",
        text: faq.question,
        reply: faq.answer
      });
    });
  }

  return kb;
}

const knowledgeBase = buildKnowledgeBase();

/* =========================================
   FUZZY SEARCH CONFIGURATION
========================================= */

const fuse = new Fuse(knowledgeBase, {
  keys: ["text"],
  threshold: 0.4, // Increase to 0.5 if you want even more typo tolerance
  includeScore: true
});

/* =========================================
   HEALTH CHECK
========================================= */

app.get("/", (req, res) => {
  res.send("Chatbot backend is running!");
});

/* =========================================
   CHAT ROUTE
========================================= */

app.post("/chat", (req, res) => {
  if (!req.body.message) {
    return res.json({ reply: "Please send a valid message." });
  }

  const userMessage = req.body.message.toLowerCase().trim();

  /* ========= Greeting Detection ========= */

  const greetings = ["hello", "hi", "hey", "good morning", "good evening"];
  if (greetings.some(g => userMessage.includes(g))) {
    return res.json({
      reply: "Hello 👋 How can I assist you regarding Linksmart Technologies?"
    });
  }

  /* ========= Direct Company Info ========= */

  if (
    userMessage.includes("company profile") ||
    userMessage.includes("legal name") ||
    userMessage.includes("cin")
  ) {
    return res.json({
      reply:
        `Legal Name: ${companyData.company_profile.legal_name}\n` +
        `CIN: ${companyData.company_profile.cin}\n` +
        `Headquarters: ${companyData.company_profile.headquarters.city}, ${companyData.company_profile.headquarters.country}`
    });
  }

  /* ========= Competitive Comparison ========= */

  if (
    userMessage.includes("compare") ||
    userMessage.includes("better than") ||
    userMessage.includes("difference between") ||
    userMessage.includes("qr") ||
    userMessage.includes("hologram")
  ) {
    return res.json({
      reply:
        "Linksmart's smartDNA offers non-clonable physical + digital security. Unlike QR codes or holograms that can be copied, smartDNA generates a unique fingerprint per product unit, making duplication practically impossible."
    });
  }

  /* ========= Fuzzy Intelligent Matching ========= */

  const results = fuse.search(userMessage);

  if (results.length > 0 && results[0].score < 0.45) {
    return res.json({ reply: results[0].item.reply });
  }

  /* ========= Fallback ========= */

  return res.json({
    reply:
      "I'm sorry, I couldn't understand that clearly. Please ask about smartDNA, anti-counterfeiting solutions, industries, leadership, or competitive advantages."
  });
});

/* =========================================
   START SERVER
========================================= */

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});