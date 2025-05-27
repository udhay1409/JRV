import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import SuperAdminHotel from "../../../utils/model/SuperAdminHotel";
import { NextResponse } from "next/server";
import { saveFile } from "../../../utils/helpers/fileUpload";
import { getModel } from "../../../utils/helpers/getModel";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Remove allowedMethods export and add method validation in handlers
async function validateMethod(request, allowedMethods) {
  if (!allowedMethods.includes(request.method)) {
    return NextResponse.json(
      { error: `Method ${request.method} Not Allowed` },
      { status: 405 }
    );
  }
  return null;
}

export async function GET(request) {
  const methodError = await validateMethod(request, ["GET"]);
  if (methodError) return methodError;

  try {
    const { hotelData } = await getHotelDatabase();

    // Will always have data since getHotelDatabase creates default if missing
    return NextResponse.json({ success: true, hotelData: hotelData });
  } catch (err) {
    console.error("Error fetching mahal data:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error fetching mahal details",
        error: err.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  const methodError = await validateMethod(request, ["PUT"]);
  if (methodError) return methodError;

  try {
    const updateData = await request.json();
    const { ...cleanUpdateData } = updateData;

    await getHotelDatabase();
    const HotelModel = getModel("Hotel", SuperAdminHotel);

    // Handle logo update
    if (cleanUpdateData.logo && cleanUpdateData.logo.startsWith("data:image")) {
      try {
        const oldHotel = await HotelModel.findOne();
        const newLogoPath = await saveFile(
          cleanUpdateData.logo,
          "hotel",
          oldHotel?.logo
        );
        cleanUpdateData.logo = newLogoPath;
      } catch (error) {
        console.error("Error handling logo:", error);
        throw new Error("Failed to process logo");
      }
    }

    // Update hotel details
    const updatedHotel = await HotelModel.findOneAndUpdate(
      {}, // Empty filter to update first document
      cleanUpdateData,
      { new: true, upsert: true }
    );

    if (!updatedHotel) {
      throw new Error("Failed to update mahal data");
    }

    return NextResponse.json({
      success: true,
      message: "Mahal details updated successfully",
      hotelData: updatedHotel,
    });
  } catch (err) {
    console.error("Error updating mahal data:", err);
    return NextResponse.json(
      {
        success: false,
        message: "Error updating mahal details",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
