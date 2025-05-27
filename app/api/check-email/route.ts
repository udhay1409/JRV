

import { NextResponse } from "next/server"
import connectDb from "../../../utils/config/connectDB"
import User from "../../../utils/model/nextauth/user.model"
import { getModel } from "../../../utils/helpers/getModel"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

   await connectDb()
    const UserModel = getModel("User", User)

    // Check if user exists
    const exists = await UserModel.exists({ email })
    const registered = exists ? true : false

    return NextResponse.json({ exists, registered })
  } catch (error) {
    console.error("Error checking email:", error)
    return NextResponse.json({ error: "An error occurred while checking the email" }, { status: 500 })
  }
}