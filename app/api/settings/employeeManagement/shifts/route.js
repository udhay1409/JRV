import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import Shift from "../../../../../utils/model/settings/employeeManagement/Shift/Shift";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const ShiftModel = getModel("Shift", Shift);
    const shifts = await ShiftModel.find({});

    return NextResponse.json({ success: true, shifts }, { status: 200 });
  } catch (error) {
    console.error("Error fetching shifts:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while fetching shifts",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const ShiftModel = getModel("Shift", Shift);
    const { name, startTime, endTime } = await request.json();

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const newShift = new ShiftModel({ name, startTime, endTime });
    await newShift.save();

    return NextResponse.json(
      {
        success: true,
        shift: newShift,
        message: "Shift added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding shift:", error);
    let statusCode = 500;
    let errorMessage = "An unexpected error occurred while adding the shift.";

    if (error.name === "ValidationError") {
      statusCode = 400;
      errorMessage = "Validation error: " + error.message;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const ShiftModel = getModel("Shift", Shift);

    const { id, name, startTime, endTime } = await request.json();

    if (!id || !name || !startTime || !endTime) {
      return NextResponse.json(
        { success: false, error: "All fields are required" },
        { status: 400 }
      );
    }

    const updatedShift = await ShiftModel.findByIdAndUpdate(
      id,
      { name, startTime, endTime },
      { new: true }
    );

    if (!updatedShift) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        shift: updatedShift,
        message: "Shift updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating shift:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while updating the shift.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const ShiftModel = getModel("Shift", Shift);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Shift ID is required" },
        { status: 400 }
      );
    }

    const deletedShift = await ShiftModel.findByIdAndDelete(id);

    if (!deletedShift) {
      return NextResponse.json(
        { success: false, error: "Shift not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Shift deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting shift:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while deleting the shift.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
