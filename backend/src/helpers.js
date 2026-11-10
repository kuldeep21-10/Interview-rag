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

export const EvaluateAnswer = async (question ,answer,role,level) => {

 const trimmed = typeof answer === "string" ? answer.trim() : "";
  if (!trimmed || /^(i don'?t know|idk|no idea|pata nahi)\.?$/i.test(trimmed)) {
    return {
      score: 0,
      feedback: "No answer was given for this question.",
      strengths: [],
      improvements: ["Attempt the question, even a partial answer earns marks."],
    };
  }
 const prompt = `
You are a strict but fair technical interviewer.
Role: ${role}
Level: ${level}

Question: ${question}
Candidate's answer: ${answer}

Evaluate the answer and respond ONLY with JSON in this exact shape:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentences, direct and specific>",
  "strengths": ["..."],
  "improvements": ["..."]
}
Scoring: 0-3 wrong/irrelevant, 4-6 partially correct, 7-8 good, 9-10 excellent and complete.
If the answer is empty or says "I don't know", give score 0.
`;

 const text = await askGemini(prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  const data = JSON.parse(clean);

  
  return {
    score: Math.max(0, Math.min(10, Math.round(Number(data.score) || 0))),
    feedback: data.feedback || "",
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    improvements: Array.isArray(data.improvements) ? data.improvements : [],
  }
  


}

export const generateOverallFeedback = async (items, totalScore, difficulty) => {
  const summary = items
    .map(
      (it, i) =>
        `Q${i + 1} [${it.topic || "General"}] score: ${
          typeof it.score === "number" ? it.score : 0
        }/10${
          it.improvements?.length
            ? ` | improve: ${it.improvements.join("; ")}`
            : ""
        }`
    )
    .join("\n");

  const prompt = `
You are a technical interviewer giving final feedback to a fresher after a mock interview.
Difficulty: ${difficulty}
Overall score: ${totalScore}%

Per-question summary:
${summary}

Write 3-4 plain sentences (no markdown, no bullet points, no JSON):
- the overall performance in one line
- the strongest topics
- the weakest topics and what to revise first
`;

  const text = await askGemini(prompt);
  return text.trim();
};

export const generateFeedback = async(topic ,score ,improvement) => {

  const prompt = ` `

  const text = await askGemini(prompt);



}
