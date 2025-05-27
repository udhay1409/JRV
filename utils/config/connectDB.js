import mongoose from 'mongoose';

// Add connection event listeners for better debugging
mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

let connection = null;

const connectDb = async () => {
  if (mongoose.connections[0].readyState) {
    console.log("Already connected to database");
    return;
  }

  try {
    const mongoUrl = process.env.MONGODB_URI;
    if (!mongoUrl) {
      throw new Error("MONGODB_URI environment variable is not set");
    }

    // Validate MongoDB connection string format
    if (!mongoUrl.startsWith('mongodb://') && !mongoUrl.startsWith('mongodb+srv://')) {
      throw new Error("Invalid MongoDB connection string format. Must start with 'mongodb://' or 'mongodb+srv://'");
    }

    await mongoose.connect(mongoUrl);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
};

export default connectDb;