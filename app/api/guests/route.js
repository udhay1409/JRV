import { NextResponse } from "next/server";
import Guest from "../../../utils/model/booking/bookingSchema";
import GuestInfo from "../../../utils/model/contacts/guestInfoListSchema";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";

export const dynamic = "force-dynamic";

const PUBLIC_FILE_PATH = "/assets/images/guestinfoList/";

export async function GET(request) {
  try {
    await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);

    // Get search params
    const searchParams = new URL(request.url).searchParams;
    const guestId = searchParams.get("guestId");

    if (guestId) {
      // Use findOne with lean() for better performance
      const guestInfo = await GuestInfoModel.findOne({ guestId }).lean();

      if (!guestInfo) {
        return NextResponse.json(
          {
            success: false,
            error: "Guest not found",
            timestamp: new Date().toISOString(),
          },
          { status: 404 }
        );
      }

      // Transform file URLs in the guest info
      if (guestInfo.uploadedFiles) {
        guestInfo.uploadedFiles = guestInfo.uploadedFiles.map((file) => ({
          ...file,
          fileUrl: file.fileUrl ? PUBLIC_FILE_PATH + file.fileName : null,
        }));
      }

      const response = NextResponse.json({
        success: true,
        guest: guestInfo,
        timestamp: new Date().toISOString(),
      });

      // Add cache control headers
      response.headers.set("Cache-Control", "no-store, must-revalidate");
      response.headers.set("Pragma", "no-cache");
      response.headers.set("Expires", "0");

      return response;
    }

    // Get all existing guest info records
    const existingGuests = await GuestInfoModel.find({}).lean();
    const existingGuestMap = new Map(
      existingGuests.map((guest) => {
        // Transform file URLs for each guest
        if (guest.uploadedFiles) {
          guest.uploadedFiles = guest.uploadedFiles.map((file) => ({
            ...file,
            fileUrl: file.fileUrl ? PUBLIC_FILE_PATH + file.fileName : null,
          }));
        }
        return [guest.guestId, guest];
      })
    );

    // Get all bookings
    const bookings = await GuestModel.find({}).lean();

    // Group bookings by guest ID and ensure existing guest info takes precedence
    const guestMap = new Map();

    bookings.forEach((booking) => {
      const key = booking.guestId;
      if (!key) return;

      if (!guestMap.has(key)) {
        const existingGuest = existingGuestMap.get(key);
        if (existingGuest) {
          // Prioritize existing guest info over booking data
          guestMap.set(key, {
            ...existingGuest,
            stayHistory: [],
            totalVisits: 0,
            totalAmountSpent: 0,
            lastStayDate: null,
            // Keep existing guest info data instead of overwriting with booking data
            address: existingGuest.address,
            uploadedFiles: existingGuest.uploadedFiles || [],
            // Only use booking data if existing data is empty
            dateOfBirth: existingGuest.dateOfBirth || booking.dateOfBirth,
            gender: existingGuest.gender || booking.gender,
            nationality: existingGuest.nationality || booking.nationality,
            verificationType:
              existingGuest.verificationType || booking.verificationType,
            verificationId:
              existingGuest.verificationId || booking.verificationId,
          });
        } else {
          // Only use booking contact info for new guests
          const bookingFiles = booking.uploadedFiles || [];
          const transformedFiles = bookingFiles.map((file) => ({
            fileName: file.fileName || "",
            fileType: file.fileType || "",
            fileUrl: PUBLIC_FILE_PATH + file.fileName,
            uploadDate: file.uploadDate || new Date(),
          }));

          guestMap.set(key, {
            guestId: booking.guestId,
            name: `${booking.firstName} ${booking.lastName}`,
            firstName: booking.firstName,
            lastName: booking.lastName,
            mobileNo: booking.mobileNo,
            email: booking.email,
            address: booking.address,
            dateOfBirth: booking.dateOfBirth,
            gender: booking.gender,
            nationality: booking.nationality,
            verificationType: booking.verificationType,
            verificationId: booking.verificationId,
            uploadedFiles: transformedFiles,
            stayHistory: [],
            totalVisits: 0,
            totalAmountSpent: 0,
            lastStayDate: null,
            notes: booking.notes,
          });
        }
      } else {
        // Don't update address and uploadedFiles from booking data
        const currentGuest = guestMap.get(key);
        const updatedGuest = {
          ...currentGuest,
          dateOfBirth: currentGuest.dateOfBirth || booking.dateOfBirth,
          gender: currentGuest.gender || booking.gender,
          nationality: currentGuest.nationality || booking.nationality,
          verificationType:
            currentGuest.verificationType || booking.verificationType,
          verificationId: currentGuest.verificationId || booking.verificationId,
        };
        guestMap.set(key, updatedGuest);
      }

      // Update stay history and totals
      const guest = guestMap.get(key);
      guest.totalVisits++;
      guest.totalAmountSpent += booking.rooms.reduce(
        (sum, room) => sum + (room.totalAmount || 0),
        0
      );

      const checkInDate = new Date(booking.checkInDate);
      if (!guest.lastStayDate || checkInDate > guest.lastStayDate) {
        guest.lastStayDate = checkInDate;
      }

      guest.stayHistory.push({
        bookingId: booking.bookingNumber,
        propertyType: booking.propertyType,
        eventType: booking.eventType,
        checkInDate: booking.checkInDate,
        checkOutDate: booking.checkOutDate,
        roomCategory: booking.rooms[0]?.type || "N/A",
        roomNumber:
          booking.rooms.map((room) => room.number).join(", ") || "N/A",
        numberOfGuest: booking.guests
          ? booking.guests.adults + booking.guests.children
          : 0,
        paymentMethod: booking.paymentMethod || "N/A",
        amount:
          booking.totalAmount?.total ||
          booking.rooms.reduce((sum, room) => sum + (room.totalAmount || 0), 0),
        transactionId:
          booking.razorpayPaymentId || booking.razorpayOrderId || "N/A",
        invoiceNumber: booking.invoiceNumber || "N/A",
      });
    });

    // Update or create guest info records with latest data
    const updatePromises = Array.from(guestMap.values()).map(
      async (guestData) => {
        try {
          // Create a clean update object with only the fields we want to update
          const updateData = {
            $set: {
              stayHistory: guestData.stayHistory,
              totalVisits: guestData.totalVisits,
              totalAmountSpent: guestData.totalAmountSpent,
              lastStayDate: guestData.lastStayDate,
              // Only update these fields if they exist in guestData
              ...(guestData.dateOfBirth && {
                dateOfBirth: guestData.dateOfBirth,
              }),
              ...(guestData.gender && { gender: guestData.gender }),
              ...(guestData.address && { address: guestData.address }),
              ...(guestData.nationality && {
                nationality: guestData.nationality,
              }),
              ...(guestData.verificationType && {
                verificationType: guestData.verificationType,
              }),
              ...(guestData.verificationId && {
                verificationId: guestData.verificationId,
              }),
              ...(guestData.uploadedFiles && {
                uploadedFiles: guestData.uploadedFiles,
              }),
            },
          };

          // Use findOneAndUpdate with runValidators to ensure data integrity
          return GuestInfoModel.findOneAndUpdate(
            { guestId: guestData.guestId },
            updateData,
            {
              new: true,
              upsert: true,
              runValidators: true,
            }
          );
        } catch (error) {
          console.error(`Error updating guest ${guestData.guestId}:`, error);
          throw error;
        }
      }
    );

    await Promise.all(updatePromises);

    // Fetch final guest info records
    const guests = await GuestInfoModel.find({});

    const response = NextResponse.json({
      success: true,
      guests,
      timestamp: new Date().toISOString(),
    });

    // Add cache control headers
    response.headers.set("Cache-Control", "no-store, must-revalidate");
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return response;
  } catch (error) {
    console.error("Error in guests API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
