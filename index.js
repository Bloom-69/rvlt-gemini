import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { Client } from "revolt.js";

import * as dotenv from "dotenv";
dotenv.config();

const client = new Client();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN);
const model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
const generationConfig = {
  temperature: 1,
  topK: 1,
  topP: 1,
  maxOutputTokens: 4096,
};
const safetySettings = [
  {
    category: HarmCategory.HARM_CATEGORY_HARASSMENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
  {
    category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
    threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
  },
];

const chatHistroy = []

const chat = model.startChat({
  generationConfig,
  safetySettings,
  history: chatHistroy,
});


client.on("ready", () => {
  console.log(`Logged in as ${client.user?.username}!`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) {
    return 0;
  } else {
    chatHistroy.push({ role: "user", parts: msg.content })

    const result = await chat.sendMessage(msg.content);
    const response = result.response;
    msg.reply(response.text());
    chatHistroy.push({ role: "model", parts: response.text() })
  }
});

client.loginBot(process.env.RVLT_TOKEN);
