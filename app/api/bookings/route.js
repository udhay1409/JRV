// app/api/bookings/route.js
import { NextResponse } from "next/server";
import Guest from "../../../utils/model/booking/bookingSchema";
import FinanceSettings from "../../../utils/model/settings/finance/invoice/invoiceSettingsSchema";
import Invoice from "../../../utils/model/financials/invoices/invoiceSchema";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import { getModel } from "../../../utils/helpers/getModel";
import { getUniqueGuestId } from "../../../utils/helpers/guestIdGenerator";
import Transaction from "../../../utils/model/financials/transactions/transactionSchema";
import Room from "../../../utils/model/room/roomSchema";
import RoomAvailability from "../../../utils/model/room/roomAvailabilitySchema";
import { gu } from "date-fns/locale";

// Add export config for static rendering
export const dynamic = "force-dynamic";

// Update getNextInvoiceNumber function
async function getNextInvoiceNumber(FinanceSettingsModel) {
  let settings = await FinanceSettingsModel.findOne({});
  if (!settings) {
    throw new Error("Finance settings not found");
  }

  const activeYear = settings.financialYearHistory.find(
    (year) => year.isActive
  );
  if (!activeYear) {
    throw new Error("No active financial year found");
  }

  // Always increment by 1, starting from 0
  const nextSequence = (activeYear.sequence || 0) + 1;

  // Update both sequences atomically in one operation
  const updatedSettings = await FinanceSettingsModel.findOneAndUpdate(
    {
      _id: settings._id,
      "financialYearHistory._id": activeYear._id,
    },
    {
      $set: {
        "invoiceFormat.sequence": nextSequence,
        "financialYearHistory.$.sequence": nextSequence,
      },
    },
    { new: true }
  );

  if (!updatedSettings) {
    throw new Error("Failed to update sequence numbers");
  }

  return `${settings.invoiceFormat.prefix}/${activeYear.yearFormat}/${nextSequence}`;
}

async function createInvoiceRecord(
  booking,
  hotelData,
  InvoiceModel,
  transaction
) {
  // Ensure booking has invoice number
  if (!booking.invoiceNumber) {
    throw new Error("Invoice number is required");
  }

  const invoiceData = {
    invoiceNumber: booking.invoiceNumber,
    bookingId: booking._id,
    bookingNumber: booking.bookingNumber,
    customerDetails: {
      name: `${booking.firstName} ${booking.lastName}`,
      email: booking.email,
      phone: booking.mobileNo,
      address: booking.address,
      guestId: booking.guestId,
    },
    hotelDetails: {
      name: hotelData.hotelName,
      gstNo: hotelData.gstNo,
      address: `${hotelData.doorNo}, ${hotelData.streetName}, ${hotelData.district}, ${hotelData.state} - ${hotelData.pincode}`,
      email: hotelData.emailId,
      phone: hotelData.mobileNo,
    },
    stayDetails: {
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      numberOfNights: booking.numberOfNights,
      numberOfRooms: booking.numberOfRooms,
      numberOfGuests: booking.guests,
      propertyType: booking.propertyType || "room", // Add property type
      timeSlot: booking.timeSlot || null, // Add time slot for hall bookings
    },
    rooms: booking.rooms.map((room) => ({
      roomNumber: room.number,
      roomType: room.type,
      ratePerNight: room.price,
      additionalGuestCharge: room.additionalGuestCharge || 0,
      taxes: {
        cgst: room.cgst || 0,
        sgst: room.sgst || 0,
        igst: room.igst || 0,
      },
      totalAmount: room.totalAmount,
    })),
    paymentDetails: {
      method: booking.paymentMethod,
      status: booking.paymentStatus,
      razorpayOrderId: booking.razorpayOrderId,
      razorpayPaymentId: booking.razorpayPaymentId,
      razorpayPaymentLinkId: booking.razorpayPaymentLinkId,
      razorpayQrCodeId: booking.razorpayQrCodeId,
    },
    amounts: {
      subtotal: booking.totalAmount.roomCharge || 0,
      totalTax: booking.totalAmount.taxes || 0,
      additionalGuestCharge: booking.totalAmount.additionalGuestCharge || 0,
      servicesCharge: booking.totalAmount.servicesCharge || 0,
      discount: booking.totalAmount.discount || 0,
      discountAmount: booking.totalAmount.discountAmount || 0,
      totalAmount: booking.totalAmount.total || 0,
    },
    status: booking.status,
  };

  // Add selected services if available
  if (booking.selectedServices && booking.selectedServices.length > 0) {
    invoiceData.selectedServices = booking.selectedServices.map((service) => ({
      name: service.name,
      price: service.price,
      quantity: service.quantity || 1,
      totalAmount:
        service.totalAmount || service.price * (service.quantity || 1),
    }));
  }

  // Add hall-specific fields if property type is hall
  if (booking.propertyType === "hall") {
    invoiceData.hallDetails = {
      eventType: booking.eventType || "Not specified",

      groomDetails: booking.groomDetails || null,
      brideDetails: booking.brideDetails || null,
      timeSlot: booking.timeSlot || null,
    };
  }

  // Add transaction data if available
  if (transaction) {
    invoiceData.transactions = {
      totalPaid: transaction.totalPaid,
      payableAmount: transaction.payableAmount,
      isFullyPaid: transaction.isFullyPaid,
      payments: transaction.payments,
    };
  }

  try {
    // Check if invoice already exists
    const existingInvoice = await InvoiceModel.findOne({
      invoiceNumber: booking.invoiceNumber,
    });

    if (!existingInvoice) {
      await InvoiceModel.create(invoiceData);
    }
  } catch (error) {
    console.error("Error creating invoice record:", error);
    throw error;
  }
}

