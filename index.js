import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { Client } from "revolt.js";

import * as dotenv from "dotenv";
dotenv.config();

import fetch from "node-fetch";

const client = new Client();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN);
const text_model = genAI.getGenerativeModel({ model: "gemini-1.0-pro" });
const image_model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
const generationConfig = {
  temperature: 1,
  topK: 1,
  topP: 1,
  maxOutputTokens: 512
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

const text_chat = text_model.startChat({
  generationConfig,
  safetySettings,
  history: chatHistroy,
});

/**
 * @param {Buffer} buffer - Buffer of file
 * @param {string} mimeType - Mime type of the file buffer
 */
function fileToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString("base64"),
      mimeType
    },
  };
}

client.on("ready", () => {
  console.log(`Logged in as ${client.user?.username}!`);
});

client.on("messageCreate", async (msg) => {
  try {
    if (msg.author?.bot) {
      return 0;
    } else {
      if (msg.attachments) {
        const imageParts = [];

        for (const attachment of msg.attachments) {
          await fetch(attachment.createFileURL())
            .then(async (response) => Buffer.from(await response.arrayBuffer()))
            .then((buffer) => {
              console.log(buffer);
              if (!buffer) throw "Buffer is undefined"
              const aiObject = fileToGenerativePart(Buffer.from(buffer), attachment.contentType)
              console.log(aiObject)
              imageParts.push(aiObject)
            })

          const result = await image_model.generateContent([msg.content, ...imageParts]);
          const response = result.response;
          msg.reply(response.text());
        }
      } else {
        chatHistroy.push({ role: "user", parts: msg.content })
        const result = await text_chat.sendMessage(msg.content);
        const response = result.response;
        await msg.reply(response.text());
        chatHistroy.push({ role: "model", parts: response.text() })
      }
    }
  } catch (e) {
    console.log(e)
  }

});

client.loginBot(process.env.RVLT_TOKEN);
