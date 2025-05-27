import { NextResponse } from "next/server";
import { getHotelDatabase } from "../../../../utils/config/hotelConnection";
import GuestInfo from "../../../../utils/model/contacts/guestInfoListSchema";
import { getModel } from "../../../../utils/helpers/getModel";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";

const UPLOAD_DIR = path.join(
  process.cwd(),
  "public/assets/images/guestinfoList"
);
const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "application/pdf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(request, { params }) {
  try {
    const { guestId } = params;

    await getHotelDatabase();
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);

    const guest = await GuestInfoModel.findOne({ guestId });

    if (!guest) {
      return NextResponse.json(
        { success: false, error: "Guest not found" },
        { status: 404 }
      );
    }

    // Ensure countryCode is present
    const countryCode = guest.countryCode || "+91";
    // Make sure mobileNo doesn't already include countryCode
    const mobileNo =
      guest.mobileNo && guest.mobileNo.startsWith(countryCode)
        ? guest.mobileNo
        : `${countryCode}${guest.mobileNo}`;

    return NextResponse.json({
      success: true,
      guest: {
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        mobileNo: mobileNo,
        countryCode: countryCode,
        address: guest.address,
        gender: guest.gender,
        dateOfBirth: guest.dateOfBirth,
        nationality: guest.nationality,
        verificationType: guest.verificationType,
        verificationId: guest.verificationId,
        notes: guest.notes,
        uploadedFiles: guest.uploadedFiles || [],
      },
    });
  } catch (error) {
    console.error("Error fetching guest:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  try {
    const { guestId } = params;

    // Check if the request is multipart/form-data
    const contentType = request.headers.get("content-type");
    if (contentType?.includes("multipart/form-data")) {
      const formData = await request.formData();
      const files = formData.getAll("files");

      // Validate files
      for (const file of files) {
        if (!ALLOWED_FILE_TYPES.includes(file.type)) {
          return NextResponse.json(
            {
              success: false,
              error: `Invalid file type: ${file.type}`,
            },
            { status: 400 }
          );
        }
        if (file.size > MAX_FILE_SIZE) {
          return NextResponse.json(
            {
              success: false,
              error: `File too large: ${file.name}`,
            },
            { status: 400 }
          );
        }
      }

      // Ensure upload directory exists
      await mkdir(UPLOAD_DIR, { recursive: true });

      // Process files
      const uploadedFiles = [];
      for (const file of files) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = path.join(UPLOAD_DIR, fileName);

        await writeFile(filePath, buffer);
        uploadedFiles.push({
          fileName,
          fileType: file.type,
          fileUrl: filePath,
          uploadDate: new Date(),
        });
      }

      // Update guest record with new files
      await getHotelDatabase();
      const GuestInfoModel = getModel("GuestInfo", GuestInfo);

      await GuestInfoModel.findOneAndUpdate(
        { guestId },
        {
          $push: {
            uploadedFiles: {
              $each: uploadedFiles,
            },
          },
        },
        { new: true }
      );

      return NextResponse.json({
        success: true,
        uploadedFiles,
        message: "Files uploaded successfully",
      });
    }

    // Handle regular data updates
    const data = await request.json();

    await getHotelDatabase();
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);

    // Only update non-history fields in GuestInfo
    const updateData = {
      name: data.name,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      mobileNo: data.mobileNo,
      address: data.address,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      nationality: data.nationality,
      verificationType: data.verificationType,
      verificationId: data.verificationId,
      notes: data.notes,
    };

    const updatedGuest = await GuestInfoModel.findOneAndUpdate(
      { guestId },
      { $set: updateData },
      { new: true }
    );

    if (!updatedGuest) {
      return NextResponse.json(
        { success: false, error: "Guest not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guest: updatedGuest,
      message: "Guest information updated successfully",
    });
  } catch (error) {
    console.error("Error updating guest:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request, { params }) {
  try {
    const { guestId } = params;
    const { fileName } = await request.json();

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "File name is required" },
        { status: 400 }
      );
    }

    await getHotelDatabase();
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);

    // Get the guest record first
    const guest = await GuestInfoModel.findOne({ guestId });
    if (!guest) {
      return NextResponse.json(
        { success: false, error: "Guest not found" },
        { status: 404 }
      );
    }

    // Check if file exists in guest's uploadedFiles
    const fileExists = guest.uploadedFiles.some(
      (file) => file.fileName === fileName
    );
    if (!fileExists) {
      return NextResponse.json(
        { success: false, error: "File not found in guest records" },
        { status: 404 }
      );
    }

    // Remove file from filesystem
    const filePath = path.join(UPLOAD_DIR, fileName);
    try {
      await unlink(filePath);
    } catch (error) {
      console.error("Error deleting file from filesystem:", error);
      // Continue with database update even if file deletion fails
    }

    // Remove file from database
    const updatedGuest = await GuestInfoModel.findOneAndUpdate(
      { guestId },
      {
        $pull: {
          uploadedFiles: { fileName: fileName },
        },
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "File removed successfully",
      guest: updatedGuest,
    });
  } catch (error) {
    console.error("Error removing file:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
