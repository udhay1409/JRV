import { getModel } from "./getModel";
import Guest from "../model/booking/bookingSchema";
import GuestInfo from "../model/contacts/guestInfoListSchema";

/**
 * Generates or retrieves a unique guest ID based on email or mobile number
 * @param {Object} params - Guest identification parameters
 * @param {string} params.email - Guest's email address
 * @param {string} params.mobileNo - Guest's mobile number
 * @param {string} params.previousEmail - Previous email if updating
 * @param {string} params.previousMobile - Previous mobile if updating
 * @param {boolean} [params.updateBookings=false] - Whether to update booking records
 * @returns {Promise<string>} The guest ID
 */
export async function getUniqueGuestId({
  email,
  mobileNo,
  previousEmail,
  previousMobile,
  updateBookings = false,
}) {
  try {
    const GuestModel = getModel("Guest", Guest);
    const GuestInfoModel = getModel("GuestInfo", GuestInfo);
    const query = { $or: [] };

    // Build query conditions
    if (email) query.$or.push({ email: { $eq: email } });
    if (mobileNo) query.$or.push({ mobileNo: { $eq: mobileNo } });
    if (previousEmail) query.$or.push({ email: { $eq: previousEmail } });
    if (previousMobile) query.$or.push({ mobileNo: { $eq: previousMobile } });

    // Check both Guest and GuestInfo collections
    const [existingGuest, existingGuestInfo] = await Promise.all([
      GuestModel.findOne({
        $or: query.$or,
        guestId: { $exists: true },
      }).sort({ createdAt: 1 }),
      GuestInfoModel.findOne({
        $or: query.$or,
        guestId: { $exists: true },
      }).sort({ createdAt: 1 }),
    ]);

    const existingRecord = existingGuest || existingGuestInfo;

    if (existingRecord?.guestId) {
      // Only update booking records if explicitly requested
      if (
        updateBookings &&
        (email !== existingRecord.email || mobileNo !== existingRecord.mobileNo)
      ) {
        await Promise.all([
          GuestModel.updateMany(
            { guestId: existingRecord.guestId },
            {
              $set: {
                email: email || existingRecord.email,
                mobileNo: mobileNo || existingRecord.mobileNo,
              },
            }
          ),
          GuestInfoModel.updateMany(
            { guestId: existingRecord.guestId },
            {
              $set: {
                email: email || existingRecord.email,
                mobileNo: mobileNo || existingRecord.mobileNo,
              },
            }
          ),
        ]);
      }
      return existingRecord.guestId;
    }

    // If no existing guest, generate new ID
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const seconds = date.getSeconds().toString().padStart(2, "0");

    const timeStamp = `${day}${hours}${minutes}${seconds}`;
    const guestId = `G${year}${month}${timeStamp}`;

    return guestId;
  } catch (error) {
    console.error("Error generating guest ID:", error);
    throw new Error("Failed to generate guest ID");
  }
}
