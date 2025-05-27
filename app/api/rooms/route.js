import { NextResponse } from "next/server";
import Guest from "../../../utils/model/booking/bookingSchema";
import Room from "../../../utils/model/room/roomSchema";
import RoomSettings from "../../../utils/model/settings/room/roomSettingsSchema";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";
import fs from "fs";
import path from "path";

async function updateRoomStatuses(RoomModel, GuestModel) {
  const now = new Date();
  const rooms = await RoomModel.find({});
  let updatedCount = 0;

  // Get all guests with their current status
  const guests = await GuestModel.find({
    status: { $in: ["checkin", "checkout"] },
  });
  const guestBookings = new Map(
    guests.map((guest) => [guest.bookingNumber, guest])
  );

  for (const room of rooms) {
    // Handle room numbers for Room type
    if (room.type === "room" && room.roomNumbers) {
      for (const roomNumber of room.roomNumbers) {
        for (const bookedDate of roomNumber.bookeddates) {
          if (!bookedDate.bookingNumber) continue;

          const guest = guestBookings.get(bookedDate.bookingNumber);
          if (guest) {
            bookedDate.status = guest.status;
            updatedCount++;
          } else if (
            bookedDate.status === "booked" &&
            new Date(bookedDate.checkOut) < now
          ) {
            bookedDate.status = "checkout";
            updatedCount++;
          }
        }
      }
    }

    // Handle hall numbers for Hall type
    if (room.type === "hall" && room.hallNumbers) {
      for (const hallNumber of room.hallNumbers) {
        for (const bookedDate of hallNumber.bookeddates) {
          if (!bookedDate.bookingNumber) continue;

          const guest = guestBookings.get(bookedDate.bookingNumber);
          if (guest) {
            bookedDate.status = guest.status;
            updatedCount++;
          } else if (
            bookedDate.status === "booked" &&
            new Date(bookedDate.checkOut) < now
          ) {
            bookedDate.status = "checkout";
            updatedCount++;
          }
        }
      }
    }

    await room.save();
  }

  return updatedCount;
}

export async function GET() {
  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);
    const GuestModel = getModel("Guest", Guest);
    const RoomSettingsModel = getModel("RoomSettings", RoomSettings);

    // Update room statuses
    const updatedCount = await updateRoomStatuses(RoomModel, GuestModel);

    // Fetch room settings and special offerings
    const roomSettings = await RoomSettingsModel.findOne({});
    const specialOfferings = roomSettings?.specialOfferings || [];

    // Fetch all rooms for this hotel
    const rooms = await RoomModel.find({});

    // Modify this section in the GET function where we handle special offerings
    const roomsWithPricing = rooms.map((room) => {
      // Find all offerings that match this room's type
      const matchingOfferings = specialOfferings
        .filter(
          (offering) =>
            offering.propertyType.toLowerCase() === room.type.toLowerCase()
        )
        .map((offering) => ({
          name: offering.name,
          percentage: offering.discountPercentage,
          startDate: offering.startDate,
          endDate: offering.endDate,
          propertyType: offering.propertyType,
        }));

      // Calculate base pricing
      const pricing = {
        basePrice: room.price,
        propertyTypePricing: {
          [room.type]: matchingOfferings.map((offer) => ({
            originalPrice: room.price,
            discountedPrice: Math.round(
              room.price * (1 - offer.percentage / 100)
            ),
            discount: offer,
          })),
        },
      };

      return {
        ...room.toObject(),
        pricing,
      };
    });

    // Return success response with rooms data
    return new Response(
      JSON.stringify({
        success: true,
        rooms: roomsWithPricing,
        updatedStatusCount: updatedCount,
        roomSettings: {
          checkIn: roomSettings?.checkIn || "14:00",
          checkOut: roomSettings?.checkOut || "12:00",
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const RoomModel = getModel("Room", Room);

    const formData = await request.formData();
    const type = formData.get("type");

    // Common fields for both types
    const newRoomData = {
      name: formData.get("name"),
      description: formData.get("description"),
      igst: formData.get("igst"),
      price: parseFloat(formData.get("price")),
      size: formData.get("size"),
      type: type,
      // ...existing image handling code...
    };

    if (type === "hall") {
      // Hall-specific fields
      newRoomData.capacity = parseInt(formData.get("capacity"));
      newRoomData.hallNumbers = JSON.parse(formData.get("hallNumbers"));
      newRoomData.numberOfHalls = parseInt(formData.get("numberOfHalls"));
    } else {
      // Room-specific fields
      newRoomData.bedModel = formData.get("bedModel");
      newRoomData.maxGuests = parseInt(formData.get("maxGuests"));
      newRoomData.additionalGuestCosts = formData.get("additionalGuestCosts");
      newRoomData.roomNumbers = JSON.parse(formData.get("roomNumbers"));
      newRoomData.numberOfRooms = parseInt(formData.get("numberOfRooms"));
      newRoomData.complementaryFoods = formData.getAll("complementaryFoods");
    }

    // Handle amenities
    newRoomData.amenities = formData.getAll("amenities").map((amenity) => {
      const [icon, name] = amenity.split("-");
      return { icon, name };
    });

    // Function to sanitize filename
    const sanitizeFileName = (originalFileName) => {
      // Split the filename into name and extension.
      const [name, extension] = originalFileName.split(/\.(?=[^.]+$)/);
      // Remove all spaces from the name.
      const sanitizedName = name.replace(/\s+/g, "");

      return `${sanitizedName}.${extension}`;
    };

    // Handle main image
    const mainImageFile = formData.get("mainImage");
    let mainImageUrl = null;
    if (mainImageFile) {
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
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(
        mainImagePath,
        Buffer.from(await mainImageFile.arrayBuffer())
      );
      mainImageUrl = `/assets/images/rooms/mainimage/${sanitizedMainImageName}`;
    }

    // Handle thumbnail images
    const thumbnailFiles = formData.getAll("thumbnailImages");
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
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "rooms",
        "thumbnailimages"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(
        thumbnailPath,
        Buffer.from(await thumbnailFile.arrayBuffer())
      );
      thumbnailImageUrls.push(
        `/assets/images/rooms/thumbnailimages/${sanitizedThumbnailName}`
      );
    }

    const newRoom = new RoomModel({
      ...newRoomData,
      mainImage: mainImageUrl,
      thumbnailImages: thumbnailImageUrls,
    });

    await newRoom.save();

    return NextResponse.json({
      success: true,
      room: newRoom,
      message: `${type} Added Successfully`,
    });
  } catch (error) {
    console.error("Error processing the form data:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
