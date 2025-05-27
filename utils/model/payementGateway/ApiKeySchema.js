import { Schema } from "mongoose";
const ApiKeySchema = new Schema(
  {
    apiKey: {
      type: String,
      required: [true, "API key is required"],
      unique: true,
      trim: true,
    },
    secretKey: {
      type: String,
      required: [true, "Secret key is required"],
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export default ApiKeySchema;
