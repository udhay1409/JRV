import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import connectDb from "../../../utils/config/connectDB"
import User from "../../../utils/model/nextauth/user.model"
import { sendEmail } from "../../../utils/sendEmail"
import { verificationEmailTemplate } from "../../../utils/verificationEmailTemplate"
import { getModel } from "../../../utils/helpers/getModel"
import { getHotelDatabase } from "../../../utils/config/hotelConnection"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, password } = body

    console.log("Registration attempt:", { name, email })

    const { hotelData } = await getHotelDatabase()
    
    // Only allow registration for the hotel's authorized email
    if (email !== hotelData.emailId) {
      return NextResponse.json({ 
        error: "You are not authorized to register. Please contact the system administrator." 
      }, { status: 403 })
    }

     await connectDb()
    const UserModel = getModel("User", User)

    const existingUser = await UserModel.findOne({ email })
    if (existingUser) {
      console.log("User already exists:", email)
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Create new user with hotel admin role for authorized email
    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await UserModel.create({
      name,
      email,
      password: hashedPassword,
      isAdmin: email === hotelData.emailId, // Only true for authorized email
      role: 'hotel admin' // Set specific role for hotel admin
    })

    // Generate verification token and send email
    const verificationToken = newUser.getVerificationToken()
    await newUser.save()

    const verificationLink = `${process.env.NEXTAUTH_URL}/verify-email?verifyToken=${verificationToken}&id=${newUser?._id}`
    const message = verificationEmailTemplate(verificationLink)

    await sendEmail(newUser?.email, "Email Verification", message)

    console.log("User created successfully:", email)
    return NextResponse.json({ message: "User created successfully" }, { status: 201 })

  } catch (error) {
    console.error("Registration error:", error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: "An unexpected error occurred during registration", details: errorMessage },
      { status: 500 }
    )
  }
}
