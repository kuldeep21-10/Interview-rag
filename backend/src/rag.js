import { embedText } from "./gemini.js";
import noteModel from "../models/note.model.js";

export const retrieveNotes = async (question, topic, k = 3) => {
  const queryVector = await embedText(question, "RETRIEVAL_QUERY");

  const pipeline = [
    {
      $vectorSearch: {
        index: "notes_vector_index",
        path: "embedding",
        queryVector,
        numCandidates: 50,
        limit: k,
        ...(topic ? { filter: { topic } } : {}),
      },
    },
    {
      $project: {
        _id: 0,
        topic: 1,
        title: 1,
        content: 1,
        score: { $meta: "vectorSearchScore" },
      },
    },
  ];

  return noteModel.aggregate(pipeline);
};