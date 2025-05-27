import mongoose from "mongoose";

const crmSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    mobileno: {
      type: String,
      required: true,
    },
    propertyType: {
      type: String,
      required: true,
    },
    eventType: {
      type: String,
      required: true,
    },
    eventStartDate: {
      type: Date,
      required: true,
    },
    eventEndDate: {
      type: Date,
      required: true,
    },
    notes: {
      type: String,
      default: "",
    },
    movedToBooking: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Crm || mongoose.model("Crm", crmSchema);
