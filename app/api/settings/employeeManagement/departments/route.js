import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import Department from "../../../../../utils/model/settings/employeeManagement/department/Department";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const DepartmentModel = getModel("Department", Department);
    const departments = await DepartmentModel.find({});

    return NextResponse.json(
      { success: true, departments },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching departments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "An unexpected error occurred while fetching departments",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await getHotelDatabase();
    const DepartmentModel = getModel("Department", Department);

    const { name } = await request.json();

    if (!name) {
      return NextResponse.json(
        { success: false, error: "Department name is required" },
        { status: 400 }
      );
    }

    const newDepartment = new DepartmentModel({ name });
    await newDepartment.save();

    return NextResponse.json(
      {
        success: true,
        department: newDepartment,
        message: "Department added successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding department:", error);
    let statusCode = 500;
    let errorMessage =
      "An unexpected error occurred while adding the department.";

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
    const DepartmentModel = getModel("Department", Department);

    const { id, name } = await request.json();

    if (!id || !name) {
      return NextResponse.json(
        { success: false, error: "Department ID and name are required" },
        { status: 400 }
      );
    }

    const updatedDepartment = await DepartmentModel.findByIdAndUpdate(
      id,
      { name },
      { new: true }
    );

    if (!updatedDepartment) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        department: updatedDepartment,
        message: "Department updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating department:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while updating the department.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const DepartmentModel = getModel("Department", Department);

    const { id } = await request.json();

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Department ID is required" },
        { status: 400 }
      );
    }

    const deletedDepartment = await DepartmentModel.findByIdAndDelete(id);

    if (!deletedDepartment) {
      return NextResponse.json(
        { success: false, error: "Department not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Department deleted successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting department:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while deleting the department.",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
