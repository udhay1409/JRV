import { NextResponse } from "next/server";
import Room from "../../../../../../utils/model/room/roomSchema";
import { getHotelDatabase } from "../../../../../../utils/config/hotelConnection";
import { getModel } from "../../../../../../utils/helpers/getModel";

export async function DELETE(request, { params }) {
  const { roomId, number } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const room = await RoomModel.findById(roomId);
    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Determine if we're dealing with a room or hall
    const isHall = room.type === "hall";
    const numbersArray = isHall ? room.hallNumbers : room.roomNumbers;

    // Check if the number exists and has any bookings
    const numberData = numbersArray.find((r) => r.number === number);
    if (!numberData) {
      return NextResponse.json(
        {
          success: false,
          message: `${isHall ? "Hall" : "Room"} number not found`,
        },
        { status: 404 }
      );
    }

    // Check if there are any active bookings
    const hasActiveBookings = numberData.bookeddates.some(
      (booking) =>
        booking.status === "booked" && new Date(booking.checkOut) > new Date()
    );

    if (hasActiveBookings) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot delete ${
            isHall ? "hall" : "room"
          } number with active bookings`,
        },
        { status: 400 }
      );
    }

    // Remove the number
    if (isHall) {
      room.hallNumbers = room.hallNumbers.filter((r) => r.number !== number);
      room.numberOfHalls = room.numberOfHalls - 1;
    } else {
      room.roomNumbers = room.roomNumbers.filter((r) => r.number !== number);
      room.numberOfRooms = room.numberOfRooms - 1;
    }

    // Save the updated room
    await room.save();

    return NextResponse.json({
      success: true,
      message: `${isHall ? "Hall" : "Room"} number deleted successfully`,
      numberOfUnits: isHall ? room.numberOfHalls : room.numberOfRooms,
    });
  } catch (error) {
    console.error("Error deleting number:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
