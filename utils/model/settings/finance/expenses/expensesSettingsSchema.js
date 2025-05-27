import mongoose from "mongoose";

const expensesSettingsSchema = new mongoose.Schema(
  {
    category: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    expense: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
  },
  { timestamps: true }
);

export default expensesSettingsSchema;
