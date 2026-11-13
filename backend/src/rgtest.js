import "dotenv/config";
import mongoose from "mongoose";
import { retrieveNotes } from "./rag.js";

await mongoose.connect(process.env.MONGO_URI, { dbName: "mockinterview" });

const tests = [
  "What is a closure in JavaScript?",
  "What is the difference between a promise and async await?",
  "Why does setTimeout with 0 delay run after a promise?",
];

for (const q of tests) {
  console.log("\nQ:", q);
  const notes = await retrieveNotes(q, "JS", 3);
  notes.forEach((n) => console.log(`  ${n.score.toFixed(3)}  ${n.title}`));
}

await mongoose.disconnect();