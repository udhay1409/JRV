import mongoose from "mongoose";

// Define the payment schema (for individual payments)
const PaymentSchema = new mongoose.Schema(
  {
    paymentMethod: {
      type: String,
      enum: ["online", "cod", "qr", "paymentLink", "bank"],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      get: (v) => Math.round(v), // Store as whole numbers
      set: (v) => Math.round(v), // Store as whole numbers
    },
    transactionId: {
      type: String,
    },
    paymentDate: {
      type: Date,
      required: true,
    },
    remarks: {
      type: String,
    },
    // Fields specific to payment method
    // For online payment
    bank: {
      type: String,
    },
    paymentType: {
      type: String,
      enum: ["card", "upi", "netbanking", "cash", "bank", "paymentLink"],
    },
    // For payment link
    razorpayPaymentLinkId: {
      type: String,
    },
    // Payment status
    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    paymentNumber: {
      type: Number,
    },
  },
  { timestamps: true }
);

// Main transaction schema that holds booking info and payments array
const TransactionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true, // Ensure one document per booking
    },
    bookingNumber: {
      type: String,
      required: true,
      unique: true, // Ensure one document per booking number
    },
    customerName: {
      type: String,
      required: true,
    },
    guestId: {
      type: String,
    },
    payableAmount: {
      type: Number,
      required: true,
      get: (v) => Math.round(v), // Store as whole numbers
      set: (v) => Math.round(v), // Store as whole numbers
    },
    // Track payment status
    totalPaid: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v), // Store as whole numbers
      set: (v) => Math.round(v), // Store as whole numbers
    },
    remainingBalance: {
      type: Number,
      default: 0,
      get: (v) => Math.round(v), // Store as whole numbers
      set: (v) => Math.round(v), // Store as whole numbers
    },
    isFullyPaid: {
      type: Boolean,
      default: false,
    },
    // Array of payments for this booking
    payments: [PaymentSchema],
  },
  { timestamps: true }
);

export default TransactionSchema;
