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
  if (connection) return connection;

  const uri = `${process.env.MONGO_URI}`;
  const cleanUri = uri.replace(/\/$/, "");
  // const fullUri = `${cleanUri}/hoteldemo?retryWrites=true&w=majority`;
  const fullUri = `${cleanUri}/JrvMahal?retryWrites=true&w=majority`;

  try {
    connection = await mongoose.connect(fullUri, {
      tls: true,
      tlsAllowInvalidCertificates: false,
      minPoolSize: 5,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 15000,
    });

    console.log(`Connected to database ${connection.connections[0].name}`);
    return connection;
  } catch (error) {
    console.error("Error connecting to database:", error);
    throw error;
  }
};

export default connectDb;