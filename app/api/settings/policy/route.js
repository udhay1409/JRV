import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import PolicySchema from "../../../../utils/model/settings/policy/PolicySchema";
import { getModel } from "../../../../utils/helpers/getModel";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
  try {
    const { hotelData } = await getHotelDatabase();
    const PolicyModel = getModel("Policy", PolicySchema);

    let policy = await PolicyModel.findOne({}).lean();

    // Log the found policy

    // if (!policy) {
    //   policy = await PolicyModel.create({
    //     termsAndConditions: "Default terms and conditions",
    //     paymentPolicy: "Default payment policy",
    //     privacyPolicy: "Default privacy policy"
    //   });
    // }

    return NextResponse.json(
      {
        success: true,
        policy,
        hotelLogo: hotelData.logo || "",
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control":
            "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          "CDN-Cache-Control": "public, max-age=3600",
          "Vercel-CDN-Cache-Control": "public, max-age=3600",
        },
      }
    );
  } catch (error) {
    console.error("Error in policy endpoint:", error);

    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch policy",
        code: error.code || "INTERNAL_ERROR",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      {
        status: error.status || 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Cache-Control": "no-cache, no-store, must-revalidate",
        },
      }
    );
  }
}

export async function POST(request) {
  try {
    const { hotelData } = await getHotelDatabase();
    const PolicyModel = getModel("Policy", PolicySchema);

    const formData = await request.formData();
    const termsAndConditions = formData.get("termsAndConditions");
    const paymentPolicy = formData.get("paymentPolicy");
    const privacyPolicy = formData.get("privacyPolicy");

    if (!termsAndConditions || !paymentPolicy || !privacyPolicy) {
      return NextResponse.json(
        { success: false, error: "Invalid or missing form data" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const updatedPolicy = await PolicyModel.findOneAndUpdate(
      {},
      { termsAndConditions, paymentPolicy, privacyPolicy },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    );

    return NextResponse.json(
      {
        success: true,
        policy: updatedPolicy,
        hotelLogo: hotelData.logo || "",
        message: "Policy updated successfully",
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("Error processing policy:", error);
    const statusCode = error.name === "ValidationError" ? 400 : 500;
    const errorMessage =
      error.name === "ValidationError"
        ? `Validation error: ${error.message}`
        : error.message ||
          "An unexpected error occurred while processing the policy.";

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      {
        status: statusCode,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}
