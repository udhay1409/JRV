import mongoose, { Schema, model } from 'mongoose';

const heroSectionSchema = new Schema({
  title: {
    type: String,
    required: true
  },
  quote: {
    type: String,
    required: true
  },
  image: {
    type: String,
    required: true
  }
}, { timestamps: true });

const webSettingsSchema = new Schema({
  heroSections: [heroSectionSchema]
}, { timestamps: true });

// Check if model exists before creating a new one
export const WebSettings = mongoose.models.WebSettings || model('WebSettings', webSettingsSchema);

export const getWebSettings = async () => {
  let settings = await WebSettings.findOne();
  if (!settings) {
    settings = await WebSettings.create({
      heroSections: []
    });
  }
  return settings;
};
