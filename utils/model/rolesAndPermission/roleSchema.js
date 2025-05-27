import mongoose from "mongoose";

const permissionSchema = new mongoose.Schema(
  {
    page: { type: String, required: true },
    url: { type: String, required: true },
    actions: {
      view: { type: Boolean, default: false },
      add: { type: Boolean, default: false },
      edit: { type: Boolean, default: false },
      delete: { type: Boolean, default: false },
    },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      required: true,
      trim: true,
    },
    permissions: [permissionSchema],
   
  },
  {
    timestamps: true,
  }
);

// Remove any existing indexes first
roleSchema.indexes().forEach((index) => {
  roleSchema.index(index.fields, { background: true, unique: false });
});

// Add the correct unique compound index
roleSchema.index({ role: 1, }, { unique: true });

// Pre-save middleware to ensure role is not null or empty
roleSchema.pre("save", function (next) {
  if (!this.role || this.role.trim().length === 0) {
    next(new Error("Role name cannot be empty"));
  }
  next();
});

export default roleSchema;
