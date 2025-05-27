import axios from "axios";
import { headers } from "next/headers";
import OnlineRoomBooking from "../../Components/OnlineRoomBooking/OnlineRoomBooking";
import Facilities from "../../Components/home/Facilities";
import ExtraService from "../../Components/home/ExtraService";
import QuoteRequest from "../../Components/home/QuoteRequest";

export const metadata = {
  title: "Mahal Rooms - Book Your Stay",
  description:
    "Browse and book our luxurious mahal rooms. Find the perfect accommodation for your stay.",
  keywords: "mahal rooms, booking, accommodation, luxury rooms",
};

async function getRoomData() {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  try {
    const roomsResponse = await axios.get(`${baseUrl}/api/rooms`, {
      headers: {
        "x-api-key": process.env.API_KEY,
      },
    });

    const rooms = roomsResponse.data.rooms.filter(
      (room) => room.type === "room"
    );

    return { rooms };
  } catch (error) {
    console.error("Error fetching data:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch room data");
  }
}

export default async function RoomsPage() {
  try {
    const initialData = await getRoomData();

    return (
      <>
        <section className="min-h-[calc(100vh-64px-80px)]">
          <OnlineRoomBooking initialData={initialData} />
        </section>
        <Facilities />
        <ExtraService />
        <QuoteRequest />
      </>
    );
  } catch (error) {
    return (
      <div className="min-h-[calc(100vh-64px-80px)] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600">
            Unable to load room data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
