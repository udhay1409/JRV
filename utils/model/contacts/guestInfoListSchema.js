import mongoose from "mongoose";

const guestInfoSchema = new mongoose.Schema(
  {
    guestId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    mobileNo: { type: String },
    email: { type: String },
    address: { type: String },
    dateOfBirth: { type: Date },
    gender: { type: String },
    nationality: { type: String },
    verificationType: { type: String },
    verificationId: { type: String },
    uploadedFiles: [
      {
        fileName: String,
        fileUrl: String,
        fileType: String,
        uploadedAt: Date,
        uploadDate: Date,
      },
    ],
    stayHistory: [
      {
        bookingId: { type: String, required: true },
        checkInDate: { type: Date, required: true },
        checkOutDate: { type: Date, required: true },
        propertyType: { type: String, default: "N/A" },
        eventType: { type: String, default: "N/A" },
        roomCategory: { type: String, default: "N/A" },
        roomNumber: { type: String, default: "N/A" },
        numberOfGuest: { type: Number, default: 0 },
        paymentMethod: { type: String, default: "N/A" },
        amount: { type: Number, default: 0 },
        transactionId: { type: String, default: "N/A" },
        invoiceNumber: { type: String, default: "N/A" },
      },
    ],
    totalVisits: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    lastStayDate: { type: Date },
    notes: { type: String },
  },
  { timestamps: true }
);

const GuestInfo =
  mongoose.models.GuestInfo || mongoose.model("GuestInfo", guestInfoSchema);
export default GuestInfo;
