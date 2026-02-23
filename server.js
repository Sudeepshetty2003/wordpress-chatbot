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
  const userMessage = req.body.message;

  if (!isCompanyRelated(userMessage)) {
    return res.json({
      reply:
        "Sorry, I can only answer questions related to our company information."
    });
  }

  const lowerMsg = userMessage.toLowerCase();

  if (lowerMsg.includes("service")) {
    return res.json({
      reply: "Our services include: " + companyData.services.join(", ")
    });
  }

  if (lowerMsg.includes("contact") || lowerMsg.includes("email")) {
    return res.json({
      reply: "You can contact us at " + companyData.contact.email
    });
  }

  if (lowerMsg.includes("location")) {
    return res.json({
      reply: "We are located in " + companyData.location
    });
  }

  res.json({
    reply: companyData.about
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});