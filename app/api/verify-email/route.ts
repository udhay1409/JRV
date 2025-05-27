import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getHotelDatabase } from "../../../utils/config/hotelConnection";
import User from "../../../utils/model/nextauth/user.model"
import { getModel } from "../../../utils/helpers/getModel";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const verificationToken = searchParams.get("verifyToken");
    const userId = searchParams.get("id");

    if (!verificationToken || !userId) {
      return NextResponse.json(
        { message: "Missing required parameters" },
        { status: 400 }
      );
    }

    await getHotelDatabase();
    const UserModel = getModel("User", User);

    const verifyToken = crypto
      .createHash("sha256")
      .update(verificationToken)
      .digest("hex");

    const user = await UserModel.findOne({
      _id: userId,
      verifyToken,
      verifyTokenExpire: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired token" },
        { status: 400 }
      );
    }

    user.isVerified = true;
    user.verifyToken = undefined;
    user.verifyTokenExpire = undefined;

    await user.save();

    return NextResponse.json({ verified: true }, { status: 200 });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json(
      { message: "Something went wrong", error: (error as Error).message },
      { status: 500 }
    );
  }
}