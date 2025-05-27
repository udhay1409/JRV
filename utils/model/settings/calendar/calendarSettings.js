import mongoose from "mongoose"

const CalendarSettingsSchema = new mongoose.Schema({
  occasions: [{
    name: {
      type: String,
      required: true,
    },
    dates: [{
      type: Date,
      required: true,
    }],
    color: {
      type: String,
      required: true,
      default: "#FFB800"
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    }
  }], 
}, { 
  timestamps: true 
})

// Create and export the model
const CalendarSettings = mongoose.models.CalendarSettings || mongoose.model("CalendarSettings", CalendarSettingsSchema)
export { CalendarSettings }