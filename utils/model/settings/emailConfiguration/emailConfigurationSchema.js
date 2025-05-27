import mongoose from "mongoose";

const emailConfigurationSchema = new mongoose.Schema({
  smtpPort: { type: String, required: true },
  smtpUsername: { type: String, required: true },
  smtpPassword: { type: String, required: true },
  senderEmail: { type: String, required: true },
  smtpHost: { type: String, required: true, default: "smtp.gmail.com" },
  updatedAt: { type: Date, default: Date.now }
});

export default emailConfigurationSchema;
