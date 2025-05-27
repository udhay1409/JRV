
"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarIcon } from "lucide-react";
import MonthlyCalendar from "./monthlyCalendar";
import WeeklySchedule from "./weeklySchedule";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
// import { Calendar } from "@/Components/ui/calendar"
import { toast } from "react-toastify";
import CalendarViewSkeleton from "./CalendarViewSkeleton";

export default function CalendarView() {
  // Add state for occasions
  const [occasions, setOccasions] = useState([]);

  // Separate states for each calendar
  const [occasionsDate, setOccasionsDate] = useState(new Date());
  const [bookingsDate, setBookingsDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Separate handlers for each calendar
  const handleOccasionsPrevMonth = () => {
    setOccasionsDate(subMonths(occasionsDate, 1));
  };

  const handleOccasionsNextMonth = () => {
    setOccasionsDate(addMonths(occasionsDate, 1));
  };

  // Add function to check if we can go to previous month
  const canGoToPreviousMonth = (date) => {
    const today = new Date();
    const prevMonth = subMonths(date, 1);
    return (
      prevMonth.getMonth() >= today.getMonth() &&
      prevMonth.getFullYear() >= today.getFullYear()
    );
  };

  // Update the handlers to check for past months
  const handleBookingsPrevMonth = () => {
    if (canGoToPreviousMonth(bookingsDate)) {
      setBookingsDate(subMonths(bookingsDate, 1));
    }
  };

  // Update month navigation function
  const handleMonthChange = (direction) => {
    if (direction === "next") {
      setBookingsDate(addMonths(bookingsDate, 1));
    } else if (canGoToPreviousMonth(bookingsDate)) {
      setBookingsDate(subMonths(bookingsDate, 1));
    }
  };

  // Add useEffect to fetch occasions
  useEffect(() => {
    const fetchOccasions = async () => {
      try {
        const response = await axios.get("/api/settings/calendar");
        if (response.data.success) {
          setOccasions(response.data.data.occasions || []);
        }
      } catch (error) {
        console.error("Error fetching occasions:", error);
      }
    };

    fetchOccasions();
  }, []);

  // Modified fetchBookings to filter out checkout and cancelled
  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get("/api/bookings");
      if (response.data.success) {
        const formattedBookings = response.data.bookings
          .filter((booking) => ["booked", "checkin"].includes(booking.status))
          .map((booking) => {
            // Get all room/hall numbers for this booking
            const propertyNumbers = booking.rooms
              .map((room) => room.number)
              .sort((a, b) => a - b) // Sort numbers in ascending order
              .join(", "); // Join with comma and space

            // Create property ID with all numbers
            const propertyId =
              booking.propertyType === "hall"
                ? `HALL ${propertyNumbers}`
                : `ROOM ${propertyNumbers}`;

            return {
              id: booking.bookingNumber,
              propertyId,
              title: booking.status === "checkin" ? "Occupied" : "Booked",
              date: new Date(booking.checkInDate),
              type: booking.timeSlot?.name || "Full Day",
              subtitle:
                booking.eventType || `${booking.firstName} ${booking.lastName}`,
              color:
                booking.status === "checkin"
                  ? booking.propertyType === "hall"
                    ? "bg-yellow-200"
                    : "bg-blue-300"
                  : booking.propertyType === "hall"
                  ? "bg-orange-300"
                  : "bg-blue-200",
              propertyType: booking.propertyType,
            };
          });
        setBookings(formattedBookings);
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
      toast.error("Failed to fetch bookings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Get unique occasion names for the legend
  const uniqueOccasions = [
    ...new Set(
      occasions.map((occ) => ({
        name: occ.name,
        color: occ.color,
      }))
    ),
  ].reduce((acc, curr) => {
    if (!acc.find((item) => item.name === curr.name)) {
      acc.push(curr);
    }
    return acc;
  }, []);

  if (isLoading) {
    return <CalendarViewSkeleton />;
  }

  return (
    <div className="flex bg-gray-900">
      <div className="flex-1 flex flex-col bg-white">
        <div className="grid grid-cols-[300px,1fr] gap-4 m-4">
          {/* Occasions Calendar Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <button onClick={handleOccasionsPrevMonth} className="p-1">
                <ChevronLeft className="h-5 w-5" />
              </button>
              <h2 className="text-lg font-medium">
                {format(occasionsDate, "MMMM yyyy")}
              </h2>
              <button onClick={handleOccasionsNextMonth} className="p-1">
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>

            <MonthlyCalendar
              currentDate={occasionsDate}
              occasions={occasions}
            />
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Occasions</h3>
              <div className="space-y-3">
                {uniqueOccasions.map((occasion, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: occasion.color }}
                    />
                    <span className="text-sm capitalize">{occasion.name}</span>
                  </div>
                ))}
                {uniqueOccasions.length === 0 && (
                  <p className="text-sm text-gray-500">
                    No occasions configured
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Bookings Schedule Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">Schedule</h2>
              <div className="flex items-center gap-4">
                {/* Simple month navigation */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => handleMonthChange("prev")}
                    disabled={!canGoToPreviousMonth(bookingsDate)}
                    className={`h-8 w-8 ${
                      !canGoToPreviousMonth(bookingsDate)
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-lg font-medium">
                    {format(bookingsDate, "MMMM yyyy")}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onPress={() => handleMonthChange("next")}
                    className="h-8 w-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {/* Property type filter */}
                <Dropdown>
                  <DropdownTrigger className="hidden sm:flex">
                    <Button className="min-w-28 bg-hotel-secondary text-hotel-primary-text">
                      {selectedCategory === "all"
                        ? "All Category"
                        : selectedCategory === "hall"
                        ? "Hall"
                        : "Room"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu onAction={setSelectedCategory}>
                    <DropdownItem key="all">All Category</DropdownItem>
                    <DropdownItem key="hall">Hall</DropdownItem>
                    <DropdownItem key="room">Room</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
            </div>

            <WeeklySchedule
              currentDate={bookingsDate}
              category={selectedCategory}
              bookings={bookings}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
