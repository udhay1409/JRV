import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { getHotelDatabase } from "../../../../../utils/config/hotelConnection";
import ApiKeySchema from "../../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../../utils/helpers/getModel";

export async function GET(request, { params }) {
  const { paymentLinkId } = params;

  if (!paymentLinkId) {
    return NextResponse.json(
      { success: false, message: "Payment link ID is required" },
      { status: 400 }
    );
  }

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

    const paymentLink = await razorpay.paymentLink.fetch(paymentLinkId);

    // Get payment details if the payment is paid
    let paidAmount = 0;
    if (paymentLink.status === "paid") {
      try {
        // Since fetchPayments is not available, use the amount from the payment link directly
        // or try to fetch payment details using a different method
        paidAmount = paymentLink.amount / 100;

        // Optionally, if you need specific payment details, you might use a different
        // Razorpay API endpoint to fetch payment details
        // This is commented out as the original method wasn't available
        /*
        const payments = await razorpay.payments.all({
          payment_link_id: paymentLinkId
        });
        
        if (payments.items && payments.items.length > 0) {
          paidAmount = payments.items[0].amount / 100;
        }
        */
      } catch (paymentError) {
        console.error("Error fetching payment details:", paymentError);
        // Fall back to the amount in the payment link
        paidAmount = paymentLink.amount / 100;
      }
    }

    return NextResponse.json({
      success: true,
      status: paymentLink.status,
      amount: paidAmount,
    });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return NextResponse.json(
      { error: "Failed to check payment status" },
      { status: 500 }
    );
  }
}
