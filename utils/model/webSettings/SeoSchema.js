import mongoose from "mongoose";

const seoSchema = new mongoose.Schema({
  metaTitle: String,
  metaDescription: String,
  metaKeywords: String,
}, { timestamps: true });

export const SeoSchema = mongoose.models.Seo || mongoose.model('Seo', seoSchema);
