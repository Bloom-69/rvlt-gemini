import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { Client } from "revolt.js";
import * as config from "./config.json";

const client = new Client();
const genAI = new GoogleGenerativeAI(config.bot.token);
const model = genAI.getGenerativeModel({ model: config.ai.model });

const generationConfig = {
  temperature: 0.9,
  topK: 1,
  topP: 1,
  maxOutputTokens: 2048,
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

const chat = model.startChat({
  generationConfig,
  safetySettings,
  history: [],
});

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.username}!`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) {
    return 0;
  } else {
    const result = await chat.sendMessage(msg.content);
    const response = result.response;
    msg.reply(response.text());
  }
});

client.loginBot(config.bot.token);
