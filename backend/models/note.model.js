import mongoose from "mongoose";

const noteSchema = new mongoose.Schema({
  topic: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  embedding: { type: [Number], required: true },
});

export default mongoose.model("note", noteSchema);