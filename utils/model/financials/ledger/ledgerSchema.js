import mongoose from "mongoose";

// Define the ledger entry schema
const LedgerEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    type: {
      type: String,
      enum: ["income", "expenses"],
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    refId: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    debit: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    credit: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    balance: {
      type: Number,
      required: true,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
    },
  },
  { timestamps: true }
);

// Main ledger schema
const LedgerSchema = new mongoose.Schema(
  {
    totalIncome: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    totalExpenses: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    bankBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    netProfit: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    openingBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    closingBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    month: {
      type: Number,
      required: true,
    },
    year: {
      type: Number,
      required: true,
    },
    entries: [LedgerEntrySchema],
  },
  { timestamps: true }
);

export default LedgerSchema;
