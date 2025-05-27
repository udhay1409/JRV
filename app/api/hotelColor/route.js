import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import HotelColor from "../../../utils/model/HotelColor";
import { NextResponse } from "next/server";
import { getModel } from "../../../utils/helpers/getModel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const { hotelData } = await getHotelDatabase();
    const ColorModel = getModel("HotelColor", HotelColor);

    let colorData = await ColorModel.findOne({ hotelId: hotelData._id });

    if (!colorData) {
      colorData = await ColorModel.create({
        hotelId: hotelData._id,
        color: "#FFC933",
      });
    }

    return NextResponse.json({ success: true, color: colorData.color });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Error fetching color", error: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { color } = await request.json();
    const { hotelData } = await getHotelDatabase();
    const ColorModel = getModel("HotelColor", HotelColor);

    if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
      return NextResponse.json(
        { success: false, message: "Invalid color format" },
        { status: 400 }
      );
    }

    const updatedColor = await ColorModel.findOneAndUpdate(
      { hotelId: hotelData._id },
      { $set: { color } },
      { new: true, upsert: true }
    );

    return NextResponse.json({
      success: true,
      color: updatedColor.color,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, message: "Error updating color", error: err.message },
      { status: 500 }
    );
  }
}
