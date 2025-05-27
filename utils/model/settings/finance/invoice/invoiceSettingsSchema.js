import mongoose from "mongoose";

const financialYearSchema = new mongoose.Schema({
  startDate: {
    type: Date,
    required: [true, "Start date is required"],
  },
  endDate: {
    type: Date,
    required: [true, "End date is required"],
  },
  sequence: {
    type: Number,
    default: 0, // Changed from 1 to 0
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  yearFormat: {
    type: String,
    required: true,
  }
});

const financeSettingsSchema = new mongoose.Schema(
  {
    financialYear: {
      startDate: {
        type: Date,
        required: [true, "Start date is required"],
      },
      endDate: {
        type: Date,
        required: [true, "End date is required"],
      }
    },
    invoiceFormat: {
      prefix: {
        type: String,
        required: [true, "Invoice prefix is required"],
        validate: {
          validator: function (v) {
            return /^[A-Z]{3}$/.test(v);
          },
          message: (props) =>
            `${props.value} must be exactly 3 uppercase letters!`,
        },
        default: "INV",
      },
      sequence: {
        type: Number,
        default: 0, // Changed from 1 to 0
      },
      financialYear: {
        type: String,
        required: true,
      }
    },
    financialYearHistory: [financialYearSchema],
    color: {
      type: String,
      default: "#00569B",
    },
    logo: {
      url: String,
      publicId: String,
    },
    manualYearControl: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

// Validate financial year dates
financeSettingsSchema.pre('save', function(next) {
  const start = new Date(this.financialYear.startDate);
  const end = new Date(this.financialYear.endDate);
  
  // Ensure dates are whole years apart
  const yearDiff = end.getFullYear() - start.getFullYear();
  if (yearDiff < 1 || start.getTime() >= end.getTime()) {
    next(new Error('Financial year must span at least one full year'));
    return;
  }

  // Ensure dates align with year boundaries
  if (start.getDate() !== 1) {
    next(new Error('Start date must be the first day of a month'));
    return;
  }

  // Update year format
  const startYear = start.getFullYear().toString().slice(-2);
  const endYear = end.getFullYear().toString().slice(-2);
  this.invoiceFormat.financialYear = `${startYear}-${endYear}`;

  // Ensure at least one year is active
  const hasActiveYear = this.financialYearHistory.some(year => year.isActive);
  if (!hasActiveYear && this.financialYearHistory.length > 0) {
    // Set the most recently added year as active
    this.financialYearHistory[this.financialYearHistory.length - 1].isActive = true;
  }

  next();
});

// Update the incrementSequence method
financeSettingsSchema.methods.incrementSequence = async function() {
  const activeYear = this.financialYearHistory.find(year => year.isActive);
  if (!activeYear) {
    throw new Error('No active financial year found');
  }

  // Increment sequence starting from 1
  if (!activeYear.sequence || activeYear.sequence < 1) {
    activeYear.sequence = 1;
  } else {
    activeYear.sequence += 1;
  }

  this.invoiceFormat.sequence = activeYear.sequence;
  await this.save();
  
  return activeYear.sequence;
};

// Update the generateInvoiceNumber method
financeSettingsSchema.methods.generateInvoiceNumber = async function() {
  const activeYear = this.financialYearHistory.find(year => year.isActive);
  if (!activeYear) {
    throw new Error('No active financial year found');
  }
  
  // Always increment by 1, starting from 0
  const nextSequence = (activeYear.sequence || 0) + 1;
  
  // Update sequences
  activeYear.sequence = nextSequence;
  this.invoiceFormat.sequence = nextSequence;
  await this.save();
  
  return `${this.invoiceFormat.prefix}/${activeYear.yearFormat}/${nextSequence}`;
};

// Update getFinancialYearSequence method
financeSettingsSchema.methods.getFinancialYearSequence = function(startDate, endDate) {
  const startYear = startDate.getFullYear().toString().slice(-2);
  const endYear = endDate.getFullYear().toString().slice(-2);
  const yearFormat = `${startYear}-${endYear}`;

  let yearRecord = this.financialYearHistory.find(y => y.yearFormat === yearFormat);
  
  if (!yearRecord) {
    yearRecord = {
      startDate,
      endDate,
      sequence: 0,  // Initialize to 0 so first invoice will be 1
      isActive: false,
      yearFormat
    };
    this.financialYearHistory.push(yearRecord);
  }

  return yearRecord;
};

export default financeSettingsSchema;
