import mongoose from "mongoose";
import "@/models/category"; 
import "@/models/upload";
import "@/models/user";
import "@/models/rateLimit";
import "@/models/list";

const connection: { isConnected?: number } = {};

async function dbConnect() {
  // If already connected, use the existing connection
  if (connection.isConnected) {
    console.log('Using existing database connection');
    return;
  }

  // Ensure the MongoDB URI is available
  const mongoURI = process.env.MONGODB_URI;
  if (!mongoURI) {
    throw new Error("MONGODB_URI environment variable is not defined.");
  }

  try {
    // Establish a new database connection
    const db = await mongoose.connect(mongoURI);
    connection.isConnected = db.connections[0].readyState;
    console.log("MongoDB connected successfully:", connection.isConnected);
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    throw new Error("Failed to connect to MongoDB.");
  }
}

export default dbConnect;
