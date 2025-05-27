import { NextResponse } from "next/server";
import crypto from "crypto";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import ApiKeySchema from "../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function POST(request) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

  try {
    await getHotelDatabase();
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    const keys = await ApiKeys.findOne();

    let secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;

    if (!secretKey) {
      return NextResponse.json(
        { error: "Razorpay secret key not found" },
        { status: 404 }
      );
    }

    const shasum = crypto.createHmac("sha256", secretKey);
    shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
    const digest = shasum.digest("hex");

    if (digest === razorpay_signature) {
      return NextResponse.json({
        success: true,
        message: "Payment verified successfully",
      });
    } else {
      return NextResponse.json({
        success: false,
        message: "Payment verification failed",
      });
    }
  } catch (error) {
    console.error("Error verifying Razorpay payment:", error);
    return NextResponse.json(
      { error: "Failed to verify Razorpay payment" },
      { status: 500 }
    );
  }
}
