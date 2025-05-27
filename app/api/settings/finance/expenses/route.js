import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import ExpensesSettings from "../../../../../utils/model/settings/finance/expenses/expensesSettingsSchema";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const ExpensesModel = getModel("ExpensesSettings", ExpensesSettings);

    const settings = await ExpensesModel.findOne({});

    return NextResponse.json(
      {
        success: true,
        settings: settings || { category: [], expense: [] },
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const ExpensesModel = getModel("ExpensesSettings", ExpensesSettings);

    const { type, name } = await request.json();

    let settings = await ExpensesModel.findOne({});
    if (!settings) {
      settings = new ExpensesModel({ category: [], expense: [] });
    }

    if (type === "category") {
      settings.category.push({ name });
    } else if (type === "expense") {
      settings.expense.push({ name });
    }

    await settings.save();

    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const ExpensesModel = getModel("ExpensesSettings", ExpensesSettings);

    const { type, oldName, newName } = await request.json();

    const settings = await ExpensesModel.findOne({});
    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Settings not found" },
        { status: 404 }
      );
    }

    if (type === "category") {
      const categoryIndex = settings.category.findIndex(
        (c) => c.name === oldName
      );
      if (categoryIndex !== -1) {
        settings.category[categoryIndex].name = newName;
      }
    } else if (type === "expense") {
      const expenseIndex = settings.expense.findIndex(
        (e) => e.name === oldName
      );
      if (expenseIndex !== -1) {
        settings.expense[expenseIndex].name = newName;
      }
    }

    await settings.save();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const ExpensesModel = getModel("ExpensesSettings", ExpensesSettings);

    const { type, name } = await request.json();

    const settings = await ExpensesModel.findOne({});
    if (!settings) {
      return NextResponse.json(
        { success: false, message: "Settings not found" },
        { status: 404 }
      );
    }

    if (type === "category") {
      settings.category = settings.category.filter((c) => c.name !== name);
    } else if (type === "expense") {
      settings.expense = settings.expense.filter((e) => e.name !== name);
    }

    await settings.save();
    return NextResponse.json({ success: true, settings }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
