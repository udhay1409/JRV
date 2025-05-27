import mongoose from "mongoose";

// Schema for individual booking records
const BookingRecordSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["booked", "checkin", "checkout", "cancelled", "maintenance"],
      default: "booked",
    },
    guests: {
      adults: {
        type: Number,
        default: 0,
      },
      children: {
        type: Number,
        default: 0,
      },
    },
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    statusTimestamps: {
      booked: Date,
      checkin: Date,
      checkout: Date,
      cancelled: Date,
      maintenance: Date,
    },
  },
  { timestamps: true }
);

// Main schema for room availability
const RoomAvailabilitySchema = new mongoose.Schema(
  {
    roomId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
    },
    roomType: {
      type: String,
      required: true,
    },
    roomNumber: {
      type: String,
      required: true,
    },
    bookingHistory: [BookingRecordSchema],
  },
  { timestamps: true }
);

// Creating a compound index for efficient lookups
RoomAvailabilitySchema.index({ roomId: 1, roomNumber: 1 }, { unique: true });

export default RoomAvailabilitySchema;
