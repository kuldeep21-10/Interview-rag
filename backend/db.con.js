import mongoose from "mongoose";

const DB_NAME = "mockinterview";

const db_connect = async () => {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    throw new Error(" mongo uri is missing");
  }

  try {
    const connection = await mongoose.connect(uri, { dbName: DB_NAME });
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    throw error;
  }
};

export { db_connect };
