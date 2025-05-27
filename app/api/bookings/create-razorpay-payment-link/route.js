import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import ApiKeySchema from "../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function POST(request) {
  const { amount, currency, customer } = await request.json();

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

    const paymentLinkOptions = {
      amount: amount * 100,
      currency: currency,
      accept_partial: false,
      expire_by: Math.floor(Date.now() / 1000) + 3600,
      reference_id: "booking_" + Date.now(),
      description: "Mahal Booking Payment",
      customer: {
        name: customer.name,
        email: customer.email,
        contact: customer.contact,
      },
      notify: {
        sms: true,
        email: true,
      },
      reminder_enable: true,
    };

    const paymentLink = await razorpay.paymentLink.create(paymentLinkOptions);

    return NextResponse.json({
      success: true,
      paymentLinkId: paymentLink.id,
      paymentLink: paymentLink.short_url,
    });
  } catch (error) {
    console.error("Error creating Razorpay payment link:", error);
    return NextResponse.json(
      { error: "Failed to create Razorpay payment link" },
      { status: 500 }
    );
  }
}
