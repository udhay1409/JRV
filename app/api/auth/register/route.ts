import { NextResponse } from "next/server";
import connectDb from "../../../../utils/config/connectDB";
import bcrypt from "bcryptjs";
import { sendEmail } from "../../../../utils/sendEmail";
import roleSchema from "../../../../utils/model/rolesAndPermission/roleSchema";
import UserEmployeeSchema from "../../../../utils/model/UserEmployeeSchema";
import { getModel } from "../../../../utils/helpers/getModel";

interface UserRequest {
    email: string;
    roleId: string;
}

export async function POST(request: Request) {
    try {
        const { email, roleId }: UserRequest = await request.json();

       await connectDb();
        const UserEmployee = getModel("UserEmployee", UserEmployeeSchema);
        const RoleModel = getModel("Role", roleSchema);

        // Check if user already exists
        const existingUserEmployee = await UserEmployee.findOne({ email });
        if (existingUserEmployee) {
            return NextResponse.json(
                { success: false, message: "Employee already exists" },
                { status: 400 }
            );
        }

        // Fetch role and permissions
        const role = await RoleModel.findById(roleId);
        if (!role) {
            return NextResponse.json(
                { success: false, message: "Role not found" },
                { status: 404 }
            );
        }

        // Generate a random password
        const password = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUserEmployee = new UserEmployee({
            email,
            password: hashedPassword,
            role: roleId,
            permissions: role.permissions
        });
        await newUserEmployee.save();

        console.log(`Password for ${email}: ${password}`);

        // Send email with the generated password
        const subject = "Your New Account Details";
        const message = `
            <h1>Welcome to Our Platform</h1>
            <p>Your account has been created successfully.</p>
            <p>Here are your login details:</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>Please change your password after your first login.</p>
        `;

        await sendEmail(email, subject, message);

        return NextResponse.json(
            { success: true, message: "Employee registered successfully and email sent" },
            { status: 201 }
        );
    } catch (error: unknown) {
        console.error("Error registering Employee:", error);
        return NextResponse.json(
            { success: false, message: "Failed to register Employee", error: error instanceof Error ? error.message : 'An unknown error occurred' },
            { status: 500 }
        );
    }
}