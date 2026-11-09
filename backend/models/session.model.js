import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  question: { type: String, required: true },
  topic: { type: String },
  idealAnswer: { type: String },
  answer: { type: String },
  score: { type: Number, min: 0, max: 10 },
  strengths: [String],
  improvements: [String],
  sources: [
    {
      topic: String,
      title: String,
      _id: false,
    },
  ],
  timeTaken: { type: Number },   // seconds
usedRag: { type: Boolean, default: false },
});

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "user", // tumhare User model ke naam se match hona chahiye
      required: true,
    },
      techStack: {
       type: [{ type: String, enum: ["JS", "Node", "MongoDB", "React", "DBMS", "OS"] }],
       required: true,
       },

    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "completed"],
      default: "active",
    },
    totalScore: { type: Number },
    items: [itemSchema],
    completedAt: { type: Date },
overallFeedback: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("Session", sessionSchema);