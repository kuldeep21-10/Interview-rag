import "dotenv/config";
import mongoose from "mongoose";
import { readFile } from "fs/promises";
import { embedText } from "./gemini.js";
import noteModel from "../models/note.model.js";

const run = async () => {
//   await mongoose.connect(process.env.MONGO_URI);
await mongoose.connect(process.env.MONGO_URI, { dbName: "mockinterview" }); 

  const raw = await readFile(
    new URL("../data/notes.json", import.meta.url),
    "utf-8"
  );
  const notes = JSON.parse(raw);

  const docs = [];
  for (const n of notes) {
    const embedding = await embedText(`${n.title}. ${n.content}`, "RETRIEVAL_DOCUMENT");
    docs.push({ ...n, embedding });
    console.log("embedded:", n.title);
  }

  await noteModel.deleteMany({});
  await noteModel.insertMany(docs);
  console.log("saved", docs.length, "notes");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
}); 