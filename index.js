require('dotenv/config');
const { Client, IntentsBitField } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({
  intents: [
    IntentsBitField.Flags.Guilds,
    IntentsBitField.Flags.GuildMessages,
    IntentsBitField.Flags.MessageContent,
  ],
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// Fungsi untuk membagi pesan yang terlalu panjang
function splitMessage(text, maxLength = 10000) {
  const messages = [];
  while (text.length > 0) {
    messages.push(text.substring(0, maxLength));
    text = text.substring(maxLength);
  }
  return messages;
}

client.on('ready', () => {
  console.log('✅ The bot is online!');
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return; // Abaikan pesan dari bot
  if (message.content.startsWith('!')) return; // Abaikan command bot
  if (!message.channel) return; // Pastikan channel tersedia

  try {
    await message.channel.sendTyping();
    const prompt = message.content;

    const result = await model.generateContent(prompt);
    const response = await result.response;

    if (!response || !response.text) {
      throw new Error('Invalid response from Gemini API');
    }

    const replyText = response.text();

    // Jika pesan terlalu panjang, pecah menjadi beberapa bagian
    const messages = splitMessage(replyText);
    for (const msg of messages) {
      await message.reply(msg);
    }
  } catch (error) {
    console.error(`🚨 Gemini API Error: ${error.message}`);
    message.reply('❌ Sorry, I encountered an error while processing your request.');
  }
});

client.login(process.env.TOKEN);
