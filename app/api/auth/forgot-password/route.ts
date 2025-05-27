

import { NextResponse } from "next/server"
import connectDb from "../../../../utils/config/connectDB"
import User from "../../../../utils/model/nextauth/user.model"
import UserEmployeeSchema from "../../../../utils/model/UserEmployeeSchema"
import { sendEmail } from "../../../../utils/sendEmail"
import { resetPasswordEmailTemplate } from "../../../../utils/resetPasswordEmailTemplate"
import { getModel } from "../../../../utils/helpers/getModel"
import { getHotelDatabase } from "../../../../utils/config/hotelConnection"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()
    await connectDb()

    // First check if it's a hotel admin
    const { hotelData } = await getHotelDatabase()
    
    if (email === hotelData.emailId) {
      const UserModel = getModel("User", User)
      let user = await UserModel.findOne({ email })

      if (!user) {
        return NextResponse.json(
          { error: "User with this email does not exist" },
          { status: 404 }
        )
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(20).toString("hex")
      const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")

      // Update user with reset token
      user = await UserModel.findOneAndUpdate(
        { email },
        {
          resetPasswordToken: hashedResetToken,
          resetPasswordExpire: Date.now() + 15 * 60 * 1000, // 15 minutes
          role: 'hotel admin' // Ensure role is set
        },
        { new: true, runValidators: false } // Disable validation for this update
      )

      const encodedToken = Buffer.from(resetToken).toString("base64")
      const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${encodedToken}`
      const message = resetPasswordEmailTemplate(resetUrl)

      await sendEmail(user.email, "Password Reset Request", message)

      return NextResponse.json(
        { message: "Password reset email sent" },
        { status: 200 }
      )
    }

    // If not hotel admin, check if it's an employee
    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema)
    const employee = await UserEmployee.findOne({ email })

    if (!employee) {
      return NextResponse.json(
        { error: "User with this email does not exist" },
        { status: 404 }
      )
    }

    const resetToken = crypto.randomBytes(20).toString("hex")
    const hashedResetToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    // Update employee with reset token
    await UserEmployee.findOneAndUpdate(
      { email },
      {
        resetPasswordToken: hashedResetToken,
        resetPasswordExpire: Date.now() + 15 * 60 * 1000 // 15 minutes
      },
      { new: true }
    )

    const encodedToken = Buffer.from(resetToken).toString("base64")
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${encodedToken}`
    const message = resetPasswordEmailTemplate(resetUrl)

    await sendEmail(employee.email, "Password Reset Request", message)

    return NextResponse.json(
      { message: "Password reset email sent" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}