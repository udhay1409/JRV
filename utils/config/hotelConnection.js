import { generateUniquePreferenceId } from "../helpers/generatePreferenceId";
import connectDb from "./connectDB";
import SuperAdminHotel from "../model/SuperAdminHotel";
import { DEFAULT_HOTEL_DATA } from "./defaultHotelData";
import { getModel } from "../helpers/getModel";

export async function getHotelDatabase() {
  try {
    const db = await connectDb();
    const HotelModel = getModel("Hotel", SuperAdminHotel);

    let hotel = await HotelModel.findOne();

    if (!hotel) {
      const preferenceId = await generateUniquePreferenceId();
      const defaultData = {
        ...DEFAULT_HOTEL_DATA,
        preferenceId,
        hotelDb: 'default-hotel'
      };

      hotel = await HotelModel.create(defaultData);
    }

    return { 
      db, 
      hotelData: hotel 
    };
  } catch (error) {
    console.error("Database connection error:", error);
    throw error;
  }
}
