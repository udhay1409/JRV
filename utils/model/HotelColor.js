import { Schema } from "mongoose";

const HotelColorSchema = new Schema(
  {
    hotelId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    color: {
      type: String,
      required: true,
      default: '#00569B',
      validate: {
        validator: function(v) {
          return /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Color must be a valid hex color code'
      }
    }
  },
  { timestamps: true }
);

export default HotelColorSchema;
