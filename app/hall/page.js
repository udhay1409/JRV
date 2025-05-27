import axios from "axios";
import { headers } from "next/headers";
import OnlineHallBooking from "../../Components/OnlineRoomBooking/OnlineHallBooking";
import Facilities from "../../Components/home/Facilities";
import ExtraService from "../../Components/home/ExtraService";
import QuoteRequest from "../../Components/home/QuoteRequest";

export const metadata = {
  title: "Banquet Halls - Book Your Events",
  description: "Browse and book our spacious banquet halls for your special events.",
  keywords: "banquet halls, events, wedding halls, conference halls",
};

async function getHallData() {
  const headersList = headers();
  const host = headersList.get("host");
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;

  try {
    const response = await axios.get(`${baseUrl}/api/rooms`, {
      headers: {
        "x-api-key": process.env.API_KEY,
      },
    });

    // Filter halls from the rooms data
    const halls = response.data.rooms.filter(venue => venue.type === "hall");

    return { halls };
  } catch (error) {
    console.error("Error fetching hall data:", error);
    throw new Error(error.response?.data?.error || "Failed to fetch hall data");
  }
}

export default async function HallsPage() {
  try {
    const initialData = await getHallData();

    return (
      <>
        <section className="min-h-[calc(100vh-64px-80px)]">
          <OnlineHallBooking initialData={initialData} />
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
            Unable to load hall data. Please try again later.
          </p>
        </div>
      </div>
    );
  }
}
