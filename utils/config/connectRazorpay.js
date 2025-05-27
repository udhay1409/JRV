import Razorpay from "razorpay";
import { getHotelDatabase } from "./hotelConnection";
import ApiKeySchema from "../model/payementGateway/ApiKeySchema";
import { getModel } from "../helpers/getModel";

export async function connectRazorpay(testApiKey = null, testSecretKey = null) {
  try {
    let apiKey, secretKey;

    if (testApiKey && testSecretKey) {
      apiKey = testApiKey;
      secretKey = testSecretKey;
    } else {
    await getHotelDatabase();
      const ApiKeys = getModel("ApiKeys", ApiKeySchema);
      const keys = await ApiKeys.findOne();

      apiKey = keys?.apiKey || process.env.NEXT_PUBLIC_RAZORPAY_API_KEY;
      secretKey = keys?.secretKey || process.env.RAZORPAY_SECRET_KEY;
    }

    if (!apiKey || !secretKey) {
      throw new Error("Razorpay API key or secret key is missing");
    }

    // Validate key format
    if (!apiKey.startsWith('rzp_') || apiKey.length < 20) {
      throw new Error("Invalid Razorpay API key format");
    }

    const razorpay = new Razorpay({
      key_id: apiKey,
      key_secret: secretKey,
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Test the connection
    await razorpay.orders.all({ limit: 1 });
    return razorpay;
  } catch (error) {
    if (error.message.includes('invalid api key')) {
      throw new Error("Invalid Razorpay credentials");
    }
    throw error;
  }
}
