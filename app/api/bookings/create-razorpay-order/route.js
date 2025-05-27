import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import ApiKeySchema from "../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function POST(request) {
  const { amount, currency } = await request.json();

  try {
    await getHotelDatabase();
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    const keys = await ApiKeys.findOne();

    let apiKey = keys?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_API_KEY;
    let secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Razorpay keys not found" },
        { status: 404 }
      );
    }

    const razorpay = new Razorpay({
      key_id: apiKey,
      key_secret: secretKey,
    });

    const options = {
      amount: Math.round(amount * 100), // Razorpay expects amount in paise
      currency: currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      apiKey: apiKey,
    });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay order" },
      { status: 500 }
    );
  }
}
