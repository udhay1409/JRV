import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { getModel } from "../../../../utils/helpers/getModel";
import LedgerSchema from "../../../../utils/model/financials/ledger/ledgerSchema";
import BankSchema from "../../../../utils/model/financials/bank/bankSchema";
import BankEntrySchema from "../../../../utils/model/financials/bank/bankEntrySchema";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const Ledger = getModel("Ledger", LedgerSchema);
    const Bank = getModel("Bank", BankSchema);
    const requestData = await request.json();

    // Validate required fields
    const requiredFields = ["type", "category", "refId"];
    for (const field of requiredFields) {
      if (!requestData[field]) {
        return NextResponse.json(
          { success: false, message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Type-specific validation
    if (requestData.type === "income" && !requestData.credit) {
      return NextResponse.json(
        { success: false, message: "Credit amount is required for income" },
        { status: 400 }
      );
    }

    if (requestData.type === "expenses" && !requestData.debit) {
      return NextResponse.json(
        { success: false, message: "Debit amount is required for expenses" },
        { status: 400 }
      );
    }

    // Format date
    if (requestData.date && typeof requestData.date === "string") {
      requestData.date = new Date(requestData.date);
    } else if (!requestData.date) {
      requestData.date = new Date();
    }

    // Get current month and year
    const entryDate = new Date(requestData.date);
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

    // Prepare new entry
    const newEntry = {
      date: requestData.date,
      type: requestData.type,
      category: requestData.category,
      refId: requestData.refId,
      description: requestData.description || "",
      debit: Math.round(parseFloat(requestData.debit) || 0),
      credit: Math.round(parseFloat(requestData.credit) || 0),
      bank: requestData.bank || null,
    };

    // Calculate new balance
    let currentBalance =
      ledger.entries.length > 0
        ? ledger.entries[ledger.entries.length - 1].balance
        : ledger.openingBalance;

    if (newEntry.type === "income") {
      currentBalance += newEntry.credit;
      ledger.totalIncome += newEntry.credit;
    } else if (newEntry.type === "expenses") {
      currentBalance -= newEntry.debit;
      ledger.totalExpenses += newEntry.debit;
    }

    // Update entry balance
    newEntry.balance = currentBalance;

    // Update ledger summary
    ledger.closingBalance = currentBalance;
    ledger.netProfit = ledger.totalIncome - ledger.totalExpenses;

    // Add entry to ledger
    ledger.entries.push(newEntry);

    // Update bank balance if specified
    if (newEntry.bank) {
      const bank = await Bank.findById(newEntry.bank);
      if (bank) {
        if (newEntry.type === "income") {
          bank.openingBalance += newEntry.credit;
        } else if (newEntry.type === "expenses") {
          bank.openingBalance -= newEntry.debit;
        }
        await bank.save();
      }
    }

    // Calculate total bank balance
    const banks = await Bank.find({ isActive: true });
    ledger.bankBalance = banks.reduce(
      (total, bank) => total + bank.openingBalance,
      0
    );

    await ledger.save();

    return NextResponse.json(
      {
        success: true,
        entry: newEntry,
        ledgerSummary: {
          totalIncome: ledger.totalIncome,
          totalExpenses: ledger.totalExpenses,
          bankBalance: ledger.bankBalance,
          netProfit: ledger.netProfit,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating ledger entry:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    await getHotelDatabase();
    const Ledger = getModel("Ledger", LedgerSchema);
    const Bank = getModel("Bank", BankSchema);
    const BankEntry = getModel("BankEntry", BankEntrySchema);
    const { searchParams } = new URL(request.url);

    // Build query based on search params
    const query = {};

    if (searchParams.has("month") && searchParams.has("year")) {
      query.month = parseInt(searchParams.get("month"));
      query.year = parseInt(searchParams.get("year"));
    } else {
      // Default to current month
      const today = new Date();
      query.month = today.getMonth() + 1;
      query.year = today.getFullYear();
    }

    // Check for account type filter
    const accountType = searchParams.get("accountType") || "all";

    // Get ledger with populated bank details
    const ledger = await Ledger.findOne(query)
      .populate("entries.bank", "name type bankName")
      .sort({ "entries.date": -1 });

    if (!ledger) {
      // Create an empty ledger for the requested month/year
      const newLedger = {
        month: query.month,
        year: query.year,
        totalIncome: 0,
        totalExpenses: 0,
        bankBalance: 0,
        netProfit: 0,
        openingBalance: 0,
        closingBalance: 0,
        entries: [],
        accountTypeSummary: {
          openingBalance: 0,
          totalCredited: 0,
          totalDebited: 0,
          closingBalance: 0,
        },
      };

      return NextResponse.json(
        { success: true, ledger: newLedger },
        { status: 200 }
      );
    }

    // If account type specified, calculate type-specific balances
    let accountTypeSummary = {
      openingBalance: 0,
      totalCredited: 0,
      totalDebited: 0,
      closingBalance: 0,
    };

    if (accountType !== "all") {
      // Get all accounts of the selected type
      const accounts = await Bank.find({
        type: accountType,
        isActive: true,
      });

      // Calculate total opening balance from all accounts of this type
      accountTypeSummary.openingBalance = accounts.reduce(
        (total, account) => total + Number(account.openingBalance || 0),
        0
      );

      // Get account IDs for filtering transactions
      const accountIds = accounts.map((account) => account._id.toString());

      // First date of the selected month
      const startDate = new Date(query.year, query.month - 1, 1);
      // Last date of the selected month
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59);

      // Get all bank entries for these accounts within the date range
      const entries = await BankEntry.find({
        date: { $gte: startDate, $lte: endDate },
      })
        .populate("fromAccount", "name type bankName")
        .populate("toAccount", "name type bankName");

      // Process entries
      entries.forEach((entry) => {
        const fromAccountId = entry.fromAccount?._id.toString();
        const toAccountId = entry.toAccount?._id.toString();
        const fromAccountMatch = accountIds.includes(fromAccountId);
        const toAccountMatch = accountIds.includes(toAccountId);

        if (fromAccountMatch && entry.transactionType === "deposit") {
          accountTypeSummary.totalCredited += Number(entry.amount || 0);
        } else if (fromAccountMatch && entry.transactionType === "withdrawal") {
          accountTypeSummary.totalDebited += Number(entry.amount || 0);
        } else if (
          fromAccountMatch &&
          entry.transactionType === "transfer" &&
          !toAccountMatch
        ) {
          // Money going out of our account type to another type
          accountTypeSummary.totalDebited += Number(entry.amount || 0);
        } else if (
          !fromAccountMatch &&
          toAccountMatch &&
          entry.transactionType === "transfer"
        ) {
          // Money coming into our account type from another type
          accountTypeSummary.totalCredited += Number(entry.amount || 0);
        }
      });

      // Calculate closing balance
      accountTypeSummary.closingBalance =
        accountTypeSummary.openingBalance +
        accountTypeSummary.totalCredited -
        accountTypeSummary.totalDebited;
    } else {
      // For "all" type, calculate for both bank and cash accounts
      const allAccounts = await Bank.find({ isActive: true });

      // Calculate total opening balance from all accounts
      accountTypeSummary.openingBalance = allAccounts.reduce(
        (total, account) => total + Number(account.openingBalance || 0),
        0
      );

      // First date of the selected month
      const startDate = new Date(query.year, query.month - 1, 1);
      // Last date of the selected month
      const endDate = new Date(query.year, query.month, 0, 23, 59, 59);

      // Get all bank entries within the date range
      const entries = await BankEntry.find({
        date: { $gte: startDate, $lte: endDate },
      });

      // For "all" we only count deposits and withdrawals, not transfers between accounts
      entries.forEach((entry) => {
        if (entry.transactionType === "deposit") {
          accountTypeSummary.totalCredited += Number(entry.amount || 0);
        } else if (entry.transactionType === "withdrawal") {
          accountTypeSummary.totalDebited += Number(entry.amount || 0);
        }
        // Ignore transfers as they don't change the total balance
      });

      // Calculate closing balance
      accountTypeSummary.closingBalance =
        accountTypeSummary.openingBalance +
        accountTypeSummary.totalCredited -
        accountTypeSummary.totalDebited;
    }

    // Add the account type summary to the response
    const ledgerWithSummary = {
      ...ledger.toObject(),
      accountTypeSummary,
    };

    return NextResponse.json(
      { success: true, ledger: ledgerWithSummary },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
