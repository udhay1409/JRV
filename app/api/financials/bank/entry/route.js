import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import { getModel } from "../../../../../utils/helpers/getModel";
import BankEntrySchema from "../../../../../utils/model/financials/bank/bankEntrySchema";
import BankSchema from "../../../../../utils/model/financials/bank/bankSchema";
import LedgerSchema from "../../../../../utils/model/financials/ledger/ledgerSchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const BankEntry = getModel("BankEntry", BankEntrySchema);
    const Bank = getModel("Bank", BankSchema);
    const Ledger = getModel("Ledger", LedgerSchema);
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = [
      "transactionType",
      "paymentType",
      "fromAccount",
      "amount",
    ];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // For transfer, toAccount is required
    if (requestData.transactionType === "transfer" && !requestData.toAccount) {
      return NextResponse.json(
        {
          success: false,
          message: "Missing required field: toAccount for transfer",
        },
        { status: 400 }
      );
    }

    // If payment type is paymentLink, razorpayPaymentLinkId is required
    if (
      requestData.paymentType === "paymentLink" &&
      !requestData.razorpayPaymentLinkId
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Razorpay payment link ID is required for payment link type",
        },
        { status: 400 }
      );
    }

    // Remove toAccount if it's empty and transaction is not transfer
    if (requestData.transactionType !== "transfer") {
      requestData.toAccount = undefined;
    }

    // Format date
    if (requestData.date && typeof requestData.date === "string") {
      requestData.date = new Date(requestData.date);
    }

    // Create new bank entry
    const bankEntry = new BankEntry({
      ...requestData,
      razorpayPaymentLinkId: requestData.razorpayPaymentLinkId || undefined,
    });
    await bankEntry.save();

    // Update bank account balances based on transaction type
    const fromAccount = await Bank.findById(requestData.fromAccount);
    if (!fromAccount) {
      return NextResponse.json(
        { success: false, message: "From account not found" },
        { status: 404 }
      );
    }

    let toAccount = null;
    if (requestData.toAccount) {
      toAccount = await Bank.findById(requestData.toAccount);
      if (!toAccount) {
        return NextResponse.json(
          { success: false, message: "To account not found" },
          { status: 404 }
        );
      }
    }

    // Make sure currentBalance exists, if not initialize it with openingBalance
    if (fromAccount.currentBalance === undefined) {
      fromAccount.currentBalance = Number(fromAccount.openingBalance);
    }

    if (toAccount && toAccount.currentBalance === undefined) {
      toAccount.currentBalance = Number(toAccount.openingBalance);
    }

    // Update account balances
    if (requestData.transactionType === "deposit") {
      fromAccount.currentBalance =
        Number(fromAccount.currentBalance) + Number(requestData.amount);
      await fromAccount.save();

      // Add to ledger as income
      await createLedgerEntry(
        {
          type: "income",
          category: "Bank Deposit",
          refId: bankEntry._id.toString(),
          description: requestData.description || "Bank deposit",
          credit: Number(requestData.amount),
          bank: fromAccount._id,
          date: requestData.date,
        },
        Ledger
      );
    } else if (requestData.transactionType === "withdrawal") {
      fromAccount.currentBalance =
        Number(fromAccount.currentBalance) - Number(requestData.amount);
      await fromAccount.save();

      // Add to ledger as expense
      await createLedgerEntry(
        {
          type: "expenses",
          category: "Bank Withdrawal",
          refId: bankEntry._id.toString(),
          description: requestData.description || "Bank withdrawal",
          debit: Number(requestData.amount),
          bank: fromAccount._id,
          date: requestData.date,
        },
        Ledger
      );
    } else if (requestData.transactionType === "transfer") {
      fromAccount.currentBalance =
        Number(fromAccount.currentBalance) - Number(requestData.amount);
      toAccount.currentBalance =
        Number(toAccount.currentBalance) + Number(requestData.amount);
      await fromAccount.save();
      await toAccount.save();

      // Add to ledger as a transfer (two entries - expense from source, income to destination)
      await createLedgerEntry(
        {
          type: "expenses",
          category: "Bank Transfer (Out)",
          refId: bankEntry._id.toString(),
          description:
            requestData.description ||
            `Transfer to ${toAccount.name || toAccount.bankName}`,
          debit: Number(requestData.amount),
          bank: fromAccount._id,
          date: requestData.date,
        },
        Ledger
      );

      await createLedgerEntry(
        {
          type: "income",
          category: "Bank Transfer (In)",
          refId: bankEntry._id.toString(),
          description:
            requestData.description ||
            `Transfer from ${fromAccount.name || fromAccount.bankName}`,
          credit: Number(requestData.amount),
          bank: toAccount._id,
          date: requestData.date,
        },
        Ledger
      );
    }

    return NextResponse.json(
      {
        success: true,
        bankEntry,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating bank entry:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

// Helper function to create ledger entries
async function createLedgerEntry(entryData, Ledger) {
  try {
    // Get current month and year
    const entryDate = new Date(entryData.date);
    const month = entryDate.getMonth() + 1; // JavaScript months are 0-indexed
    const year = entryDate.getFullYear();

    // Find or create ledger for the current month/year
    let ledger = await Ledger.findOne({ month, year });

    if (!ledger) {
      // Calculate opening balance from previous month
      let openingBalance = 0;
      const previousMonth = month === 1 ? 12 : month - 1;
      const previousYear = month === 1 ? year - 1 : year;

      const previousLedger = await Ledger.findOne({
        month: previousMonth,
        year: previousYear,
      });

      if (previousLedger) {
        openingBalance = previousLedger.closingBalance;
      }

      // Create new ledger for this month
      ledger = new Ledger({
        month,
        year,
        openingBalance,
        closingBalance: openingBalance,
        entries: [],
      });
    }

    // Calculate new balance
    let currentBalance =
      ledger.entries.length > 0
        ? ledger.entries[ledger.entries.length - 1].balance
        : ledger.openingBalance;

    if (entryData.type === "income") {
      currentBalance += entryData.credit;
      ledger.totalIncome += entryData.credit;
    } else if (entryData.type === "expenses") {
      currentBalance -= entryData.debit;
      ledger.totalExpenses += entryData.debit;
    }

    // Create new entry
    const newEntry = {
      date: entryData.date,
      type: entryData.type,
      category: entryData.category,
      refId: entryData.refId,
      description: entryData.description || "",
      debit: Math.round(parseFloat(entryData.debit) || 0),
      credit: Math.round(parseFloat(entryData.credit) || 0),
      balance: currentBalance,
      bank: entryData.bank || null,
      paymentType: entryData.paymentType,
      razorpayPaymentLinkId: entryData.razorpayPaymentLinkId,
    };

    // Update ledger summary
    ledger.closingBalance = currentBalance;
    ledger.netProfit = ledger.totalIncome - ledger.totalExpenses;

    // Add entry to ledger
    ledger.entries.push(newEntry);
    await ledger.save();

    return newEntry;
  } catch (error) {
    console.error("Error creating ledger entry:", error);
    throw error;
  }
}

export async function GET(request) {
  try {
    await getHotelDatabase();
    const BankEntry = getModel("BankEntry", BankEntrySchema);
    const { searchParams } = new URL(request.url);

    // Build query based on search params
    const query = {};

    if (searchParams.has("transactionType")) {
      query.transactionType = searchParams.get("transactionType");
    }

    if (searchParams.has("paymentType")) {
      query.paymentType = searchParams.get("paymentType");
    }

    if (searchParams.has("fromAccount")) {
      query.fromAccount = searchParams.get("fromAccount");
    }

    if (searchParams.has("toAccount")) {
      query.toAccount = searchParams.get("toAccount");
    }

    if (searchParams.has("bookingId")) {
      query.bookingId = searchParams.get("bookingId");
    }

    if (searchParams.has("guestId")) {
      query.guestId = searchParams.get("guestId");
    }

    // Date range
    if (searchParams.has("startDate") && searchParams.has("endDate")) {
      query.date = {
        $gte: new Date(searchParams.get("startDate")),
        $lte: new Date(searchParams.get("endDate")),
      };
    }

    // Get bank entries with populated account details
    const bankEntries = await BankEntry.find(query)
      .populate("fromAccount", "name type bankName")
      .populate("toAccount", "name type bankName")
      .sort({ date: -1 });

    return NextResponse.json({ success: true, bankEntries }, { status: 200 });
  } catch (error) {
    console.error("Error fetching bank entries:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
