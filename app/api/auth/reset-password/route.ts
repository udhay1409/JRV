

import { NextResponse } from "next/server"
import connectDb from "../../../../utils/config/connectDB"
import User from "../../../../utils/model/nextauth/user.model"
import UserEmployeeSchema from "../../../../utils/model/UserEmployeeSchema"
import { getModel } from "../../../../utils/helpers/getModel"
import bcrypt from "bcryptjs"
import crypto from "crypto"

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json()

    // Decode the base64 token
    const resetToken = Buffer.from(token, "base64").toString("ascii")
    
    // Hash the token for comparison
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex")

    await connectDb()
    
    // Check both user models for the reset token
    const UserModel = getModel("User", User)
    const UserEmployee = getModel("UserEmployee", UserEmployeeSchema)

    // Try to find the token in hotel admin users
    let user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() }
    })

    // If not found in admin users, try employee users
    if (!user) {
      user = await UserEmployee.findOne({
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { $gt: Date.now() }
      })
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      )
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newPassword, salt)

    // Update password and clear reset token
    user.password = hashedPassword
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    return NextResponse.json(
      { message: "Password reset successful" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    )
  }
}