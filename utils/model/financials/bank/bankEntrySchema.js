import mongoose from "mongoose";

// Define the bank entry schema
const BankEntrySchema = new mongoose.Schema(
  {
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    transactionType: {
      type: String,
      enum: ["deposit", "withdrawal", "transfer"],
      required: true,
    },
    paymentType: {
      type: String,
      enum: ["bank", "cash", "paymentLink", "card", "upi", "netbanking"],
      required: true,
    },
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
      required: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Bank",
    },
    amount: {
      type: Number,
      required: true,
      get: (v) => Math.round(v),
      set: (v) => Math.round(v),
    },
    description: {
      type: String,
    },
    reference: {
      type: String,
    },
    bookingId: {
      type: String,
    },
    guestId: {
      type: String,
    },
    razorpayPaymentLinkId: {
      type: String,
    },
  },
  { timestamps: true }
);

export default BankEntrySchema;
