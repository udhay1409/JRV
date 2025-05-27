import mongoose from "mongoose";

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
