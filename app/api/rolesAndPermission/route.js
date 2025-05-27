import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import roleSchema from "../../../utils/model/rolesAndPermission/roleSchema";
import UserEmployeeSchema from "../../../utils/model/UserEmployeeSchema";
import EmployeeSchema from "../../../utils/model/employeeManagement/employeeSchema";
import { getModel } from "../../../utils/helpers/getModel";

export async function POST(request) {
  try {
    await getHotelDatabase();
    const RoleModel = getModel("Role", roleSchema);
    const { role, permissions } = await request.json();

    if (!role || role.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Role name is required" },
        { status: 400 }
      );
    }

    // Check if role already exists
    const existingRole = await RoleModel.findOne({ role: role.trim() });
    if (existingRole) {
      return NextResponse.json(
        { success: false, message: "Role already exists" },
        { status: 409 }
      );
    }

    const newRole = new RoleModel({
      role: role.trim(),
      permissions
    });

    await newRole.save();

    return NextResponse.json(
      { success: true, role: newRole, message: "Role added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding role:", error);
    const errorMessage =
      error.code === 11000
        ? "Role already exists"
        : error.message || "Error adding role";
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: error.code === 11000 ? 409 : 500 }
    );
  }
}

export async function GET() {
  try {
    await getHotelDatabase();
    const RoleModel = getModel("Role", roleSchema);

    const roles = await RoleModel.find();
    return NextResponse.json({ success: true, roles }, { status: 200 });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    await getHotelDatabase();
    const RoleModel = getModel("Role", roleSchema);
    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema);

    const { id, role, permissions } = await request.json();

    const updatedRole = await RoleModel.findByIdAndUpdate(
      id,
      { role, permissions },
      { new: true }
    );

    if (!updatedRole) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    // Update all UserEmployee documents with this role
    await UserEmployee.updateMany(
      { role: id },
      { $set: { permissions: permissions } }
    );

    return NextResponse.json(
      {
        success: true,
        role: updatedRole,
        message: "Role and associated user permissions updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating role and user permissions:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    await getHotelDatabase();
    const RoleModel = getModel("Role", roleSchema);
    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema);
    const Employee = getModel("Employee", EmployeeSchema);

    const { id } = await request.json();

    const deletedRole = await RoleModel.findByIdAndDelete(id);
    if (!deletedRole) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    // Delete associated records
    const userDeleteResult = await UserEmployee.deleteMany({ role: id });
    const employeeDeleteResult = await Employee.deleteMany({ "role._id": id });

    return NextResponse.json(
      { 
        success: true, 
        message: "Role deleted successfully",
        deletedUsers: userDeleteResult.deletedCount,
        deletedEmployees: employeeDeleteResult.deletedCount
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting role and associated employees:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
