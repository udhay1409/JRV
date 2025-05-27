import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import EmployeeSchema from "../../../../utils/model/employeeManagement/employeeSchema";
import UserEmployeeSchema from "../../../../utils/model/UserEmployeeSchema";
import roleSchema from "../../../../utils/model/rolesAndPermission/roleSchema";
import { getModel } from "../../../../utils/helpers/getModel";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request, { params }) {
  const { employeeId } = params;

  if (!employeeId) {
    return NextResponse.json(
      { success: false, message: "Employee ID is missing" },
      { status: 400 }
    );
  }

  try {
    await getHotelDatabase();
    const Employee = getModel("Employee", EmployeeSchema);

    const employee = await Employee.findOne({ employeeId });
    if (!employee) {
      return NextResponse.json(
        { success: false, message: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch employee",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { employeeId } = params;

  if (!employeeId) {
    return NextResponse.json(
      { success: false, message: "Employee ID is missing" },
      { status: 400 }
    );
  }

  try {
    await getHotelDatabase();
    const Employee = getModel("Employee", EmployeeSchema);
    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema);
    const Role = getModel("Role", roleSchema);

    const formData = await request.formData();

    // Validate and parse JSON fields
    const roleData = formData.get("role");
    const departmentData = formData.get("department");
    const shiftData = formData.get("shiftTime");

    let role, department, shift;
    try {
      role = roleData ? JSON.parse(roleData) : null;
      department = departmentData ? JSON.parse(departmentData) : null;
      shift = shiftData ? JSON.parse(shiftData) : null;

      if (!role || !department || !shift) {
        throw new Error("Missing required data");
      }
    } catch (error) {
      console.error("JSON parsing error:", error);
      return NextResponse.json(
        {
          success: false,
          message: "Invalid data format for role, department, or shift",
        },
        { status: 400 }
      );
    }

    const employeeData = {
      role,
      department,
      shiftTime: shift,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth"),
      email: formData.get("email"),
    /*   password: formData.get("password"), */
      mobileNo: formData.get("mobileNo"),
      dateOfHiring: formData.get("dateOfHiring"),
      weekOff: formData.get("weekOff"),
    };

    const avatar = formData.get("avatar");
    const existingAvatar = formData.get("existingAvatar");
    if (avatar && avatar.size > 0) {
      const avatarPath = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "employees",
        "avatars",
        avatar.name
      );
      const uploadsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "employees",
        "avatars"
      );
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      await fs.promises.writeFile(
        avatarPath,
        Buffer.from(await avatar.arrayBuffer())
      );
      employeeData.avatar = `/assets/images/employees/avatars/${avatar.name}`;
    } else if (existingAvatar) {
      employeeData.avatar = existingAvatar;
    }

    const newDocuments = formData.getAll("documents");
    const existingDocuments = formData.getAll("existingDocuments");
    employeeData.documents = [...existingDocuments];

    if (newDocuments.length > 0) {
      const documentsDir = path.join(
        process.cwd(),
        "public",
        "assets",
        "images",
        "employees",
        "documents"
      );
      if (!fs.existsSync(documentsDir)) {
        fs.mkdirSync(documentsDir, { recursive: true });
      }
      for (const document of newDocuments) {
        if (document.size > 0) {
          const documentPath = path.join(documentsDir, document.name);
          await fs.promises.writeFile(
            documentPath,
            Buffer.from(await document.arrayBuffer())
          );
          employeeData.documents.push(
            `/assets/images/employees/documents/${document.name}`
          );
        }
      }
    }

    const updatedEmployee = await Employee.findOneAndUpdate(
      { employeeId },
      employeeData,
      { new: true }
    );

      // Update user employee data (role and permissions)
      const updatedRole = await Role.findById(role._id);
      if (!updatedRole) {
        return NextResponse.json(
          { success: false, message: "Role not found" },
          { status: 404 }
        );
      }

      await UserEmployee.findOneAndUpdate(
        { email: updatedEmployee.email },
        {
          role: updatedRole._id,
          permissions: updatedRole.permissions
        },
        { new: true }
      );

    return NextResponse.json(
      {
        success: true,
        message: "Employee updated successfully",
        employee: updatedEmployee,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update employee",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


