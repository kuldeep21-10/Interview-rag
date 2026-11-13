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


export const generateQuestions = async (techStack, difficulty, count = 5, avoid = []) => {
  const styles = [
    "core concept definition",
    "comparison between two related concepts",
    "predict the output of a short code snippet",
    "common mistake or gotcha",
    "real-world use case",
    "how it works internally",
  ];
  const picked = [...styles].sort(() => Math.random() - 0.5).slice(0, 3);

  const avoidBlock = avoid.length
    ? `Do NOT ask any of these questions or close rephrasings of them:\n- ${avoid.join("\n- ")}\n`
    : "";

  const prompt = `Generate ${count} ${difficulty} level technical interview questions
for a fresher on these topics: ${techStack.join(", ")}.
Mix these question styles: ${picked.join(", ")}.
All ${count} questions must cover different concepts.
${avoidBlock}The "topic" field of every question must be exactly one of these values, spelled exactly like this: ${techStack.join(", ")}.
Return ONLY a JSON array, no extra text, in this format:
[{"question": "...", "topic": "..."}]`;

  const text = await askGemini(prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  return parsed.map((q) => ({
    ...q,
    topic: techStack.includes(q.topic) ? q.topic : techStack[0],
  }));
};

export const EvaluateAnswer = async (question, answer, topic, difficulty, notes = []) => {
  const trimmed = typeof answer === "string" ? answer.trim() : "";
  if (!trimmed || /^(i don'?t know|idk|no idea|pata nahi)\.?$/i.test(trimmed)) {
    return {
      score: 0,
      feedback: "No answer was given for this question.",
      strengths: [],
      improvements: ["Attempt the question, even a partial answer earns marks."],
    };
  }

  const reference = notes.length
    ? `Reference notes (treat these as the ground truth for what a correct answer should contain):
${notes.map((n, i) => `[${i + 1}] ${n.title}: ${n.content}`).join("\n\n")}

`
    : "";

  const prompt = `
You are a strict but fair technical interviewer.
Topic: ${topic}
Difficulty: ${difficulty} (candidate is a fresher)

${reference}Question: ${question}
Candidate's answer: ${trimmed}

Evaluate the answer and respond ONLY with JSON in this exact shape:
{
  "score": <integer 0-10>,
  "feedback": "<2-3 sentences, direct and specific>",
  "strengths": ["..."],
  "improvements": ["..."]
}
Scoring: 0-3 wrong/irrelevant, 4-6 partially correct, 7-8 good, 9-10 excellent and complete.
If reference notes are given, judge the answer against them, but do not mention the notes themselves in your feedback.
`;

  const text = await askGemini(prompt);
  const clean = text.replace(/```json|```/g, "").trim();
  const data = JSON.parse(clean);

  return {
    score: Math.max(0, Math.min(10, Math.round(Number(data.score) || 0))),
    feedback: data.feedback || "",
    strengths: Array.isArray(data.strengths) ? data.strengths : [],
    improvements: Array.isArray(data.improvements) ? data.improvements : [],
  };
};

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
