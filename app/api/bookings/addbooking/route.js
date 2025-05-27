import { NextResponse } from "next/server";
import Guest from "../../../../utils/model/booking/bookingSchema";
import Room from "../../../../utils/model/room/roomSchema";
import ApiKeySchema from "../../../../utils/model/payementGateway/ApiKeySchema";
import GuestInfo from "../../../../utils/model/contacts/guestInfoListSchema";
import TransactionSchema from "../../../../utils/model/financials/transactions/transactionSchema";
import RoomAvailabilitySchema from "../../../../utils/model/room/roomAvailabilitySchema";

import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import { getUniqueGuestId } from "../../../../utils/helpers/guestIdGenerator";

import fs from "fs/promises";
import path from "path";
import Razorpay from "razorpay";
import { sendBookingConfirmationEmail } from "../../../../lib/bookingMail";

async function generateBookingNumber(GuestModel) {
  const currentDate = new Date();
  const datePrefix = currentDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "");

  // Find the highest booking number for today
  const latestBooking = await GuestModel.findOne(
    { bookingNumber: new RegExp(`^B-${datePrefix}`) },
    { bookingNumber: 1 },
    { sort: { bookingNumber: -1 } }
  );

  let sequentialNumber = 1;
  if (latestBooking) {
    const latestSequentialNumber = parseInt(
      latestBooking.bookingNumber.slice(-4)
    );
    sequentialNumber = latestSequentialNumber + 1;
  }

  return `B-${datePrefix}-${sequentialNumber.toString().padStart(4, "0")}`;
}

// Update room availability history directly using the model
async function updateRoomAvailabilityHistory(room, booking) {
  try {
    if (!room || !booking) {
      console.warn("Missing room or booking data for availability update");
      return;
    }

    // Ensure room has valid ID
    if (!room._id) {
      console.warn("Room ID is missing for availability update");
      return;
    }

    // Get the RoomAvailability model
    const RoomAvailability = getModel(
      "RoomAvailability",
      RoomAvailabilitySchema
    );

    // Find or create a room availability record
    let roomAvailability = await RoomAvailability.findOne({
      roomId: room._id.toString(),
      roomNumber: room.number || "",
    });

    if (!roomAvailability) {
      roomAvailability = new RoomAvailability({
        roomId: room._id.toString(),
        roomType: room.type || "",
        roomNumber: room.number || "",
        bookingHistory: [],
      });
    }

    // Create the booking record
    const bookingRecord = {
      bookingNumber: booking.bookingNumber,
      checkIn: new Date(booking.checkInDate),
      checkOut: new Date(booking.checkOutDate),
      status: booking.status || "booked",
      guests: booking.guests || { adults: 0, children: 0 },
      customerName:
        booking.firstName && booking.lastName
          ? `${booking.firstName} ${booking.lastName}`
          : "Guest",
      customerEmail: booking.email || "",
      customerPhone: booking.mobileNo || "",
      statusTimestamps: {
        [booking.status || "booked"]: new Date(),
      },
    };

    // Check if this booking number already exists
    const existingBookingIndex = roomAvailability.bookingHistory.findIndex(
      (historyBooking) => historyBooking.bookingNumber === booking.bookingNumber
    );

    if (existingBookingIndex !== -1) {
      // Update the existing booking
      const existingBooking =
        roomAvailability.bookingHistory[existingBookingIndex];
      existingBooking.status = booking.status || "booked";
      existingBooking.statusTimestamps[booking.status || "booked"] = new Date();

      // Only update check-in/out dates if different
      if (
        booking.checkInDate &&
        booking.checkInDate.toString() !== existingBooking.checkIn.toString()
      ) {
        existingBooking.checkIn = new Date(booking.checkInDate);
      }
      if (
        booking.checkOutDate &&
        booking.checkOutDate.toString() !== existingBooking.checkOut.toString()
      ) {
        existingBooking.checkOut = new Date(booking.checkOutDate);
      }
    } else {
      // Add new booking record
      roomAvailability.bookingHistory.push(bookingRecord);
    }

    await roomAvailability.save();
    console.log("Room availability history updated successfully");
  } catch (error) {
    console.error("Error updating room availability history:", error.message);
  }
}

