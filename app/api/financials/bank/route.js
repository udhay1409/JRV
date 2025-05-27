import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import BankSchema from "../../../../utils/model/financials/bank/bankSchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const Bank = getModel("Bank", BankSchema);
    const requestData = await request.json();

    // Validate required fields based on account type
    if (requestData.type === "bank") {
      const requiredFields = ["name", "bankName", "accountNumber", "ifscCode"];
      for (const field of requiredFields) {
        if (!requestData[field]) {
          return NextResponse.json(
            { success: false, message: `Missing required field: ${field}` },
            { status: 400 }
          );
        }
      }
    } else if (requestData.type === "cash") {
      if (!requestData.name) {
        return NextResponse.json(
          { success: false, message: "Missing required field: name" },
          { status: 400 }
        );
      }

      // For cash accounts, explicitly remove bank fields to prevent errors
      requestData.bankName = undefined;
      requestData.accountNumber = undefined;
      requestData.accountHolderName = undefined;
      requestData.branchName = undefined;
      requestData.ifscCode = undefined;
      requestData.accountType = undefined;
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid account type" },
        { status: 400 }
      );
    }

    // Format date
    if (requestData.date && typeof requestData.date === "string") {
      requestData.date = new Date(requestData.date);
    }

    // Set currentBalance equal to openingBalance for new accounts
    if (requestData.openingBalance) {
      requestData.currentBalance = Number(requestData.openingBalance);
    }

    // Create new bank account
    const bankAccount = new Bank(requestData);
    await bankAccount.save();

    return NextResponse.json(
      {
        success: true,
        bankAccount,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bank account:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await getHotelDatabase();
    const Bank = getModel("Bank", BankSchema);
    const { searchParams } = new URL(request.url);

    // Build query based on search params
    const query = {};

    if (searchParams.has("type")) {
      query.type = searchParams.get("type");
    }

    if (searchParams.has("id")) {
      query._id = searchParams.get("id");
    }

    if (searchParams.has("isActive")) {
      query.isActive = searchParams.get("isActive") === "true";
    }

    // Get bank accounts
    const bankAccounts = await Bank.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, bankAccounts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const Bank = getModel("Bank", BankSchema);
    const requestData = await request.json();

    if (!requestData.id) {
      return NextResponse.json(
        { success: false, message: "Missing bank account ID" },
        { status: 400 }
      );
    }

    // Format date
    if (requestData.date && typeof requestData.date === "string") {
      requestData.date = new Date(requestData.date);
    }

    // For cash accounts, remove bank fields
    if (requestData.type === "cash") {
      requestData.bankName = undefined;
      requestData.accountNumber = undefined;
      requestData.accountHolderName = undefined;
      requestData.branchName = undefined;
      requestData.ifscCode = undefined;
      requestData.accountType = undefined;
    }

    // Get the existing account to check if openingBalance has changed
    const existingAccount = await Bank.findById(requestData.id);
    if (existingAccount && requestData.openingBalance !== undefined) {
      // If this is an update to the opening balance, also update the current balance
      // by applying the same difference
      const difference =
        Number(requestData.openingBalance) -
        Number(existingAccount.openingBalance);
      requestData.currentBalance =
        Number(
          existingAccount.currentBalance || existingAccount.openingBalance
        ) + difference;
    }

    // Find and update bank account
    const bankAccount = await Bank.findByIdAndUpdate(
      requestData.id,
      { $set: requestData },
      { new: true }
    );

    if (!bankAccount) {
      return NextResponse.json(
        { success: false, message: "Bank account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        bankAccount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const Bank = getModel("Bank", BankSchema);
    const { searchParams } = new URL(request.url);

    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing bank account ID" },
        { status: 400 }
      );
    }

    // Find and delete bank account (or set to inactive)
    const bankAccount = await Bank.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!bankAccount) {
      return NextResponse.json(
        { success: false, message: "Bank account not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Bank account deactivated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting bank account:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
