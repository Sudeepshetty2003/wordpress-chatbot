const express = require("express");
const cors = require("cors");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(express.json());

const companyData = JSON.parse(
  fs.readFileSync("./companyData.json", "utf-8")
);

// Scope control function
function isCompanyRelated(question) {
  const allowedKeywords = [
    "about",
    "company",
    "service",
    "contact",
    "email",
    "phone",
    "location"
  ];

  return allowedKeywords.some(keyword =>
    question.toLowerCase().includes(keyword)
  );
}

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

  if (userMessage.includes("service") || userMessage.includes("offer") || userMessage.includes("solution")) {
    return res.json({
      reply: `We provide the following services: ${companyData.services.join(", ")}.`
    });
  }

  if (userMessage.includes("contact") || userMessage.includes("email")) {
    return res.json({
      reply: `You can contact us at ${companyData.contact.email} or call ${companyData.contact.phone}.`
    });
  }

  if (userMessage.includes("location")) {
    return res.json({
      reply: `We are located in ${companyData.location}.`
    });
  }

  return res.json({
    reply: companyData.about
  });
});