async function updateBookingStatuses(
  GuestModel,
  FinanceSettingsModel,
  hotelData,
  InvoiceModel,
  TransactionModel,
  RoomModel,
  RoomAvailabilityModel
) {
  const now = new Date();
  const bookingsToUpdate = await GuestModel.find({
    status: { $in: ["booked", "checkin"] },
    checkOutDate: { $lt: now },
  });

  const updatePromises = bookingsToUpdate.map(async (booking) => {
    if (booking.status !== "checkout") {
      try {
        // Update booking status to checkout
        const oldStatus = booking.status;
        booking.status = "checkout";

        // Update status timestamp for checkout
        if (!booking.statusTimestamps) {
          booking.statusTimestamps = {};
        }
        booking.statusTimestamps.checkout = new Date();

        await booking.save();

        // Update Room model - remove booking from bookedDates
        for (const room of booking.rooms) {
          try {
            // Find the room in Room model
            const roomData = await RoomModel.findOne({
              $or: [
                { "roomNumbers.number": room.number },
                { "hallNumbers.number": room.number },
              ],
            });

            if (roomData) {
              // Determine if it's a room or hall
              const isHall = roomData.type === "hall";
              const numbersArray = isHall ? "hallNumbers" : "roomNumbers";

              // Find the specific room/hall number index
              const numberIndex = roomData[numbersArray].findIndex(
                (item) => item.number === room.number
              );

              if (numberIndex !== -1) {
                // Filter out this booking from the bookedDates array
                const filteredBookedDates = roomData[numbersArray][
                  numberIndex
                ].bookeddates.filter(
                  (bookedDate) =>
                    bookedDate.bookingNumber !== booking.bookingNumber
                );

                // Update the room with filtered bookeddates
                await RoomModel.updateOne(
                  {
                    _id: roomData._id,
                    [`${numbersArray}.number`]: room.number,
                  },
                  {
                    $set: {
                      [`${numbersArray}.$.bookeddates`]: filteredBookedDates,
                    },
                  }
                );

                console.log(
                  `Auto-checkout: Removed booking ${booking.bookingNumber} from room ${room.number} bookedDates array`
                );
              }
            }

            // Update RoomAvailability model
            const roomAvailability = await RoomAvailabilityModel.findOne({
              roomNumber: room.number,
            });

            if (roomAvailability) {
              // Find booking in the history
              const bookingIndex = roomAvailability.bookingHistory.findIndex(
                (record) => record.bookingNumber === booking.bookingNumber
              );

              if (bookingIndex !== -1) {
                // Update status
                roomAvailability.bookingHistory[bookingIndex].status =
                  "checkout";

                // Set timestamp for checkout
                if (
                  !roomAvailability.bookingHistory[bookingIndex]
                    .statusTimestamps
                ) {
                  roomAvailability.bookingHistory[
                    bookingIndex
                  ].statusTimestamps = {};
                }

                roomAvailability.bookingHistory[
                  bookingIndex
                ].statusTimestamps.checkout = new Date();

                await roomAvailability.save();
                console.log(
                  `Auto-checkout: Updated RoomAvailability status for booking ${booking.bookingNumber}, room ${room.number}`
                );
              }
            }
          } catch (roomError) {
            console.error(
              `Error updating room data for auto-checkout (${room.number}):`,
              roomError
            );
            // Continue with the next room even if this one fails
          }
        }

        // Get transaction data to check payment status
        const transaction = await TransactionModel.findOne({
          bookingId: booking._id.toString(),
        });

        // Only generate invoice number if payment is completed AND isFullyPaid is true
        if (
          booking.paymentStatus === "completed" &&
          !booking.invoiceNumber &&
          transaction &&
          transaction.isFullyPaid
        ) {
          // First generate invoice number
          const invoiceNumber = await getNextInvoiceNumber(
            FinanceSettingsModel
          );
          if (!invoiceNumber) {
            throw new Error("Failed to generate invoice number");
          }

          // Update booking with invoice number
          booking.invoiceNumber = invoiceNumber;
          await booking.save();

          // Then create invoice record
          await createInvoiceRecord(
            {
              ...booking.toObject(),
              invoiceNumber, // Ensure invoiceNumber is passed
            },
            hotelData,
            InvoiceModel,
            transaction // Pass transaction data to the invoice creation
          );
        }
      } catch (error) {
        console.error("Error processing checkout:", error);
        booking.status = "checkout";
        await booking.save();
      }
    }
    return booking;
  });

  await Promise.all(updatePromises);
  return bookingsToUpdate.length;
}

