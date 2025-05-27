import { getModel } from "./getModel";
import HotelColor from "../model/HotelColor";

export async function getHotelColor(hotelId) {
  const ColorModel = getModel("HotelColor", HotelColor);
  const colorData = await ColorModel.findOne({ hotelId });
  return colorData?.color || "#00569B";
}

export async function setHotelColor(hotelId, color) {
  const ColorModel = getModel("HotelColor", HotelColor);
  const updatedColor = await ColorModel.findOneAndUpdate(
    { hotelId },
    { $set: { color } },
    { new: true, upsert: true }
  );
  return updatedColor.color;
}
