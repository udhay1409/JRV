import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import { connectRazorpay } from "../../../../utils/config/connectRazorpay";
import ApiKeySchema from "../../../../utils/model/payementGateway/ApiKeySchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function GET() {
  try {
    await getHotelDatabase();
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    const keys = await ApiKeys.findOne().maxTimeMS(5000);

    let apiKey = keys?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_API_KEY;
    let secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { error: "Razorpay keys not found" },
        { status: 404 }
      );
    }

    try {
      const razorpay = await connectRazorpay(apiKey, secretKey);
      await razorpay.orders.all();
    } catch (razorpayError) {
      console.error("Error connecting to Razorpay:", razorpayError);
      return NextResponse.json(
        { error: "Failed to connect to Razorpay" },
        { status: 500 }
      );
    }

    return NextResponse.json({ apiKey, secretKey });
  } catch (error) {
    console.error("Error reading Razorpay keys:", error);
    return NextResponse.json(
      { error: "Failed to retrieve Razorpay keys" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const { apiKey, secretKey } = await request.json();

    if (!apiKey || !secretKey) {
      return NextResponse.json(
        { success: false, message: "API key and Secret key are required" },
        { status: 400 }
      );
    }

    // Validate API key format
    if (!apiKey.startsWith('rzp_') || apiKey.length < 20) {
      return NextResponse.json(
        { success: false, message: "Invalid Razorpay API key format" },
        { status: 400 }
      );
    }

    // Test connection with new keys before saving
    try {
      await connectRazorpay(apiKey, secretKey);
    } catch (error) {
      return NextResponse.json(
        { success: false, message: `Invalid Razorpay configuration: ${error.message}` },
        { status: 400 }
      );
    }

    await getHotelDatabase();
    const ApiKeys = getModel("ApiKeys", ApiKeySchema);
    
    await ApiKeys.findOneAndUpdate(
      {},
      { apiKey, secretKey },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Razorpay configuration updated successfully",
    });
  } catch (error) {
    console.error("Error updating Razorpay keys:", error);
    return NextResponse.json(
      { 
        success: false, 
        message: error.message || "Failed to update Razorpay configuration" 
      },
      { status: 500 }
    );
  }
}
