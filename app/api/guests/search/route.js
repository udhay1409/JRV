import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import GuestInfo from "../../../../utils/model/contacts/guestInfoListSchema";
import { getModel } from "../../../../utils/helpers/getModel";

export async function GET(request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const email = searchParams.get("email");
    const phone = searchParams.get("phone");

    if (!email && !phone) {
      return NextResponse.json(
        { success: false, error: "Email or phone number is required" },
        { status: 400 }
      );
    }

    await getHotelDatabase();
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);

    // Construct query based on provided parameters
    const query = {
      $or: [],
    };
    if (email) query.$or.push({ email: { $regex: email, $options: "i" } });
    if (phone)
      query.$or.push({
        mobileNo: { $regex: phone.replace(/^\+/, ""), $options: "i" },
      });

    const guest = await GuestInfoModel.findOne(query).lean();

    if (!guest) {
      return NextResponse.json(
        { success: false, error: "No matching guest found" },
        { status: 404 }
      );
    }

    // Transform file URLs for consistency
    if (guest.uploadedFiles) {
      guest.uploadedFiles = guest.uploadedFiles.map((file) => ({
        ...file,
        fileUrl: `/assets/images/guestinfoList/${file.fileName}`,
      }));
    }

    return NextResponse.json({
      success: true,
      guest,
      message: "Guest found successfully",
    });
  } catch (error) {
    console.error("Error searching guest:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
