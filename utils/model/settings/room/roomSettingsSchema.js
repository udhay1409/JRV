import mongoose from "mongoose";

const roomSettingsSchema = new mongoose.Schema(
  {
    propertyTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    eventTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    timeSlots: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        fromTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01]\d|2[0-3]):00$/.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time format. Use HH:00 format.`,
          },
        },
        toTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01]\d|2[0-3]):00$/.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time format. Use HH:00 format.`,
          },
        },
      },
    ],
    specialOfferings: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        startDate: {
          type: Date,
          required: true,
        },
        endDate: {
          type: Date,
          required: true,
        },
        propertyType: {
          type: String,
          required: true,
        },
        discountPercentage: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    services: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        price: {
          type: Number,
          required: true,
          min: 0,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default roomSettingsSchema;
