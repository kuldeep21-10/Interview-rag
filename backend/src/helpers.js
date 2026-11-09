import { askGemini } from "./gemini.js";

export const normalizeEmail = (v)=>{

    if(typeof v !== 'string' ) return '';
    const e =v.trim().toLocaleLowerCase();
    return e.length <= 254 ? e : "";

};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


export const bad = (res, message, status = 400) => res.status(status).json({ message });

export const isvaliduser = (v) => typeof v ==='string';
export const isValidPassword = (v) => typeof v === "string" && v.length >= 8 && v.length <= 72; // bcrypt ignores bytes past 72

export const generateQuestions = async (techStack, difficulty, count = 5) => {
  const prompt = `Generate ${count} ${difficulty} level technical interview questions
for a fresher on these topics: ${techStack.join(", ")}.
Return ONLY a JSON array, no extra text, in this format:
[{"question": "...", "topic": "..."}]`;

  const text = await askGemini(prompt);

  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
};