export async function GET(request) {
  try {
    const { hotelData } = await getHotelDatabase();
    const GuestModel = getModel("Guest", Guest);
    const FinanceSettingsModel = getModel("FinanceSettings", FinanceSettings);
    const InvoiceModel = getModel("Invoice", Invoice);
    const TransactionModel = getModel("Transaction", Transaction);
    const RoomModel = getModel("Room", Room);
    const RoomAvailabilityModel = getModel(
      "RoomAvailability",
      RoomAvailability
    );

    // Update booking statuses with invoice generation
    const updatedCount = await updateBookingStatuses(
      GuestModel,
      FinanceSettingsModel,
      hotelData,
      InvoiceModel,
      TransactionModel,
      RoomModel,
      RoomAvailabilityModel
    );

    // Get search params safely
    const searchParams = new URL(request.url).searchParams;
    const query = {
      ...(searchParams.get("bookingNumber") && {
        bookingNumber: searchParams.get("bookingNumber"),
      }),
      ...(searchParams.get("email") && { email: searchParams.get("email") }),
      ...(searchParams.get("checkInDate") && {
        checkInDate: { $gte: new Date(searchParams.get("checkInDate")) },
      }),
      ...(searchParams.get("checkOutDate") && {
        checkOutDate: { $lte: new Date(searchParams.get("checkOutDate")) },
      }),
    };

    // Fetch bookings based on the query
    const bookings = await GuestModel.find(query).lean();

    // Add guest IDs to the bookings with enhanced error handling
    const bookingsWithGuestIds = await Promise.all(
      bookings.map(async (booking) => {
        if (!booking.email && !booking.mobileNo) {
          console.warn(`Booking ${booking.bookingNumber} missing contact info`);
          return { ...booking, guestId: null };
        }

        try {
          const guestId = await getUniqueGuestId({
            email: booking.email,
            mobileNo: booking.mobileNo,
          });
          return { ...booking, guestId };
        } catch (error) {
          console.error(
            `Error adding guest ID for booking ${booking.bookingNumber}:`,
            error
          );
          return { ...booking, guestId: null };
        }
      })
    );

    // Generate invoice numbers for checkout bookings that don't have one
    const updatedBookings = await Promise.all(
      bookingsWithGuestIds.map(async (booking) => {
        // Get transaction data to check payment status
        const transaction = await TransactionModel.findOne({
          bookingId: booking._id.toString(),
        });

        if (
          booking.status === "checkout" &&
          booking.paymentStatus === "completed" &&
          !booking.invoiceNumber &&
          transaction &&
          transaction.isFullyPaid
        ) {
          try {
            // Lock the document while updating
            const updatedBooking = await GuestModel.findOneAndUpdate(
              {
                _id: booking._id,
                invoiceNumber: { $exists: false }, // Only update if no invoice number
                paymentStatus: "completed", // Ensure payment is completed
              },
              {
                $set: {
                  invoiceNumber: await getNextInvoiceNumber(
                    FinanceSettingsModel
                  ),
                },
              },
              { new: true, runValidators: true }
            ).lean();

            if (updatedBooking) {
              await createInvoiceRecord(
                updatedBooking,
                hotelData,
                InvoiceModel,
                transaction // Pass transaction data to the invoice creation
              );
              return updatedBooking;
            }
            return booking;
          } catch (error) {
            console.error("Error generating invoice:", error);
            return booking;
          }
        }
        return booking;
      })
    );

    // Remove sensitive information before sending the response
    const sanitizedBookings = updatedBookings.map((booking) => {
      const { ...sanitizedBooking } = booking;
      return sanitizedBooking;
    });

    return NextResponse.json(
      {
        success: true,
        bookings: sanitizedBookings,
        message: "Bookings retrieved successfully",
        updatedBookings: updatedCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        code: error.code || "UNKNOWN_ERROR",
      },
      { status: error.status || 500 }
    );
  }
}
