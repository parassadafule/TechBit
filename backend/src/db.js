import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const mongoUrl = process.env.MONGODB_URL; 

console.log(`MongoDB URL: ${mongoUrl}`);

if (!mongoUrl) {
    console.error('MongoDB URL not found in environment variables.');
    process.exit(1);
}

mongoose.connect(mongoUrl,)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

const db = mongoose.connection;

db.on('connected', () => {
    console.log('Mongoose connected to the database');
});

db.on('disconnected', () => {
    console.log('Mongoose disconnected from the database');
});

db.on('error', (err) => {
    console.error('Mongoose connection error:', err);
});

export { db };
export default db;      
