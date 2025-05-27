import mongoose from 'mongoose';

const logBookSchema = new mongoose.Schema({
  bookingId: {
    type: String,
    required: true,
    unique: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  mobileNo: {
    type: String,
    required: true,
  },
  propertyType: {
    type: String,
    required: true,
  },
  eventType: {
    type: String,
    required: function() {
      return this.propertyType === 'hall';
    },
  },
  dateRange: {
    from: {
      type: Date,
      required: true,
    },
    to: {
      type: Date,
      required: true,
    },
  },
  checkInTime: {
    type: String,
    required: true,
  },
  notes: {
    type: String,
  },
  itemsIssued: [{
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
    },
  }],
  electricityReadings: [{
    type: {
      type: String,
      required: true,
    },
    startReading: {
      type: Number,
      required: true,
    },
    endReading: {
      type: Number,
      default: 0,
    },
    unitsConsumed: {
      type: Number,
      default: 0,
    },
    unitType: {
      type: String,
      required: true,
    },
    costPerUnit: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
    remarks: {
      type: String,
    },
  }],
  totalAmount: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['Issued', 'Verified'],
    default: 'Issued',
  },
  damageLossSummary: [{
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    brand: {
      type: String,
      required: true,
    },
    model: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
    },
    condition: {
      type: String,
      required: true,
    },
    remarks: {
      type: String,
    },
    amount: {
      type: Number,
    },
  }],
  totalRecoveryAmount: {
    type: Number,
    default: 0,
  },
   grandTotal: {
    type: Number,
    default: 0
  },
}, {
  timestamps: true,
});

// Create index for faster queries
logBookSchema.index({ bookingId: 1 }, { unique: true });
logBookSchema.index({ customerName: 1 });
logBookSchema.index({ dateRange: 1 });
logBookSchema.index({ mobileNo: 1 });

const LogBook = mongoose.models.LogBook || mongoose.model('LogBook', logBookSchema);

export default LogBook;
