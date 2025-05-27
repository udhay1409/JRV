import mongoose from "mongoose";

// Define the bank schema
const BankSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["bank", "cash"],
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    bankName: {
      type: String,
    },
    accountNumber: {
      type: String,
    },
    accountHolderName: {
      type: String,
    },
    branchName: {
      type: String,
    },
    ifscCode: {
      type: String,
    },
    accountType: {
      type: String,
    },
    openingBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    currentBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    date: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default BankSchema;
