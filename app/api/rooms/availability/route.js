import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import RoomAvailabilitySchema from "../../../../utils/model/room/roomAvailabilitySchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const RoomAvailability = getModel(
      "RoomAvailability",
      RoomAvailabilitySchema
    );
    const data = await request.json();

    // Validate required fields
    const requiredFields = [
      "roomId",
      "roomType",
      "roomNumber",
      "bookingNumber",
      "checkIn",
      "checkOut",
      "status",
    ];

    for (const field of requiredFields) {
      if (!data[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Find or create a room availability record
    let roomAvailability = await RoomAvailability.findOne({
      roomId: data.roomId,
      roomNumber: data.roomNumber,
    });

    if (!roomAvailability) {
      roomAvailability = new RoomAvailability({
        roomId: data.roomId,
        roomType: data.roomType,
        roomNumber: data.roomNumber,
        bookingHistory: [],
      });
    }

    // Create the booking record
    const bookingRecord = {
      bookingNumber: data.bookingNumber,
      checkIn: new Date(data.checkIn),
      checkOut: new Date(data.checkOut),
      status: data.status,
      guests: data.guests || { adults: 0, children: 0 },
      customerName: data.customerName || "",
      customerEmail: data.customerEmail || "",
      customerPhone: data.customerPhone || "",
      statusTimestamps: {
        [data.status]: new Date(),
      },
    };

    // Check if this booking number already exists
    const existingBookingIndex = roomAvailability.bookingHistory.findIndex(
      (booking) => booking.bookingNumber === data.bookingNumber
    );

    if (existingBookingIndex !== -1) {
      // Update the existing booking
      const existingBooking =
        roomAvailability.bookingHistory[existingBookingIndex];
      existingBooking.status = data.status;
      existingBooking.statusTimestamps[data.status] = new Date();

      // Only update check-in/out dates if provided and different
      if (
        data.checkIn &&
        data.checkIn !== existingBooking.checkIn.toISOString()
      ) {
        existingBooking.checkIn = new Date(data.checkIn);
      }
      if (
        data.checkOut &&
        data.checkOut !== existingBooking.checkOut.toISOString()
      ) {
        existingBooking.checkOut = new Date(data.checkOut);
      }
    } else {
      // Add new booking record
      roomAvailability.bookingHistory.push(bookingRecord);
    }

    await roomAvailability.save();

    return NextResponse.json({
      success: true,
      message: "Room availability updated successfully",
      data: roomAvailability,
    });
  } catch (error) {
    console.error("Error updating room availability:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await getHotelDatabase();
    const RoomAvailability = getModel(
      "RoomAvailability",
      RoomAvailabilitySchema
    );
    const { searchParams } = new URL(request.url);

    // Build query based on search params
    const query = {};

    if (searchParams.has("roomId")) {
      query.roomId = searchParams.get("roomId");
    }

    if (searchParams.has("roomNumber")) {
      query.roomNumber = searchParams.get("roomNumber");
    }

    if (searchParams.has("roomType")) {
      query.roomType = searchParams.get("roomType");
    }

    if (searchParams.has("bookingNumber")) {
      query["bookingHistory.bookingNumber"] = searchParams.get("bookingNumber");
    }

    // Handle date range filtering
    if (searchParams.has("startDate") && searchParams.has("endDate")) {
      const startDate = new Date(searchParams.get("startDate"));
      const endDate = new Date(searchParams.get("endDate"));

      // Find bookings where the checkout date is after startDate
      // and checkin date is before endDate (overlapping date range)
      query["bookingHistory.checkOut"] = { $gte: startDate };
      query["bookingHistory.checkIn"] = { $lte: endDate };
    }

    // Get availability records
    const availabilityRecords = await RoomAvailability.find(query).sort({
      roomType: 1,
      roomNumber: 1,
    });

    return NextResponse.json({
      success: true,
      count: availabilityRecords.length,
      data: availabilityRecords,
    });
  } catch (error) {
    console.error("Error fetching room availability:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const RoomAvailability = getModel(
      "RoomAvailability",
      RoomAvailabilitySchema
    );
    const { searchParams } = new URL(request.url);

    // Get booking number from query
    const bookingNumber = searchParams.get("bookingNumber");
    if (!bookingNumber) {
      return NextResponse.json(
        { success: false, message: "Booking number is required" },
        { status: 400 }
      );
    }

    // Find rooms with this booking number
    const roomsWithBooking = await RoomAvailability.find({
      "bookingHistory.bookingNumber": bookingNumber,
    });

    // If no rooms found with this booking
    if (roomsWithBooking.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No bookings found with this booking number",
        },
        { status: 404 }
      );
    }

    // Update each room to remove the booking or mark it as cancelled
    const action = searchParams.get("action") || "remove";
    const updatePromises = roomsWithBooking.map(async (room) => {
      if (action === "cancel") {
        // Find the booking in the history and update its status
        const bookingIndex = room.bookingHistory.findIndex(
          (b) => b.bookingNumber === bookingNumber
        );

        if (bookingIndex !== -1) {
          room.bookingHistory[bookingIndex].status = "cancelled";
          room.bookingHistory[bookingIndex].statusTimestamps.cancelled =
            new Date();
          return await room.save();
        }
      } else {
        // Remove the booking from history
        room.bookingHistory = room.bookingHistory.filter(
          (b) => b.bookingNumber !== bookingNumber
        );
        return await room.save();
      }
    });

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      message:
        action === "cancel"
          ? "Booking marked as cancelled"
          : "Booking removed from room availability history",
      affectedRooms: roomsWithBooking.length,
    });
  } catch (error) {
    console.error("Error removing booking from room availability:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
