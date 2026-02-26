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

  // Normalize input
  let userMessage = req.body.message
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, "")      // remove symbols
    .replace(/\s+/g, " ");            // normalize spaces

  /* ==============================
     1️⃣ SMART GREETING DETECTION
  =============================== */

  const greetingRegex = /^(hi+|hii+|hiii+|hello+|helo+|hlo+|hey+)/;

  if (greetingRegex.test(userMessage)) {
    return res.json({
      reply: "Hello 👋 How can I assist you regarding Linksmart Technologies?"
    });
  }

  /* ==============================
     2️⃣ HOW ARE YOU HANDLING
  =============================== */

  if (
    userMessage.includes("how are you") ||
    userMessage.includes("are you fine") ||
    userMessage.includes("how r u")
  ) {
    return res.json({
      reply: "I'm functioning optimally and ready to assist you with information about Linksmart Technologies."
    });
  }

  /* ==============================
     3️⃣ STRONG ABOUT INTENT
  =============================== */

  if (
    userMessage.includes("what is linksmart") ||
    userMessage.includes("who is linksmart") ||
    userMessage.includes("tell me about linksmart") ||
    userMessage.includes("about linksmart") ||
    userMessage.includes("company overview")
  ) {
    return res.json({
      reply: companyData.about
    });
  }

  /* ==============================
     4️⃣ SMARTDNA DIRECT INTENT
  =============================== */

  if (userMessage.includes("smartdna") || userMessage.includes("smrtdna")) {
    return res.json({
      reply:
        `${companyData.core_technology.technology_name} is ` +
        companyData.core_technology.description
    });
  }

  /* ==============================
     5️⃣ COMPETITOR / QR / HOLOGRAM
  =============================== */

  if (
    userMessage.includes("qr") ||
    userMessage.includes("hologram") ||
    userMessage.includes("better than") ||
    userMessage.includes("compare") ||
    userMessage.includes("difference")
  ) {
    return res.json({
      reply:
        "Unlike QR codes or holograms that can be copied or replicated, smartDNA provides a non-clonable physical + digital fingerprint for each individual product unit, making duplication practically impossible."
    });
  }

  /* ==============================
     6️⃣ FUZZY SEARCH FALLBACK
  =============================== */

  const results = fuse.search(userMessage);

  if (results.length > 0 && results[0].score < 0.6) {
    return res.json({
      reply: results[0].item.reply
    });
  }

  /* ==============================
     7️⃣ FINAL FALLBACK
  =============================== */

  return res.json({
    reply:
      "I couldn't clearly understand that. Please ask about Linksmart Technologies, smartDNA, industries, leadership, or security solutions."
  });
});