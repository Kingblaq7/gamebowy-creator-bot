let users = {}; // temporary storage (upgrade later to DB)

const ADMIN_CHAT_ID = "YOUR_TELEGRAM_ID"; 
// get this by messaging @userinfobot

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(200).send("OK");

  const update = req.body;

  if (!update.message) return res.status(200).send("OK");

  const msg = update.message;
  const chatId = msg.chat.id;
  const text = msg.text || "";

  // /start command
  if (text === "/start") {
    return sendMessage(chatId,
      `👋 Welcome Game Bowy Creators!

This bot tracks your posts and saves your creator profile.

Choose an option below 👇`,
      {
        keyboard: [
          ["📌 Register Account"],
          ["📤 Submit Post"],
          ["💼 Change Wallet"],
          ["🌍 Country / Language"],
          ["📜 History"]
        ]
      }
    );
  }

  // Register flow (simple version)
  if (text.startsWith("📌 Register")) {
    users[chatId] = { step: "wallet" };

    return sendMessage(chatId, "Send your WALLET address:");
  }

  // Wallet capture
  if (users[chatId]?.step === "wallet") {
    users[chatId].wallet = text;
    users[chatId].step = "xlink";

    return sendMessage(chatId, "Now send your X (Twitter) profile link:");
  }

  // X link capture
  if (users[chatId]?.step === "xlink") {
    users[chatId].xlink = text;
    users[chatId].step = "done";

    return sendMessage(chatId, "✅ Registered successfully!");
  }

  // Submit post
  if (text.startsWith("📤 Submit Post")) {
    users[chatId] = users[chatId] || {};
    users[chatId].step = "post";

    return sendMessage(chatId, "Send your post link:");
  }

  // Save post + forward to admin
  if (users[chatId]?.step === "post") {
    const postLink = text;

    users[chatId].lastPost = postLink;

    // SEND TO ADMIN DM
    await sendMessage(ADMIN_CHAT_ID,
      `🚨 NEW GAME BOWY POST

👤 User: ${chatId}
🔗 Post: ${postLink}
🔐 Wallet: ${users[chatId]?.wallet || "Not set"}
🐦 X: ${users[chatId]?.xlink || "Not set"}`
    );

    users[chatId].step = "done";

    return sendMessage(chatId, "✅ Post submitted successfully!");
  }

  return res.status(200).send("OK");
}

// helper function
async function sendMessage(chatId, text, extra = {}) {
  const keyboard = extra.keyboard
    ? {
        reply_markup: {
          keyboard: extra.keyboard,
          resize_keyboard: true
        }
      }
    : {};

  await fetch(`https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      ...keyboard
    })
  });
}
