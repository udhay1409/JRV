import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import Expenses from "../../../utils/model/financials/expenses/expensesSchema";
import { getModel } from "../../../utils/helpers/getModel";
import fs from "fs";
import path from "path";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const ExpensesModel = getModel("Expenses", Expenses);
    const formData = await request.formData();

    let receiptData = null;
    const receiptFile = formData.get("receipt");

    if (receiptFile && receiptFile.name) {
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "receipts"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const receiptPath = path.join(uploadsDir, receiptFile.name);
      await fs.promises.writeFile(
        receiptPath,
        Buffer.from(await receiptFile.arrayBuffer())
      );

      receiptData = {
        url: `/assets/receipts/${receiptFile.name}`,
        filename: receiptFile.name,
      };
    }

    const expenseData = {
      amount: formData.get("amount"),
      category: formData.get("category"),
      expense: formData.get("expense"),
      description: formData.get("description"),
      date: new Date(formData.get("date")),
      receipt: receiptData,
      paymentType: formData.get("paymentType"),
      bank: formData.get("bank"),
      reference: formData.get("reference"),
    };

    const newExpense = new ExpensesModel(expenseData);
    await newExpense.save();

    return NextResponse.json(
      { success: true, expense: newExpense },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await getHotelDatabase();
    const ExpensesModel = getModel("Expenses", Expenses);

    if (id) {
      const expense = await ExpensesModel.findById(id);
      if (!expense) {
        return NextResponse.json(
          { success: false, message: "Expense not found" },
          { status: 404 }
        );
      }
      return NextResponse.json({ success: true, expense });
    }

    const expenses = await ExpensesModel.find().sort({ date: -1 });
    return NextResponse.json({ success: true, expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await getHotelDatabase();
    const ExpensesModel = getModel("Expenses", Expenses);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const deletedExpense = await ExpensesModel.findByIdAndDelete(id);

    if (!deletedExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Expense deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    await getHotelDatabase();
    const ExpensesModel = getModel("Expenses", Expenses);

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Missing required parameters" },
        { status: 400 }
      );
    }

    const formData = await request.formData();

    // Get existing expense to handle receipt changes
    const existingExpense = await ExpensesModel.findById(id);
    if (!existingExpense) {
      return NextResponse.json(
        { success: false, message: "Expense not found" },
        { status: 404 }
      );
    }

    let receiptData = null;
    const receiptFile = formData.get("receipt");
    const keepExistingReceipt = formData.get("keepExistingReceipt");

    // Handle receipt file
    if (receiptFile && receiptFile.name) {
      // Delete old receipt file if exists
      if (existingExpense.receipt?.filename) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          "assets",
          "receipts",
          existingExpense.receipt.filename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }

      // Save new receipt file
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "receipts"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const receiptPath = path.join(uploadsDir, receiptFile.name);
      await fs.promises.writeFile(
        receiptPath,
        Buffer.from(await receiptFile.arrayBuffer())
      );

      receiptData = {
        url: `/assets/receipts/${receiptFile.name}`,
        filename: receiptFile.name,
      };
    } else if (keepExistingReceipt === "true") {
      // Keep existing receipt if specified
      receiptData = existingExpense.receipt;
    } else {
      // Delete existing receipt file if not keeping it
      if (existingExpense.receipt?.filename) {
        const oldFilePath = path.join(
          process.cwd(),
          "public",
          "assets",
          "receipts",
          existingExpense.receipt.filename
        );
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    }

    const updateData = {
      amount: formData.get("amount"),
      category: formData.get("category"),
      expense: formData.get("expense"),
      description: formData.get("description"),
      date: new Date(formData.get("date")),
      receipt: receiptData, // This will be null if receipt was deleted
      paymentType: formData.get("paymentType"),
      bank: formData.get("bank"),
      reference: formData.get("reference"),
    };

    const updatedExpense = await ExpensesModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    return NextResponse.json(
      { success: true, expense: updatedExpense },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update expense" },
      { status: 500 }
    );
  }
}
