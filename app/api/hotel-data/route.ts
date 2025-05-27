

import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ success: false, message: "Email is required" }, { status: 400 });
  }

  try {
    const { hotelData } = await getHotelDatabase();

    if (hotelData.emailId !== email) {
      return NextResponse.json({ success: false, message: "Hotel not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      hotelId: hotelData._id.toString(),
      hotelName: hotelData.hotelName
    });

  } catch (error) {
    console.error("Error fetching hotel data:", error);
    return NextResponse.json({ success: false, message: "An unexpected error occurred" }, { status: 500 });
  }
}