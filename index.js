import colors from "colors"
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
if (!process.env.GEMINI_API_TOKEN, process.env.GEMINI_API_TOKEN === "") throw new Error(colors.bgRed("ERROR"), "Missing Gemini API token");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_TOKEN);
const text_model = genAI.getGenerativeModel({ model: "gemini-pro" });
const image_model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });
const generationConfig = {
  temperature: process.env.TEMPERATURE,
  topK: process.env.TOP_K,
  topP: process.env.TOP_P,
  maxOutputTokens: process.env.MAX_OUTPUT_TOKENS
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
const text_chat = text_model.startChat({
  generationConfig,
  safetySettings,
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
  console.log(colors.bgGreen.white("READY"), "Logged in as", colors.blue(client.user?.username));
  console.log(colors.bgGreen.white("DEBUG"), `Using the following settings\nPREFIX: ${process.env.PREFIX}\nTemperature: ${process.env.TEMPERATURE}\nTOP K: ${process.env.TOP_K}\nTOP P: ${process.env.TOP_P}\nMAXIMUM TOKENS: ${process.env.MAX_OUTPUT_TOKENS}\nUSE PREFIX: ${process.env.USE_PREFIX}`);
});

client.on("messageCreate", async (msg) => {
  if (process.env.USE_PREFIX && !msg.content.startsWith(process.env.PREFIX)) {
    console.log(colors.bgYellow("Ignoring message because it doesn't start with a prefix"));
    return;
  }

  if (process.env.USE_PREFIX && msg.content.startsWith(process.env.PREFIX)) {
    try {
      if (msg.author?.bot) {
        console.log(colors.bgYellow("WARN"), "Message is from a bot, ignoring...");
        return 0;
      } else {
        if (msg.attachments) {
          const imageParts = [];
          console.log(colors.bgMagenta("GEMINI_API"), "Using: ", image_model.model.toString());
          console.log(colors.dim("MESSAGE"), "This message has attachments: ", msg.attachments);
          for (const attachment of msg.attachments) {
            console.log(colors.bgWhite("ATTACHMENT"), "Downloading attachment: ", attachment.url);
            await fetch(attachment.createFileURL())
              .then(async (response) => Buffer.from(await response.arrayBuffer()))
              .then((buffer) => {
                if (!buffer) throw new Error(color.bgRed("ERROR"), "Buffer is undefined");
                if (attachment.contentType === "text/plain") throw new Error(color.bgRed("ERROR"), "This content type is not supported");
                const aiObject = fileToGenerativePart(Buffer.from(buffer), attachment.contentType)
                imageParts.push(aiObject)
              }).finally(async () => {
                if (imageParts.length > 4194304) {
                  throw new Error(color.bgRed("ERROR"), "Attachment is too large...");
                } else {
                  console.log(colors.bgWhite("ATTACHMENT"), "Attachment has been downloaded: ", attachment.url);
                  const result = await image_model.generateContent([msg.content, ...imageParts]);
                  console.log(colors.bgMagenta("GEMINI_API"), "Gemini has responsed: ", result.response.text())
                  msg.reply(result.response.text());
                }
              })
          }
        } else {
          console.log(colors.bgWhite("MESSAGE"), "New message: ", msg.content);
          console.log(colors.bgMagenta("GEMINI_API"), "Using: ", text_model.model.toString());
          const result = await text_chat.sendMessage(msg.content);
          console.log(colors.bgMagenta("GEMINI_API"), "Gemini has responsed: ", result.response.text())
          await msg.reply(result.response.text());
        }
      }
    } catch (e) {
      console.error(colors.bgRed("ERROR"), e);
    }
  } else {
    console.log(colors.bgYellow("WARN"), "USE_PREFIX is disabled, ignoring...");
    try {
      if (msg.author?.bot) {
        console.log(colors.bgYellow("WARN"), "Message is from a bot, ignoring...");
        return 0;
      } else {
        if (msg.attachments) {
          const imageParts = [];
          console.log(colors.bgMagenta("GEMINI_API"), "Using: ", image_model.model.toString());
          console.log(colors.dim("MESSAGE"), "This message has attachments: ", msg.attachments);
          for (const attachment of msg.attachments) {
            console.log(colors.bgWhite("ATTACHMENT"), "Downloading attachment: ", attachment.url);
            await fetch(attachment.createFileURL())
              .then(async (response) => Buffer.from(await response.arrayBuffer()))
              .then((buffer) => {
                if (!buffer) throw new Error(color.bgRed("ERROR"), "Buffer is undefined");
                if (attachment.contentType === "text/plain") throw new Error(color.bgRed("ERROR"), "This content type is not supported");
                const aiObject = fileToGenerativePart(Buffer.from(buffer), attachment.contentType)
                imageParts.push(aiObject)
              }).finally(async () => {
                if (imageParts.length > 4194304) {
                  throw new Error(color.bgRed("ERROR"), "Attachment is too large...");
                } else {
                  console.log(colors.bgWhite("ATTACHMENT"), "Attachment has been downloaded: ", attachment.url);
                  const result = await image_model.generateContent([msg.content, ...imageParts]);
                  console.log(colors.bgMagenta("GEMINI_API"), "Gemini has responsed: ", result.response.text())
                  msg.reply(result.response.text());
                }
              })
          }
        } else {
          console.log(colors.bgWhite("MESSAGE"), "New message: ", msg.content);
          console.log(colors.bgMagenta("GEMINI_API"), "Using: ", text_model.model.toString());
          const result = await text_chat.sendMessage(msg.content);
          console.log(colors.bgMagenta("GEMINI_API"), "Gemini has responsed: ", result.response.text())
          await msg.reply(result.response.text());
        }
      }
    } catch (e) {
      console.error(colors.bgRed("ERROR"), e);
    }
  }
});

if (!process.env.RVLT_TOKEN, process.env.RVLT_TOKEN === "") {
  throw new Error(color.bgRed("ERROR"), "Missing Revolt token");
} else {
  client.loginBot(process.env.RVLT_TOKEN);
}
