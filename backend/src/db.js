import mongoose from 'mongoose';
 // Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const mongoUrl = `mongodb+srv://tech_bit:tech_bit_pyas@tech-bit.7lpbaie.mongodb.net/techbit`; // Use the environment variable for MongoDB URL   


// Log the URL to check if it is correctly loaded from the environment variable
console.log(`MongoDB URL: ${mongoUrl}`);

if (!mongoUrl) {
    console.error('MongoDB URL not found in environment variables.');
    process.exit(1); // Exit the process if MongoDB URL is not provided
}

// Connect to MongoDB
mongoose.connect(mongoUrl,)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


// Check the connection status
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
