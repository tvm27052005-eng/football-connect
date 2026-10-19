import mongoose from 'mongoose';
import { db } from '../models/db.js';
import { seedInitialData } from '../utils/seed.js';

export async function connectDB(): Promise<boolean> {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/football-connect';

  try {
    console.log(`🍃 Attempting connection to MongoDB at: ${mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);

    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000 // 5 seconds timeout
    });

    console.log(`✅ MongoDB Connected Successfully to database "${mongoose.connection.name}"`);

    // Run automatic seeding if database is fresh
    await seedInitialData();

    // Synchronize live memory engine with MongoDB data
    await db.initFromMongoDB();

    return true;
  } catch (error: any) {
    console.warn(`⚠️ Could not connect to MongoDB (${error.message || error}).`);
    console.warn(`💡 Running with fallback in-memory store. To use a real MongoDB database, please set MONGODB_URI in your .env file or start MongoDB locally.`);
    return false;
  }
}
