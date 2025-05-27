import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import TransactionSchema from "../../../../utils/model/financials/transactions/transactionSchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const Transaction = getModel("Transaction", TransactionSchema);
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = [
      "bookingId",
      "bookingNumber",
      "paymentMethod",
      "amount",
      "paymentDate",
      "customerName",
      "payableAmount",
    ];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Additional validation based on payment method
    if (
      requestData.paymentMethod === "online" ||
      requestData.paymentMethod === "bank"
    ) {
      if (!requestData.paymentType) {
        return NextResponse.json(
          {
            success: false,
            message: "Payment type is required for online/bank payments",
          },
          { status: 400 }
        );
      }
    } else if (requestData.paymentMethod === "paymentLink") {
      if (!requestData.razorpayPaymentLinkId) {
        return NextResponse.json(
          {
            success: false,
            message:
              "Razorpay payment link ID is required for payment link method",
          },
          { status: 400 }
        );
      }
    }

    // Format payment date
    if (
      requestData.paymentDate &&
      typeof requestData.paymentDate === "string"
    ) {
      requestData.paymentDate = new Date(requestData.paymentDate);
    }

    // Ensure paymentType is a valid enum value for all payment methods
    if (
      ![
        "card",
        "upi",
        "netbanking",
        "cash",
        "bank",
        "paymentLink",
        "",
      ].includes(requestData.paymentType)
    ) {
      // For any payment method, if paymentType is invalid, set it to a safe default
      if (requestData.paymentMethod === "cod") {
        requestData.paymentType = "cash"; // Default to cash for Pay at Hotel
      } else if (requestData.paymentMethod === "online") {
        requestData.paymentType = "bank"; // Default to bank for online
      } else if (requestData.paymentMethod === "paymentLink") {
        requestData.paymentType = "paymentLink"; // Set the payment type to paymentLink
      } else {
        requestData.paymentType = ""; // Default to empty string for others
      }
    }

    // Sanitize other fields
    // Ensure status is a valid enum value
    if (!["pending", "completed", "failed"].includes(requestData.status)) {
      requestData.status = "completed"; // Default to completed for safety
    }

    // Ensure payment method is a valid enum value
    if (
      !["online", "cod", "qr", "paymentLink", "bank"].includes(
        requestData.paymentMethod
      )
    ) {
      console.error("Invalid payment method:", requestData.paymentMethod);
      return NextResponse.json(
        { success: false, message: "Invalid payment method" },
        { status: 400 }
      );
    }

    // Find existing transaction document for this booking or create a new one
    let transaction = await Transaction.findOne({
      bookingId: requestData.bookingId,
    });

    const currentPayment = {
      paymentMethod: requestData.paymentMethod,
      amount: Math.round(parseFloat(requestData.amount) || 0),
      transactionId: requestData.transactionId || "",
      paymentDate: requestData.paymentDate,
      remarks: requestData.remarks || "",
      bank: requestData.bank || "",
      paymentType: requestData.paymentType || "",
      razorpayPaymentLinkId: requestData.razorpayPaymentLinkId || "",
      status: requestData.status || "completed",
    };

    // Calculate if the payment will fully satisfy the booking amount
    const willBeFullyPaid = transaction
      ? transaction.totalPaid + currentPayment.amount >=
        parseFloat(transaction.payableAmount)
      : currentPayment.amount >= parseFloat(requestData.payableAmount);

    if (!transaction) {
      // Create new transaction document
      transaction = new Transaction({
        bookingId: requestData.bookingId,
        bookingNumber: requestData.bookingNumber,
        customerName: requestData.customerName,
        guestId: requestData.guestId || "", // Store guestId if provided
        payableAmount: Math.round(parseFloat(requestData.payableAmount) || 0),
        totalPaid: Math.round(currentPayment.amount),
        remainingBalance: Math.round(
          Math.max(
            0,
            parseFloat(requestData.payableAmount) - currentPayment.amount
          )
        ),
        isFullyPaid:
          currentPayment.amount >= parseFloat(requestData.payableAmount),
        payments: [
          {
            ...currentPayment,
            paymentNumber: 1, // First payment
          },
        ],
      });
    } else {
      // Update existing transaction with new payment
      const totalPaid = Math.round(
        transaction.totalPaid + currentPayment.amount
      );
      const remainingBalance = Math.round(
        Math.max(0, transaction.payableAmount - totalPaid)
      );

      // Update transaction summary
      transaction.totalPaid = totalPaid;
      transaction.remainingBalance = remainingBalance;
      transaction.isFullyPaid = totalPaid >= transaction.payableAmount;

      // Add guestId if it's a full payment and guestId is provided
      if (willBeFullyPaid && requestData.guestId && !transaction.guestId) {
        transaction.guestId = requestData.guestId;
      }

      // Add new payment to the payments array
      transaction.payments.push({
        ...currentPayment,
        paymentNumber: transaction.payments.length + 1, // Increment payment number
      });
    }

    await transaction.save();

    // If the payment completes the booking, update booking status in other systems if needed
    if (willBeFullyPaid) {
      // Any additional logic for completed bookings can go here
    }

    return NextResponse.json(
      {
        success: true,
        transaction,
        paymentSummary: {
          totalPaid: transaction.totalPaid,
          totalPayable: transaction.payableAmount,
          remainingBalance: transaction.remainingBalance,
          isPartialPayment: !transaction.isFullyPaid,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await getHotelDatabase();
    const Transaction = getModel("Transaction", TransactionSchema);
    const { searchParams } = new URL(request.url);

    // Build query based on search params
    const query = {};

    if (searchParams.has("bookingId")) {
      query.bookingId = searchParams.get("bookingId");
    }

    if (searchParams.has("bookingNumber")) {
      query.bookingNumber = searchParams.get("bookingNumber");
    }

    if (searchParams.has("guestId")) {
      query.guestId = searchParams.get("guestId");
    }

    // For payment method or status, we need to search in the payments array
    let paymentQuery = {};
    if (searchParams.has("paymentMethod") || searchParams.has("status")) {
      paymentQuery = {};

      if (searchParams.has("paymentMethod")) {
        paymentQuery["payments.paymentMethod"] =
          searchParams.get("paymentMethod");
      }

      if (searchParams.has("status")) {
        paymentQuery["payments.status"] = searchParams.get("status");
      }
    }

    // Get transactions
    let transactions;
    if (Object.keys(paymentQuery).length > 0) {
      // If we have payment-specific filters
      transactions = await Transaction.find({
        ...query,
        ...paymentQuery,
      }).sort({ createdAt: -1 });
    } else {
      // Regular booking-level query
      transactions = await Transaction.find(query).sort({ createdAt: -1 });
    }

    // If we're querying by booking, return payment summary
    if (query.bookingId || query.bookingNumber) {
      if (transactions.length > 0) {
        const transaction = transactions[0];
        return NextResponse.json(
          {
            success: true,
            transactions,
            paymentSummary: {
              totalPaid: transaction.totalPaid,
              totalPayable: transaction.payableAmount,
              remainingBalance: transaction.remainingBalance,
              isFullyPaid: transaction.isFullyPaid,
            },
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ success: true, transactions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
