import mongoose from "mongoose";

const PolicySchema = new mongoose.Schema(
  {
    termsAndConditions: { type: String, required: true },
    paymentPolicy: { type: String, required: true },
    privacyPolicy: { type: String, required: true },
  },
  { timestamps: true }
);

export default PolicySchema;
