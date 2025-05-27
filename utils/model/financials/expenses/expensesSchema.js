import mongoose from "mongoose";

const expensesSchema = new mongoose.Schema(
  {
    amount: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    expense: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: "",
    },
    date: {
      type: Date,
      default: Date.now,
    },
    receipt: {
      url: String,
      filename: String,
    },
    paymentType: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
    },
    bank: {
      type: String,
    },
    reference: {
      type: String,
    },
  },
  { timestamps: true }
);

export default expensesSchema;
