import mongoose from "mongoose";

const complementaryItemSchema = new mongoose.Schema({
  roomCategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subCategory: {
    type: String,
    required: true
  },
  brandName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  lastInventoryUpdate: {
    type: Date,
    default: null
  },
  inventoryUpdateStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', null],
    default: null
  }
}, { timestamps: true });

const complementarySettingsSchema = new mongoose.Schema({
  items: [complementaryItemSchema]
}, { timestamps: true });

export default complementarySettingsSchema;

