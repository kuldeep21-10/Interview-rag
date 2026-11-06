import "dotenv/config";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenrativeAI({ apiKey: process.env.GEMINI_KEY });


export const model = ai.getGenerativeModel({
    model:'gemini-3.5-flash'
})

