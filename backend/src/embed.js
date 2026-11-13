import { embedText } from "./gemini.js";

const v = await embedText("What is a closure in JavaScript?", "RETRIEVAL_QUERY");
console.log("length:", v.length);
console.log("first 5 numbers:", v.slice(0, 5));