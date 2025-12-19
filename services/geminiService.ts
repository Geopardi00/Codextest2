
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getFestiveRoast = async (score: number, attempts: number) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `The player just crashed in a Christmas-themed Geometry Dash game. Their score was ${score} after ${attempts} attempts. Write a short, funny, Christmas-themed roast or encouragement. Keep it under 15 words. Mention something like coal, reindeer, or elves.`,
      config: {
        temperature: 0.9,
      }
    });
    return response.text || "Maybe next time, Rudolph!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Ouch! Right into the snowdrift.";
  }
};

export const getWelcomeMessage = async () => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "Generate a punny Christmas-themed welcome message for a game called Sleigh Dash. Max 10 words.",
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Dash through the snow!";
  } catch (error) {
    return "Ready to Dash?";
  }
};
