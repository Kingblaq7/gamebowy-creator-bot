require("dotenv").config();

const TelegramBot = require("node-telegram-bot-api");
const { createClient } = require("@supabase/supabase-js");

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const keyboard = {
  reply_markup: {
    keyboard: [
      ["📤 Submit Post"],
      ["💰 Change Wallet"],
      ["🌍 Country/Language"],
      ["📜 History"]
    ],
    resize_keyboard: true,
  },
};

bot.onText(/\/start/, async (msg) => {
  bot.sendMessage(
    msg.chat.id,
    `🎮 Welcome to GameBowy Creator Hub

This is where your creator activities and GameBowy posts are tracked.

Please send your X profile link.`,
    keyboard
  );
});

let users = {};

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (!users[chatId]) {
    users[chatId] = {};
  }

  if (text.includes("x.com") || text.includes("twitter.com")) {
    users[chatId].username = text;

    bot.sendMessage(chatId, "✅ X account saved.\n\nNow send your wallet address.");
    return;
  }

  if (text.startsWith("0x")) {
    users[chatId].wallet = text;

    await supabase.from("creators").insert([
      {
        telegram_id: chatId.toString(),
        username: users[chatId].username,
        wallet: text,
      },
    ]);

    bot.sendMessage(chatId, "✅ Wallet saved successfully.", keyboard);
    return;
  }

  if (text === "📤 Submit Post") {
    bot.sendMessage(chatId, "Send your X post link.");
    return;
  }

  if (text.includes("status")) {
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `📢 New Creator Submission\n\nUser: ${chatId}\n\nPost:\n${text}`
    );

    bot.sendMessage(chatId, "✅ Post submitted successfully.");
  }
});
