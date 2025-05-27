import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import EmployeeSchema from "../../../utils/model/employeeManagement/employeeSchema";
import { getModel } from "../../../utils/helpers/getModel";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

async function generateEmployeeId(EmployeeModel, dateOfHiring) {
  const employees = await EmployeeModel.find().sort({ dateOfHiring: 1 });
  const nextNumber = employees.length + 1;

  const hiringDate = new Date(dateOfHiring);
  const datePrefix = hiringDate
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "2-digit",
    })
    .replace(/\//g, "");

  return `EMP-${datePrefix}-${nextNumber.toString().padStart(4, "0")}`;
}

// Update the updateEmployeeIds function
async function updateEmployeeIds(EmployeeModel, employees) {
  try {
    const updateOperations = [];
    const existingIds = new Set();

    // Sort all employees by hiring date and _id to ensure consistent ordering
    const sortedEmployees = employees.sort((a, b) => {
      const dateA = new Date(a.dateOfHiring);
      const dateB = new Date(b.dateOfHiring);
      if (dateA - dateB === 0) {
        return a._id.toString().localeCompare(b._id.toString());
      }
      return dateA - dateB;
    });

    // Generate new IDs and check for duplicates
    for (let i = 0; i < sortedEmployees.length; i++) {
      const emp = sortedEmployees[i];
      const hiringDate = new Date(emp.dateOfHiring);
      const datePrefix = hiringDate
        .toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "2-digit",
        })
        .replace(/\//g, "");

      let sequentialNumber = i + 1;
      let newEmployeeId;

      // Keep incrementing the number until we find a unique ID
      do {
        newEmployeeId = `EMP-${datePrefix}-${sequentialNumber.toString().padStart(4, "0")}`;
        sequentialNumber++;
      } while (existingIds.has(newEmployeeId));

      existingIds.add(newEmployeeId);

      if (emp.employeeId !== newEmployeeId) {
        updateOperations.push({
          updateOne: {
            filter: { _id: emp._id },
            update: { $set: { employeeId: newEmployeeId } },
            upsert: false
          },
        });
      }
    }

    // Execute updates in batches to avoid overwhelming the database
    if (updateOperations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < updateOperations.length; i += batchSize) {
        const batch = updateOperations.slice(i, i + batchSize);
        await EmployeeModel.bulkWrite(batch, { ordered: false });
      }
    }
  } catch (error) {
    console.error("Error updating employee IDs:", error);
    throw error;
  }
}

export async function GET() {
  try {
    await getHotelDatabase();
    const Employee = getModel("Employee", EmployeeSchema);

    // Fetch all employees
    const employees = await Employee.find().sort({ dateOfHiring: 1, _id: 1 });

    try {
      // Update employee IDs
      await updateEmployeeIds(Employee, employees);
    } catch (error) {
      console.error("Error during ID update:", error);
      // Continue with existing IDs if update fails
    }

    // Fetch and return the final list of employees
    const updatedEmployees = await Employee.find().sort({ dateOfHiring: 1, _id: 1 });

    return NextResponse.json(
      {
        success: true,
        employees: updatedEmployees,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch employees",
        error: error.message,
      },
      { status: 500 }
    );
  }
}



export async function POST(request) {
  try {
    await getHotelDatabase();
    const Employee = getModel("Employee", EmployeeSchema);
    const formData = await request.formData();

    // Basic validation
    const requiredFields = [
      "role",
      "firstName",
      "lastName",
      "gender",
      "dateOfBirth",
      "email",
      "mobileNo",
      "dateOfHiring",
      "department",
      "shiftTime",
      "weekOff",
    ];

    for (const field of requiredFields) {
      if (!formData.get(field)) {
        return NextResponse.json(
          { success: false, message: `${field} is required` },
          { status: 400 }
        );
      }
    }

    // Check for duplicate email
    const email = formData.get("email");
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return NextResponse.json(
        { success: false, message: "Email already exists" },
        { status: 400 }
      );
    }

    // Parse role, department, and shift data from formData
    const role = JSON.parse(formData.get("role"));
    const department = JSON.parse(formData.get("department"));
    const shift = JSON.parse(formData.get("shiftTime"));
    const dateOfHiring = formData.get("dateOfHiring");

    // Generate employee ID using dateOfHiring
    const employeeId = await generateEmployeeId(Employee, dateOfHiring);

    // Create employee object
    const employeeData = {
      employeeId,
      role,
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      gender: formData.get("gender"),
      dateOfBirth: formData.get("dateOfBirth"),
      email,
      mobileNo: formData.get("mobileNo"),
      dateOfHiring,
      department,
      shiftTime: shift,
      weekOff: formData.get("weekOff"),
    };

    // Handle avatar upload
    const avatar = formData.get("avatar");
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
    }

    // Handle document uploads
    const documents = formData.getAll("documents");
    if (documents.length > 0) {
      employeeData.documents = [];
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
      for (const document of documents) {
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

    // Save to database
    const employee = new Employee(employeeData);
    await employee.save();

    return NextResponse.json(
      {
        success: true,
        message: "Employee added successfully",
        employee,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding employee:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to add employee",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

// Update the GET route
