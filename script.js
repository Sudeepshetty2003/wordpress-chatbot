// script.js
const sendBtn = document.getElementById("sendBtn");
const userInput = document.getElementById("userInput");
const chatWindow = document.getElementById("chat-window");

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", function(e) {
  if (e.key === "Enter") sendMessage();
});

async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;

  appendMessage("user", message);
  userInput.value = "";

  // Typing indicator
  const typing = appendMessage("bot", "Thinking...");
  typing.classList.add("typing");

  try {
    const res = await fetch("https://wordpress-chatbot-a8m5.onrender.com/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message })
    });

    const data = await res.json();
    // Remove typing indicator
    chatWindow.removeChild(typing);
    appendMessage("bot", data.reply);
  } catch (err) {
    if (typing.parentNode) chatWindow.removeChild(typing);
    appendMessage("bot", "Sorry, something went wrong.");
    console.error(err);
  }

  chatWindow.scrollTop = chatWindow.scrollHeight;
}

function appendMessage(sender, text) {
  const msg = document.createElement("div");
  msg.classList.add("message", sender);
  msg.textContent = text;
  chatWindow.appendChild(msg);
  chatWindow.scrollTop = chatWindow.scrollHeight;
  return msg;
}