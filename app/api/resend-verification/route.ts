
import { NextResponse } from "next/server"
import { getHotelDatabase } from "../../../utils/config/hotelConnection"
import User from "../../../utils/model/nextauth/user.model"
import { sendEmail } from "../../../utils/sendEmail"
import { verificationEmailTemplate } from "../../../utils/verificationEmailTemplate"
import { getModel } from "../../../utils/helpers/getModel"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    await getHotelDatabase();
    const UserModel = getModel("User", User)

    const user = await UserModel.findOne({ email })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ message: "User is already verified" }, { status: 400 })
    }

    const verificationToken = user.getVerificationToken()
    await user.save()

    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?verifyToken=${verificationToken}&id=${user._id}`
    const message = verificationEmailTemplate(verificationLink)

    await sendEmail(user.email, "Email Verification", message)

    return NextResponse.json({ message: "Verification email sent" }, { status: 200 })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ message: "Something went wrong", error: (error as Error).message }, { status: 500 })
  }
}