import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/options";
import connectDb from "../../../../utils/config/connectDB";
import UserEmployeeSchema from "../../../../utils/model/UserEmployeeSchema";
import roleSchema from "../../../../utils/model/rolesAndPermission/roleSchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function PUT(request: Request) {
  try {
    // Get session to verify if user is hotel admin
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.isEmployee) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - Only hotel admin can update roles" },
        { status: 403 }
      );
    }

    const { email, roleId } = await request.json();
    await connectDb();

    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema);
    const Role = getModel("Role", roleSchema);

    // Find the role
    const role = await Role.findById(roleId);
    if (!role) {
      return NextResponse.json(
        { success: false, message: "Role not found" },
        { status: 404 }
      );
    }

    // Update user with new role and permissions
    const updatedUser = await UserEmployee.findOneAndUpdate(
      { email },
      {
        role: role._id,
        permissions: role.permissions
      },
      { new: true }
    ).populate('role');

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Update the session with new role and permissions
    if (session) {
      session.user.role = role.role;
      session.user.permissions = role.permissions;
    }

    return NextResponse.json(
      { 
        success: true, 
        message: "User role and permissions updated successfully",
        user: {
          role: updatedUser.role.role,
          permissions: updatedUser.permissions
        }
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error updating user role:", error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { success: false, message: "Failed to update user role", error: errorMessage },
      { status: 500 }
    );
  }
}