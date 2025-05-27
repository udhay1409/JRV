import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  supplierName: { type: String, required: true },
  category: { type: String, required: true },
  subCategory: { type: String, required: true },
  brandName: { type: String, required: true },
  model: { type: String },
  price: { type: Number, required: true },
  gst: { type: Number, required: true },
  quantityInStock: { type: Number, required: true, default: 0 },
  status: { 
    type: String, 
    enum: ['inStock', 'lowStock', 'outOfStock'],
    required: true 
  },
  lowQuantityAlert: { type: Number, required: true },
  description: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Add a pre-save middleware to ensure status is set correctly
inventorySchema.pre('save', function(next) {
  if (this.quantityInStock === 0) {
    this.status = 'outOfStock';
  } else if (this.quantityInStock <= this.lowQuantityAlert) {
    this.status = 'lowStock';
  } else {
    this.status = 'inStock';
  }
  next();
});

export default inventorySchema;
