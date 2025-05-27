import mongoose from "mongoose";

const supplierSchema = new mongoose.Schema({
  name: { type: String, required: true },
  gstNo: String,
  contactPerson: {
    firstName: String,
    lastName: String,
    mobileNo: String,
    landlineNo: String,
    emailId: String
  },
  address: {
    doorNo: String,
    streetName: String,
    pinCode: String,
    district: String,
    state: String,
    country: String
  }
}, { timestamps: true });

const brandSchema = new mongoose.Schema({
  name: { type: String, required: true },
  subCategoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory', required: true }
}, { timestamps: true });

const subCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  brands: [brandSchema]
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  subCategories: [subCategorySchema]
}, { timestamps: true });

const electricityTypeSchema = new mongoose.Schema({
  name: { type: String, required: true }
}, { timestamps: true });

const inventorySettingsSchema = new mongoose.Schema({
  suppliers: [supplierSchema],
  categories: [categorySchema],
  subCategories: [subCategorySchema],
  brands: [brandSchema],
   electricityTypes: { type: [electricityTypeSchema], default: [] }
}, { timestamps: true });

export default inventorySettingsSchema;
