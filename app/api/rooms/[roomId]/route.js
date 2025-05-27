import { NextResponse } from "next/server";
import Room from "../../../../utils/model/room/roomSchema";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import fs from "fs/promises";
import path from "path";

export async function GET(request, { params }) {
  const { roomId } = params;

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

    return NextResponse.json({ success: true, room });
  } catch (error) {
    console.error("Error retrieving room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { roomId } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);
    const formData = await request.formData();
    const type = formData.get("type");
    const updateData = {};

    // Common fields
    if (formData.has("name")) updateData.name = formData.get("name");
    if (formData.has("description"))
      updateData.description = formData.get("description");
    if (formData.has("igst")) updateData.igst = formData.get("igst");
    if (formData.has("price"))
      updateData.price = parseFloat(formData.get("price"));
    if (formData.has("size")) updateData.size = formData.get("size");

    // Type-specific fields
    if (type === "hall") {
      if (formData.has("capacity"))
        updateData.capacity = parseInt(formData.get("capacity"));
      if (formData.has("numberOfHalls"))
        updateData.numberOfHalls = parseInt(formData.get("numberOfHalls"));

      // Handle hall numbers update
      if (formData.has("hallNumbers")) {
        const numberOfHalls = parseInt(formData.get("numberOfHalls"));
        const newHallNumbers = JSON.parse(formData.get("hallNumbers"));

        const existingRoom = await RoomModel.findById(roomId);
        if (!existingRoom) {
          return NextResponse.json(
            { success: false, message: "Hall not found" },
            { status: 404 }
          );
        }

        // Create a map of existing hall numbers to their booking data
        const existingBookingsMap = new Map(
          existingRoom.hallNumbers?.map((hall) => [
            hall.number,
            hall.bookeddates,
          ]) || []
        );

        // Merge existing booking data with new hall numbers
        updateData.hallNumbers = newHallNumbers.map((hall) => ({
          number: hall.number,
          bookeddates: existingBookingsMap.get(hall.number) || [],
        }));

        updateData.numberOfHalls = numberOfHalls;
      }
    } else {
      // Existing room-specific fields handling
      if (formData.has("bedModel"))
        updateData.bedModel = formData.get("bedModel");
      if (formData.has("maxGuests"))
        updateData.maxGuests = parseInt(formData.get("maxGuests"));
      if (formData.has("additionalGuestCosts"))
        updateData.additionalGuestCosts = formData.get("additionalGuestCosts");
      if (formData.has("numberOfRooms"))
        updateData.numberOfRooms = parseInt(formData.get("numberOfRooms"));

      // Handle room numbers update (existing code)
      if (formData.has("roomNumbers")) {
        const numberOfRooms = parseInt(formData.get("numberOfRooms"));
        const newRoomNumbers = JSON.parse(formData.get("roomNumbers"));

        // Get existing room to preserve booking data
        const existingRoom = await RoomModel.findById(roomId);
        if (!existingRoom) {
          return NextResponse.json(
            { success: false, message: "Room not found" },
            { status: 404 }
          );
        }

        // Create a map of existing room numbers to their booking data
        const existingBookingsMap = new Map(
          existingRoom.roomNumbers.map((room) => [
            room.number,
            room.bookeddates,
          ])
        );

        // Merge existing booking data with new room numbers
        updateData.roomNumbers = newRoomNumbers.map((room) => ({
          number: room.number,
          bookeddates: existingBookingsMap.get(room.number) || [],
        }));

        updateData.numberOfRooms = numberOfRooms;
      }
    }

    // Update complementary foods handling
    updateData.complementaryFoods = formData.getAll("complementaryFoods");
    // Handle the case when no complementary foods are selected
    if (!formData.has("complementaryFoods")) {
      updateData.complementaryFoods = [];
    }

    if (formData.has("amenities")) {
      updateData.amenities = formData.getAll("amenities").map((amenity) => {
        const [icon, name] = amenity.split("-");
        return { icon, name };
      });
    }

    // Add sanitizeFileName function
    const sanitizeFileName = (originalFileName) => {
      // Split the filename into name and extension
      const [name, extension] = originalFileName.split(/\.(?=[^.]+$)/);
      // Remove all spaces from the name
      const sanitizedName = name.replace(/\s+/g, "");
      return `${sanitizedName}.${extension}`;
    };

    const mainImageFile = formData.get("mainImage");
    const thumbnailFiles = formData.getAll("thumbnailImages");

    let mainImageUrl = null;
    if (mainImageFile && mainImageFile.name) {
      const sanitizedMainImageName = sanitizeFileName(mainImageFile.name);
      const mainImagePath = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "mainimage",
        sanitizedMainImageName
      );
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "mainimage"
      );

      try {
        await fs.access(uploadsDir);
      } catch (error) {
        if (error.code === "ENOENT") {
          await fs.mkdir(uploadsDir, { recursive: true });
        } else {
          throw error;
        }
      }

      await fs.writeFile(
        mainImagePath,
        Buffer.from(await mainImageFile.arrayBuffer())
      );
      mainImageUrl = `/assets/images/rooms/mainimage/${sanitizedMainImageName}`;
    }

    if (mainImageUrl) updateData.mainImage = mainImageUrl;

    const thumbnailImageUrls = [];
    for (const thumbnailFile of thumbnailFiles) {
      if (!thumbnailFile.name) continue;
      const sanitizedThumbnailName = sanitizeFileName(thumbnailFile.name);
      const thumbnailPath = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "thumbnailimages",
        sanitizedThumbnailName
      );
      const thumbnailDir = path.dirname(thumbnailPath);

      try {
        await fs.access(thumbnailDir);
      } catch (error) {
        if (error.code === "ENOENT") {
          await fs.mkdir(thumbnailDir, { recursive: true });
        } else {
          throw error;
        }
      }

      await fs.writeFile(
        thumbnailPath,
        Buffer.from(await thumbnailFile.arrayBuffer())
      );
      thumbnailImageUrls.push(
        `/assets/images/rooms/thumbnailimages/${sanitizedThumbnailName}`
      );
    }

    if (thumbnailImageUrls.length > 0)
      updateData.thumbnailImages = thumbnailImageUrls;

    const room = await RoomModel.findById(roomId);

    if (!room) {
      return NextResponse.json(
        { success: false, message: "Room not found." },
        { status: 404 }
      );
    }

    const roomNumber = formData.get("roomNumber");
    const action = formData.get("action");
    const bookingNumber = formData.get("bookingNumber");

    // Handle booking updates based on room type
    if (action === "clear" && roomNumber && bookingNumber) {
      const isHall = room.type === "hall";
      const numbersArray = isHall ? room.hallNumbers : room.roomNumbers;

      const numberIndex = numbersArray.findIndex(
        (item) => item.number === roomNumber
      );

      if (numberIndex !== -1) {
        // Remove the specific booking from bookeddates array
        numbersArray[numberIndex].bookeddates = numbersArray[
          numberIndex
        ].bookeddates.filter(
          (booking) => booking.bookingNumber !== bookingNumber
        );

        // Update the appropriate array based on type
        const updateField = isHall ? "hallNumbers" : "roomNumbers";
        const updateResult = await RoomModel.findByIdAndUpdate(
          roomId,
          {
            $set: {
              [updateField]: numbersArray,
            },
          },
          { new: true }
        );

        if (!updateResult) {
          return NextResponse.json(
            {
              success: false,
              message: `Failed to update ${
                isHall ? "hall" : "room"
              } booking data`,
            },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          room: updateResult,
          message: "Booking cancelled and availability updated successfully",
        });
      }
    } else {
      // Add new booked dates
      if (bookingNumber && unavailableDates.length === 2) {
        room.roomNumbers[roomNumberIndex].bookeddates.push({
          bookingNumber: bookingNumber,
          checkIn: new Date(unavailableDates[0]),
          checkout: new Date(unavailableDates[1]),
          status: "booked",
        });
      }
    }

    // Update the room with all changes
    const updatedRoom = await RoomModel.findByIdAndUpdate(
      roomId,
      { $set: updateData },
      { new: true }
    );

    if (!updatedRoom) {
      return NextResponse.json(
        { success: false, message: `${type} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        room: updatedRoom,
        message: `${type} Updated Successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  const { roomId } = params;

  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const roomToDelete = await RoomModel.findById(roomId);
    if (!roomToDelete) {
      return NextResponse.json(
        { success: false, message: "Room not found" },
        { status: 404 }
      );
    }

    // Delete image files and room record
    if (roomToDelete.mainImage) {
      const mainImagePath = path.join(
        process.cwd(),
        "public",
        roomToDelete.mainImage
      );
      await fs
        .unlink(mainImagePath)
        .catch((err) => console.error("Error deleting main image:", err));
    }

    if (
      roomToDelete.thumbnailImages &&
      roomToDelete.thumbnailImages.length > 0
    ) {
      for (const thumbnailImage of roomToDelete.thumbnailImages) {
        const thumbnailPath = path.join(
          process.cwd(),
          "public",
          thumbnailImage
        );
        await fs
          .unlink(thumbnailPath)
          .catch((err) =>
            console.error("Error deleting thumbnail image:", err)
          );
      }
    }

    await RoomModel.findByIdAndDelete(roomId);

    return NextResponse.json({
      success: true,
      message: "Room and associated images deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
