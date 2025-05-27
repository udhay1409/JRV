import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import { getModel } from "../../../../../utils/helpers/getModel";
import TransactionSchema from "../../../../../utils/model/financials/transactions/transactionSchema";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const customerName = searchParams.get("customerName");

    if (!customerName) {
      return NextResponse.json(
        { success: false, message: "Customer name is required" },
        { status: 400 }
      );
    }

    await getHotelDatabase();
    const Transaction = getModel("Transaction", TransactionSchema);

    // Search transactions by customer name
    const regex = new RegExp(customerName, "i");
    const transactions = await Transaction.find({
      customerName: { $regex: regex },
    }).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      transactions: transactions,
    });
  } catch (error) {
    console.error("Error searching transactions:", error);
    return NextResponse.json(
      {
        success: false,
        message:
          error.message || "An error occurred while searching transactions",
      },
      { status: 500 }
    );
  }
}