export async function POST(request) {
  try {
    const { hotelData } = await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);
    const RoomModel = getModel("Room", Room);
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    const Transaction = getModel("Transaction", TransactionSchema);
    let emailSent = false;

    const formData = await request.formData();
    const totalAmount = JSON.parse(formData.get("totalAmount"));
    if (!totalAmount || !totalAmount.total) {
      return NextResponse.json(
        { error: "Invalid total amount" },
        { status: 400 }
      );
    }

    // Round all monetary values in totalAmount
    totalAmount.roomCharge = Math.round(totalAmount.roomCharge || 0);
    totalAmount.taxes = Math.round(totalAmount.taxes || 0);
    totalAmount.additionalGuestCharge = Math.round(
      totalAmount.additionalGuestCharge || 0
    );
    totalAmount.servicesCharge = Math.round(totalAmount.servicesCharge || 0);
    totalAmount.discount = Math.round(totalAmount.discount || 0);
    totalAmount.discountAmount = Math.round(totalAmount.discountAmount || 0);
    totalAmount.total = Math.round(totalAmount.total || 0);

    // Generate booking number
    const bookingNumber = await generateBookingNumber(GuestModel);

    const paymentMethod = formData.get("paymentMethod");
    const paymentStatus = formData.get("paymentStatus");

    let apiKey, secretKey;

    // Only check for Razorpay keys if payment method is not COD
    if (paymentMethod !== "cod") {
      const keys = await ApiKeys.findOne().maxTimeMS(5000);
      apiKey = keys?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_API_KEY;
      secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;

      if (!apiKey || !secretKey) {
        return NextResponse.json(
          { error: "Razorpay keys not found" },
          { status: 404 }
        );
      }
    }

    // Only proceed if the payment is completed or it's a COD booking
    if (paymentStatus !== "completed" && paymentMethod !== "cod") {
      return NextResponse.json(
        { success: false, message: "Invalid payment status" },
        { status: 400 }
      );
    }

    const status = await "booked";
    // Extract all form fields
    const guestData = {
      bookingNumber: bookingNumber,
      status: status,
      statusTimestamps: {
        booked: new Date(),
      },
      propertyType: formData.get("propertyType") || "room",
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      mobileNo: formData.get("mobileNo"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth")
        ? new Date(formData.get("dateOfBirth"))
        : null,
      nationality: formData.get("nationality"),
      address: formData.get("address"),
      checkInDate: new Date(formData.get("checkInDate")),
      checkOutDate: new Date(formData.get("checkOutDate")),
      numberOfRooms: parseInt(formData.get("numberOfRooms")),
      guests: JSON.parse(formData.get("guests")),
      clientRequests: formData.get("clientRequests"),
      notes: formData.get("notes"),
      verificationType: formData.get("verificationType"),
      verificationId: formData.get("verificationId"),
      paymentMethod: paymentMethod,
      paymentStatus: paymentStatus,
      totalAmount: {
        roomCharge: totalAmount.roomCharge || 0,
        taxes: totalAmount.taxes || 0,
        additionalGuestCharge: totalAmount.additionalGuestCharge || 0,
        servicesCharge: totalAmount.servicesCharge || 0,
        discount: totalAmount.discount || 0,
        discountAmount: totalAmount.discountAmount || 0,
        total: totalAmount.total || 0,
      },
    };

    // Add hall-specific fields if property type is hall
    if (formData.get("propertyType") === "hall") {
      // Groom details
      if (formData.get("groomName")) {
        guestData.groomDetails = {
          name: formData.get("groomName"),
          mobileNo: formData.get("groomMobileNo"),
          email: formData.get("groomEmail"),
          address: formData.get("groomAddress"),
          dob: formData.get("groomDob"),
          gender: formData.get("groomGender"),
          verificationId: formData.get("groomVerificationId"),
        };
      }

      // Bride details
      if (formData.get("brideName")) {
        guestData.brideDetails = {
          name: formData.get("brideName"),
          mobileNo: formData.get("brideMobileNo"),
          email: formData.get("brideEmail"),
          address: formData.get("brideAddress"),
          dob: formData.get("brideDob"),
          gender: formData.get("brideGender"),
          verificationId: formData.get("brideVerificationId"),
        };
      }

      // Event details
      guestData.eventType = formData.get("eventType");

      // Time slot details
      if (formData.get("timeSlotName")) {
        guestData.timeSlot = {
          name: formData.get("timeSlotName"),
          fromTime: formData.get("timeSlotFromTime"),
          toTime: formData.get("timeSlotToTime"),
        };
      }

      // Services details
      if (formData.get("services")) {
        guestData.selectedServices = JSON.parse(formData.get("services"));
      }
    }

    if (guestData.paymentMethod === "online") {
      guestData.razorpayOrderId = formData.get("razorpayOrderId");
      guestData.razorpayPaymentId = formData.get("razorpayPaymentId");
      guestData.razorpaySignature = formData.get("razorpaySignature");
      guestData.razorpayAmount = parseFloat(formData.get("razorpayAmount"));
      guestData.razorpayCurrency = formData.get("razorpayCurrency");
    } else if (
      paymentMethod === "paymentLink" &&
      paymentStatus === "completed"
    ) {
      guestData.razorpayPaymentLinkId = formData.get("razorpayPaymentLinkId");

      // Verify payment status one more time before saving
      const razorpay = new Razorpay({
        key_id: apiKey,
        key_secret: secretKey,
      });
      const paymentLink = await razorpay.paymentLink.fetch(
        guestData.razorpayPaymentLinkId
      );
      if (paymentLink.status !== "paid") {
        return NextResponse.json(
          { success: false, message: "Payment not completed" },
          { status: 400 }
        );
      }
    } else if (guestData.paymentMethod === "qr") {
      guestData.razorpayQrCodeId = formData.get("razorpayQrCodeId");
      guestData.razorpayAmount = parseFloat(formData.get("razorpayAmount"));
      guestData.razorpayCurrency = formData.get("razorpayCurrency");
    }
    guestData.guests.adults = Number.isNaN(guestData.guests.adults)
      ? 0
      : guestData.guests.adults;
    guestData.guests.children = Number.isNaN(guestData.guests.children)
      ? 0
      : guestData.guests.children;

    // Validate required fields
    const requiredFields = [
      "bookingNumber",
      "firstName",
      "lastName",
      "email",
      "checkInDate",
      "checkOutDate",
      "paymentMethod",
      "paymentStatus",
    ];
    for (const field of requiredFields) {
      if (!guestData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Parse rooms data
    const roomsData = JSON.parse(formData.get("rooms"));
    guestData.rooms = roomsData.map((room) => ({
      type: room.type,
      number: room.number,
      price: Math.round(parseFloat(room.price)),
      igst: Math.round(parseFloat(room.igst)),
      additionalGuestCharge: Math.round(
        parseFloat(room.additionalGuestCharge) || 0
      ),
      totalAmount: Math.round(parseFloat(room.totalAmount)),
      mainImage: room.mainImage,
      _id: room._id,
    }));

    // Validate rooms data
    if (!guestData.rooms.length) {
      throw new Error("At least one room must be selected");
    }

    // Handle room numbers
    const roomNumbers = formData.get("roomNumbers");
    if (roomNumbers) {
      guestData.roomNumbers = roomNumbers.split(",");
    }

    // Handle file uploads
    const uploadedFiles = formData.getAll("uploadedFiles");
    guestData.uploadedFiles = [];

    for (const file of uploadedFiles) {
      if (!file.name) continue;

      // Check file type and size
      const allowedTypes = ["image/jpeg", "image/png", "application/pdf"];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          `Invalid file type: ${
            file.type
          }. Allowed types are: ${allowedTypes.join(", ")}`
        );
      }

      if (file.size > maxSize) {
        throw new Error(`File size exceeds the maximum allowed size of 5MB`);
      }

      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "bookings",
        "guest_files"
      );
      await fs.mkdir(uploadsDir, { recursive: true });

      const filePath = path.join(uploadsDir, file.name);
      await fs.writeFile(filePath, Buffer.from(await file.arrayBuffer()));

      guestData.uploadedFiles.push({
        fileName: file.name,
        filePath: `/assets/images/bookings/guest_files/${file.name}`,
        uploadDate: new Date(),
      });
    }

    // Check for existing guest info
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);
    const existingGuest = await GuestInfoModel.findOne({
      $or: [
        { email: formData.get("email") },
        { mobileNo: formData.get("mobileNo") },
      ],
    });

    // Get or generate guest ID
    const guestId = await getUniqueGuestId({
      email: formData.get("email"),
      mobileNo: formData.get("mobileNo"),
      previousEmail: existingGuest?.email,
      previousMobile: existingGuest?.mobileNo,
      updateBookings: false, // Don't update existing bookings
    });

    // Add guest ID to booking data
    guestData.guestId = guestId;

    // Use the provided contact info for this specific booking
    guestData.email = formData.get("email");
    guestData.mobileNo = formData.get("mobileNo");

    // Update or create GuestInfo
    const guestInfoData = {
      guestId,
      name: `${formData.get("firstName")} ${formData.get("lastName")}`,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      email: formData.get("email"),
      mobileNo: formData.get("mobileNo"),
      address: formData.get("address"),
      dateOfBirth: formData.get("dateOfBirth"),
      gender: formData.get("gender"),
      nationality: formData.get("nationality"),
      verificationType: formData.get("verificationType"),
      verificationId: formData.get("verificationId"),
      uploadedFiles: guestData.uploadedFiles || [],
    };

    await GuestInfoModel.findOneAndUpdate(
      { guestId },
      {
        $set: guestInfoData,
        $setOnInsert: {
          totalVisits: 0,
          totalAmountSpent: 0,
        },
      },
      { upsert: true, new: true }
    );

    // Find transaction (if it exists) to check payment status
    const transaction = await Transaction.findOne({
      bookingNumber: guestData.bookingNumber,
    });

    // Set payment status based on transaction isFullyPaid status
    if (transaction) {
      guestData.paymentStatus = transaction.isFullyPaid
        ? "completed"
        : "pending";
    }

    // Create and save the new guest booking
    const newGuest = new GuestModel(guestData);
    await newGuest.save();

    // Log the created guest object to check hall-specific fields
    if (guestData.propertyType === "hall") {
      console.log("Created hall booking with fields:", {
        propertyType: newGuest.propertyType,
        eventType: newGuest.eventType,
        timeSlot: newGuest.timeSlot,
        groomDetails: newGuest.groomDetails,
        brideDetails: newGuest.brideDetails,
        selectedServices: newGuest.selectedServices,
      });
    }

    // Update room availability and bookeddates
    for (const room of guestData.rooms) {
      const roomDoc = await RoomModel.findById(room._id);
      if (roomDoc) {
        // Check if we're dealing with a room or a hall
        const propertyNumbers =
          guestData.propertyType === "hall"
            ? roomDoc.hallNumbers
            : roomDoc.roomNumbers;

        // Check if the property numbers array exists
        if (!propertyNumbers) {
          console.warn(
            `No ${
              guestData.propertyType === "hall" ? "hallNumbers" : "roomNumbers"
            } found for room type ${room.type}`
          );
          continue;
        }

        const propertyNumberIndex = propertyNumbers.findIndex(
          (r) => r.number === room.number
        );

        if (propertyNumberIndex !== -1) {
          propertyNumbers[propertyNumberIndex].bookeddates.push({
            bookingNumber: guestData.bookingNumber,
            checkIn: guestData.checkInDate,
            checkOut: guestData.checkOutDate,
            status: "booked",
            guests: guestData.guests,
          });
          await roomDoc.save();

          // Also update the room availability history with the current status
          await updateRoomAvailabilityHistory(
            {
              _id: roomDoc._id,
              type: roomDoc.type,
              number: propertyNumbers[propertyNumberIndex].number,
            },
            newGuest
          );
        } else {
          console.warn(
            `Room or hall number ${room.number} not found in the database`
          );
        }
      } else {
        console.warn(`Room with ID ${room._id} not found in the database`);
      }
    }
    try {
      const hotelName = hotelData?.hotelName;

      // Create a safe address string handling missing fields
      const addressParts = [];
      if (hotelData?.doorNo) addressParts.push(hotelData.doorNo);
      if (hotelData?.streetName) addressParts.push(hotelData.streetName);
      if (hotelData?.district) addressParts.push(hotelData.district);

      const hotelAddress =
        addressParts.length > 0
          ? addressParts.join(", ")
          : "Address not available";

      // Add null checks for all hotel properties
      const hotelDetails = {
        hotelName: hotelName,
        hotelDisplayName: hotelName,
        hotelAddress: hotelAddress,
        hotelPhone: hotelData?.mobileNo || "Contact number not available",
        hotelEmail: hotelData?.emailId || "Email not available",
        hotelWebsite: hotelData?.website || "",
      };

      emailSent = await sendBookingConfirmationEmail({
        to: formData.get("email"),
        name: `${formData.get("firstName")} ${formData.get("lastName")}`,
        bookingDetails: {
          bookingNumber: guestData.bookingNumber,
          firstName: formData.get("firstName"),
          checkIn: guestData.checkInDate.toLocaleDateString(),
          checkOut: guestData.checkOutDate.toLocaleDateString(),
          numberOfRooms: guestData.numberOfRooms,
          numberOfGuests: guestData.guests.adults + guestData.guests.children,
          roomTypes: guestData.rooms.map((room) => room.type).join(", "),
          roomNumbers: guestData.rooms.map((room) => room.number).join(", "),
          propertyType: guestData.propertyType,
          eventType: guestData.eventType,
          timeSlot: guestData.timeSlot,
          groomDetails: guestData.groomDetails,
          brideDetails: guestData.brideDetails,
          selectedServices: guestData.selectedServices,
          hotelName: hotelName,
          hotelDisplayName: hotelName,
          totalAmount: totalAmount.total,
          discountPercentage: totalAmount.discount,
          discountAmount: totalAmount.discountAmount,
          ...hotelDetails,
        },
      });
    } catch (emailError) {
      console.error("Error sending confirmation email:", emailError);
      // Don't throw the error, just log it
      emailSent = false;
    }

    return new Response(
      JSON.stringify({
        success: true,
        guest: newGuest,
        message: emailSent
          ? "Booking successful and confirmation email sent"
          : "Booking successful but failed to send confirmation email",
        emailSent: emailSent,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing guest booking:", error);
    let statusCode = 500;
    let errorMessage =
      "An unexpected error occurred while processing the booking.";

    if (
      error.message.includes("Missing required field") ||
      error.message.includes("Invalid file type") ||
      error.message.includes("File size exceeds")
    ) {
      statusCode = 400;
      errorMessage = error.message;
    } else if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Validation error: " + error.message;
    } else if (error.name === "MongoError" && error.code === 11000) {
      statusCode = 409;
      errorMessage = "A booking with this number already exists.";
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      }),
      {
        status: statusCode,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
