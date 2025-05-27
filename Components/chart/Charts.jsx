"use client";

import { useEffect, useState, useRef } from "react";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LabelList,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/Components/ui/card";
import { Calendar, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../Components/ui/select";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  format,
  startOfDay,
  endOfDay,
} from "date-fns";
import axios from "axios";
import { SimpleCalendar } from "./SimpleCalendar.jsx";
import { DonutChart } from "./donut-chart.jsx";
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Button } from "@heroui/button";
import ChartsSkeleton from "./ChartsSkeleton";

// Remove the static revenueData constant and add these utility functions
const getLastNMonths = (n) => {
  const months = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
    months.push(format(date, "MMM yyyy"));
  }
  return months;
};

const calculateMonthlyRevenue = (bookings, months) => {
  const monthlyRevenue = {};

  // Initialize all months with zero revenue
  months.forEach((month) => {
    monthlyRevenue[month] = 0;
  });

  // Calculate revenue for each booking
  bookings.forEach((booking) => {
    if (booking.status === "checkout" && booking.totalAmount) {
      const bookingMonth = format(new Date(booking.checkOutDate), "MMM yyyy");
      if (monthlyRevenue.hasOwnProperty(bookingMonth)) {
        // Add the total amount from the booking
        monthlyRevenue[bookingMonth] += booking.totalAmount.total || 0;
      }
    }
  });

  // Convert to array format for the chart
  return months.map((month) => ({
    month,
    revenue: monthlyRevenue[month],
  }));
};

// Add a utility function for consistent number formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    maximumSignificantDigits: 8,
    style: "decimal",
  }).format(amount);
};

// Add this utility function to generate dates between two dates
const getDatesBetween = (startDate, endDate) => {
  const dates = [];
  let currentDate = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(endDate));

  while (currentDate <= end) {
    dates.push(new Date(currentDate));
    currentDate = addDays(currentDate, 1);
  }
  return dates;
};

// Add this utility function to group dates by week
const groupDatesByWeek = (dates) => {
  const weeks = {};
  dates.forEach((date) => {
    const weekStart = startOfWeek(new Date(date.rawDate || date.date));
    const weekKey = format(weekStart, "yyyy-MM-dd");
    if (!weeks[weekKey]) {
      weeks[weekKey] = {
        weekLabel: `${format(weekStart, "MMM dd")}`,
        booked: 0,
        available: 0,
        checkIn: 0,
        date: weekKey,
        weekStart: weekStart,
        weekEnd: endOfWeek(weekStart),
      };
    }
    weeks[weekKey].booked += date.booked || 0;
    weeks[weekKey].available = Math.max(date.available || 0, weeks[weekKey].available);
    weeks[weekKey].checkIn += date.checkIn || 0;
  });
  return Object.values(weeks);
};

// First, update the calculateYAxisTicks function to be more precise
const calculateYAxisTicks = (maxValue) => {
  // Find the order of magnitude
  const orderOfMagnitude = Math.pow(10, Math.floor(Math.log10(maxValue)));

  // Round up maxValue to next significant number
  const roundedMax = Math.ceil(maxValue / orderOfMagnitude) * orderOfMagnitude;

  // Calculate nice interval
  const roughInterval = roundedMax / 4;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughInterval)));
  const normalizedInterval = Math.ceil(roughInterval / magnitude) * magnitude;

  // Generate ticks
  const ticks = Array.from({ length: 5 }, (_, i) => i * normalizedInterval);

  return {
    ticks,
    domainMax: ticks[ticks.length - 1],
  };
};

// First, add this new component above your Charts component
const EmptyState = () => (
  <div className="flex flex-col items-center justify-center h-[300px] text-center p-4">
    <svg
      className="w-16 h-16 text-gray-300 mb-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
      />
    </svg>
    <h3 className="text-base font-medium text-gray-900 mb-1">
      No Rooms Available
    </h3>
    <p className="text-sm text-gray-500">
      There are no rooms configured for this hotel.
    </p>
  </div>
);

// Add this new function to fetch revenue data
const fetchRevenueData = async (period) => {
  try {
    const months = period === "last-6-months" ? 6 : 12;
    const monthsData = [];
    
    // Get current date
    const currentDate = new Date();
    
    // Fetch data for each month
    for (let i = months - 1; i >= 0; i--) {
      const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const month = targetDate.getMonth() + 1;
      const year = targetDate.getFullYear();
      
      const response = await axios.get(`/api/financials/ledger-book?month=${month}&year=${year}`);
      
      if (response.data.success) {
        monthsData.push({
          month: format(targetDate, "MMM yyyy"),
          revenue: response.data.ledger?.totalIncome || 0
        });
      }
    }
    
    return monthsData;
  } catch (error) {
    console.error("Error fetching revenue data:", error);
    return [];
  }
};

export default function Charts() {
  const [bookings, setBookings] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [selectedDateRange, setSelectedDateRange] = useState("this-week");
  const [customDateRange, setCustomDateRange] = useState(null);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calendarPosition, setCalendarPosition] = useState({ top: 0, left: 0 });
  const selectTriggerRef = useRef(null); // Ref for the Select Trigger
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [maxRooms, setMaxRooms] = useState(0);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [appliedDateRange, setAppliedDateRange] = useState(null);
  const [revenuePeriod, setRevenuePeriod] = useState("last-6-months");
  const [selectedHall, setSelectedHall] = useState("All Halls");
  const [donutDateRange, setDonutDateRange] = useState("this-week");
  const [donutCalendarOpen, setDonutCalendarOpen] = useState(false);
  const [appliedDonutRange, setAppliedDonutRange] = useState(null);
  const [selectedType, setSelectedType] = useState("hall");
  const [isLoading, setIsLoading] = useState(true);

  // Replace the static data with dynamic state
  const [bookingStats, setBookingStats] = useState({
    hall: { booked: 0, occupied: 0, available: 0 },
    room: { booked: 0, occupied: 0, available: 0 }
  });

  // Create donut chart data
  const chartData = [
    { name: "Booked", value: bookingStats[selectedType].booked, color: "#ff4e4e" },
    { name: "Occupied", value: bookingStats[selectedType].occupied, color: "#FF7A00" },
    { name: "Available", value: bookingStats[selectedType].available, color: "#A9A9A9" },
  ];

  // Fetch bookings data using hotelDb
  useEffect(() => {
    fetchData();
  }, [selectedDateRange, customDateRange, revenuePeriod]); // Add date range dependencies

  // Modify the fetchData function
  const fetchData = async () => {
    try {
      const [bookingsResponse, roomsResponse] = await Promise.all([
        axios.get(`/api/bookings`),
        axios.get(`/api/rooms`),
      ]);

      if (bookingsResponse.data.success && roomsResponse.data.rooms) {
        const rooms = roomsResponse.data.rooms;
        const totalRooms = rooms.reduce((total, room) => {
          return total + room.roomNumbers.length;
        }, 0);

        // Calculate revenue data
        const months = getLastNMonths(revenuePeriod === "last-year" ? 12 : 6); // Get last 6 months
        const revenueData = calculateMonthlyRevenue(
          bookingsResponse.data.bookings,
          months
        );
        setRevenue(revenueData);

        const today = new Date();
        const todayString = today.toISOString().split("T")[0];

        const checkInCount = bookingsResponse.data.bookings.reduce(
          (count, booking) => {
            const isToday =
              new Date(booking.checkInDate).toISOString().split("T")[0] ===
              todayString;
            if (
              booking.status === "checkin" ||
              (isToday && booking.status === "booked")
            ) {
              return count + booking.numberOfRooms;
            }
            return count;
          },
          0
        );

        const formattedData = formatBookingsData(
          bookingsResponse.data.bookings,
          totalRooms,
          checkInCount
        );

        setBookings(formattedData.bookings);
        setMaxRooms(totalRooms);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update formatBookingsData function
  const formatBookingsData = (
    rawBookings,
    totalRooms,
    checkInCount
  ) => {
    const bookingsByDate = {};
    const today = startOfDay(new Date());
    const todayString = format(today, "MMM dd, yyyy");

    // Initialize today's data
    bookingsByDate[todayString] = {
      date: todayString,
      booked: 0,
      checkIn: checkInCount,
      available: totalRooms - checkInCount,
    };

    // Process bookings
    rawBookings.forEach((booking) => {
      const bookingDate = format(new Date(booking.checkInDate), "MMM dd, yyyy");

      if (!bookingsByDate[bookingDate]) {
        bookingsByDate[bookingDate] = {
          date: bookingDate,
          booked: 0,
          checkIn: 0,
          available: totalRooms,
        };
      }

      if (booking.status === "booked") {
        bookingsByDate[bookingDate].booked += booking.numberOfRooms;
        // Recalculate available rooms
        bookingsByDate[bookingDate].available = Math.max(
          0,
          totalRooms -
            bookingsByDate[bookingDate].booked -
            bookingsByDate[bookingDate].checkIn
        );
      }
    });

    return {
      bookings: Object.values(bookingsByDate),
      maxRooms: totalRooms,
    };
  };

  // Add a utility function to ensure proper date parsing
  const parseDate = (dateString) => {
    const parsed = new Date(dateString);
    return parsed.getFullYear() < 2000 ? new Date() : parsed;
  };

  // Update fetchBarChartData to handle dates more accurately
  const fetchBarChartData = async () => {
    try {
      const roomsResponse = await axios.get('/api/rooms');

      if (roomsResponse.data.rooms) {
        const dateRange = getDateRange();
        
        // Filter rooms based on selectedType
        const filteredRooms = roomsResponse.data.rooms.filter(
          room => room.type === selectedType
        );
        
        // Calculate total rooms/halls available
        const totalCapacity = filteredRooms.reduce((total, room) => {
          return total + (selectedType === 'hall' ? 
            (room.hallNumbers?.length || 0) : 
            (room.roomNumbers?.length || 0));
        }, 0);

        setMaxRooms(totalCapacity);

        // Get all dates in the range
        const dates = getDatesBetween(dateRange.from, dateRange.to);
        
        // Initialize booking data for each date
        const bookingData = dates.map(date => ({
          date: format(date, "yyyy-MM-dd"),
          rawDate: date,
          booked: 0,
          available: totalCapacity
        }));

        // Process rooms data
        filteredRooms.forEach(room => {
          const numbers = selectedType === 'hall' ? room.hallNumbers : room.roomNumbers;

          if (!numbers) return;

          numbers.forEach(number => {
            if (!number.bookeddates) return;

            number.bookeddates.forEach(booking => {
              const bookingDate = new Date(booking.checkIn);
              if (bookingDate >= startOfDay(dateRange.from) && 
                  bookingDate <= endOfDay(dateRange.to)) {
                
                const dateStr = format(bookingDate, "yyyy-MM-dd");
                const dateEntry = bookingData.find(d => d.date === dateStr);
                
                if (dateEntry) {
                  // Count both 'booked' and 'checkin' status as booked for bar chart
                  if (booking.status === 'checkin' || booking.status === 'booked') {
                    dateEntry.booked++;
                    dateEntry.available--;
                  }
                  // If status is checkout, it counts as available
                }
              }
            });
          });
        });

        // Handle custom date range grouping
        const daysDifference = Math.ceil(
          (dateRange.to - dateRange.from) / (1000 * 60 * 60 * 24)
        );

        if (daysDifference > 14 && selectedDateRange === "custom") {
          // Group by week for longer ranges
          const weeklyData = groupDatesByWeek(bookingData);
          const processedWeeklyData = weeklyData.map(week => ({
            ...week,
            available: Math.max(0, totalCapacity - week.booked),
            weekRange: `${format(week.weekStart, "MMM dd, yyyy")} - ${format(week.weekEnd, "MMM dd, yyyy")}`
          }));
          setFilteredBookings(processedWeeklyData);
        } else {
          // Use daily data for shorter ranges
          const processedDailyData = bookingData.map(day => ({
            ...day,
            displayDate: format(new Date(day.date), "MMM dd, yyyy")
          }));
          setFilteredBookings(processedDailyData);
        }
      }
    } catch (error) {
      console.error('Error fetching bar chart data:', error);
    }
  };

  // Update useEffect to fetch both charts' data
  useEffect(() => {
    fetchDonutChartData();
    fetchBarChartData();
  }, [selectedType, donutDateRange, appliedDonutRange, selectedDateRange, appliedDateRange]);

  // Update handleDateRangeChange
  const handleDateRangeChange = (value) => {
    if (value === "custom") {
      setIsCalendarOpen(true);
    } else {
      setSelectedDateRange(value);
      fetchBarChartData();
    }
  };

  // Update handleDateSelect
  const handleDateSelect = (dateRange) => {
    setCustomDateRange(dateRange);
    setSelectedDateRange("custom");
    setAppliedDateRange(dateRange);
    setIsCalendarOpen(false);
    fetchBarChartData();
  };

  // Add a function to format the date range display
  const getDateRangeDisplay = () => {
    if (selectedDateRange === "custom" && appliedDateRange) {
      return `${format(appliedDateRange.from, "MMM dd")} - ${format(
        appliedDateRange.to,
        "MMM dd"
      )}`;
    }
    return selectedDateRange.replace(/-/g, " "); // Format other options
  };

  const getDateRange = () => {
    const today = new Date();
    switch (selectedDateRange) {
      case "today":
        return {
          from: startOfDay(today),
          to: endOfDay(today),
        };
      case "this-week":
        return {
          from: startOfWeek(today),
          to: endOfWeek(today),
        };
      case "next-week":
        const nextWeekStart = addDays(startOfWeek(today), 7);
        return {
          from: nextWeekStart,
          to: endOfWeek(nextWeekStart),
        };
      case "custom":
        return (
          customDateRange || {
            from: startOfDay(today),
            to: endOfDay(today),
          }
        );
      default:
        return {
          from: startOfWeek(today),
          to: endOfWeek(today),
        };
    }
  };

  // Add function to get date range for donut chart
  const getDonutDateRange = () => {
    const today = new Date();
    switch (donutDateRange) {
      case "today":
        return {
          from: startOfDay(today),
          to: endOfDay(today)
        };
      case "this-week":
        return {
          from: startOfWeek(today),
          to: endOfWeek(today)
        };
      case "next-week":
        const nextWeekStart = addDays(startOfWeek(today), 7);
        return {
          from: nextWeekStart,
          to: endOfWeek(nextWeekStart)
        };
      case "custom":
        return appliedDonutRange || {
          from: startOfDay(today),
          to: endOfDay(today)
        };
      default:
        return {
          from: startOfWeek(today),
          to: endOfWeek(today)
        };
    }
  };

  // Add function to fetch donut chart data
  const fetchDonutChartData = async () => {
    try {
      const roomsResponse = await axios.get('/api/rooms');

      if (roomsResponse.data.rooms) {
        const dateRange = getDonutDateRange();
        const totalRooms = {
          hall: 0,
          room: 0
        };

        // Calculate total rooms/halls
        roomsResponse.data.rooms.forEach(room => {
          if (room.type === 'hall') {
            totalRooms.hall += room.hallNumbers?.length || 0;
          } else {
            totalRooms.room += room.roomNumbers?.length || 0;
          }
        });

        // Initialize counts
        const counts = {
          hall: { booked: 0, occupied: 0, available: 0 },
          room: { booked: 0, occupied: 0, available: 0 }
        };

        // Process rooms data
        roomsResponse.data.rooms.forEach(room => {
          const type = room.type;
          const numbers = type === 'hall' ? room.hallNumbers : room.roomNumbers;

          if (!numbers) return;

          numbers.forEach(number => {
            if (!number.bookeddates) return;

            // Check all bookings within date range
            number.bookeddates.forEach(booking => {
              const bookingDate = new Date(booking.checkIn);
              const startDate = startOfDay(dateRange.from);
              const endDate = endOfDay(dateRange.to);

              // Check if booking date falls within the range
              if (bookingDate >= startDate && bookingDate <= endDate) {
                if (booking.status === 'checkin') {
                  counts[type].occupied++;
                } else if (booking.status === 'booked') {
                  counts[type].booked++;
                }
              }
            });
          });
        });

        // Calculate available properties
        counts.hall.available = totalRooms.hall - (counts.hall.booked + counts.hall.occupied);
        counts.room.available = totalRooms.room - (counts.room.booked + counts.room.occupied);

        setBookingStats(counts);
      }
    } catch (error) {
      console.error('Error fetching donut chart data:', error);
    }
  };

  // Add this function for donut chart date display
  const getDonutDateDisplay = () => {
    if (donutDateRange === "custom" && appliedDonutRange) {
      return `${format(appliedDonutRange.from, "MMM dd")} - ${format(
        appliedDonutRange.to,
        "MMM dd"
      )}`;
    }
    return donutDateRange.replace(/-/g, " ");
  };

  // Update useEffect to fetch revenue data when period changes
  useEffect(() => {
    const loadRevenueData = async () => {
      try {
        const months = revenuePeriod === "last-6-months" ? 6 : 12;
        const monthsData = [];
        
        // Get current date
        const currentDate = new Date();
        
        // Fetch data for each month
        for (let i = months - 1; i >= 0; i--) {
          const targetDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const month = targetDate.getMonth() + 1;
          const year = targetDate.getFullYear();
          
          const response = await axios.get(`/api/financials/ledger-book?month=${month}&year=${year}`);
          
          if (response.data.success) {
            monthsData.push({
              month: format(targetDate, "MMM yyyy"),
              revenue: response.data.ledger?.totalIncome || 0
            });
          }
        }
        
        setRevenue(monthsData);
      } catch (error) {
        console.error("Error fetching revenue data:", error);
        setRevenue([]);
      }
    };
    
    loadRevenueData();
  }, [revenuePeriod]);

  // Update the revenue chart section
  const RevenueDisplay = () => {
    const totalRevenue = revenue.reduce((sum, month) => sum + month.revenue, 0);

    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Revenue</CardTitle>
          <Select value={revenuePeriod} onValueChange={setRevenuePeriod}>
            <SelectTrigger className="w-[180px] bg-gray-50/50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <SelectValue>
                  {revenuePeriod === "last-year" ? "Last Year" : "Last 6 Months"}
                </SelectValue>
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-6-months">Last 6 Months</SelectItem>
              <SelectItem value="last-year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Centered "Total Revenue" label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-gray-200 rounded-md shadow p-3">
              <div className="text-sm font-semibold text-gray-500">
                Total Revenue
              </div>
              <div className="text-xl font-bold">₹{formatCurrency(totalRevenue)}</div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={revenue}
                margin={{
                  top: 20,
                  right: 30,
                  left: 70,
                  bottom: 30,
                }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  horizontal={true}
                />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  interval={revenuePeriod === "last-year" ? 1 : 0}
                  dy={10}
                  tick={{
                    fill: "#6B7280",
                    fontSize: 12,
                  }}
                />
                {(() => {
                  const { ticks, domainMax } = calculateYAxisTicks(
                    Math.max(...revenue.map((item) => item.revenue))
                  );
                  return (
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => {
                        if (value >= 10000000) {
                          return `₹${(value / 10000000).toFixed(1)}Cr`;
                        } else if (value >= 100000) {
                          return `₹${(value / 100000).toFixed(1)}L`;
                        } else if (value >= 1000) {
                          return `₹${(value / 1000).toFixed(0)}K`;
                        } else {
                          return `₹${value}`;
                        }
                      }}
                      tickMargin={12}
                      ticks={ticks}
                      domain={[0, domainMax]}
                      allowDecimals={false}
                      dx={-10}
                      tick={{
                        fill: "#6B7280",
                        fontSize: 12,
                      }}
                    />
                  );
                })()}
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #ccc",
                  }}
                  formatter={(value) => [`₹${formatCurrency(value)}`, "Revenue"]}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--hotel-primary)"
                  strokeWidth={2}
                  dot={revenuePeriod === "last-year"}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <ChartsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 3fr' }}>
        {/* Booking Status Card with Donut Chart */}
        <Card className="p-8 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <div className="flex justify-between items-start mb-8"> {/* Changed items-center to items-start */}
            <h2 className="text-2xl font-semibold text-gray-800 mr-4"> {/* Added mr-4 for right margin */}
              <div className="flex flex-col space-y-0.5"> {/* Added space-y-0.5 for slight spacing between lines */}
                <span>Booking</span>
                <span>Status</span>
              </div>
            </h2>
            <div className="flex items-center gap-4 ml-auto"> {/* Added ml-auto to push controls to the right */}
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="outline"
                    className="min-w-[130px] h-11 bg-gray-50/50 border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-between px-4 rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2 font-medium">
                      {selectedType === "hall" ? "Hall" : "Room"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Booking type selection"
                  onAction={(key) => setSelectedType(key)}
                  className="min-w-[130px]"
                >
                  <DropdownItem
                    key="hall"
                    className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Hall
                  </DropdownItem>
                  <DropdownItem
                    key="room"
                    className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Room
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Select
                value={donutDateRange}
                onValueChange={(value) => {
                  if (value === "custom") {
                    setDonutCalendarOpen(true);
                  } else {
                    setDonutDateRange(value);
                  }
                }}
              >
                <SelectTrigger className="w-[180px] h-11 bg-gray-50/50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <SelectValue className="font-medium">{getDonutDateDisplay()}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="next-week">Next week</SelectItem>
                  <SelectItem value="custom">
                    {donutDateRange === "custom" && appliedDonutRange
                      ? `${format(appliedDonutRange.from, "MMM dd")} - ${format(
                          appliedDonutRange.to,
                          "MMM dd"
                        )}`
                      : "Custom"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center justify-center w-[220px] h-[220px] relative">
              <DonutChart data={chartData} />
              {/* Add center stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-gray-800">
                  {bookingStats[selectedType].booked + bookingStats[selectedType].occupied}
                </span>
                <span className="text-xs text-gray-500">Total Bookings</span>
              </div>
            </div>

            <div className="space-y-6 px-4 min-w-[140px]">
              <div className="space-y-4">
                <div className="flex items-center gap-3 group hover:bg-gray-50/80 p-2.5 rounded-lg transition-all duration-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff4e4e] ring-4 ring-[#ff4e4e]/10"></div>
                  <div>
                    <span className="text-xl font-bold text-gray-800">
                      {bookingStats[selectedType].booked}
                    </span>
                    <p className="text-xs font-medium text-gray-500">Booked</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 group hover:bg-gray-50/80 p-2.5 rounded-lg transition-all duration-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF7A00] ring-4 ring-[#FF7A00]/10"></div>
                  <div>
                    <span className="text-xl font-bold text-gray-800">
                      {bookingStats[selectedType].occupied}
                    </span>
                    <p className="text-xs font-medium text-gray-500">Occupied</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 group hover:bg-gray-50/80 p-2.5 rounded-lg transition-all duration-200">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#A9A9A9] ring-4 ring-[#A9A9A9]/10"></div>
                  <div>
                    <span className="text-xl font-bold text-gray-800">
                      {bookingStats[selectedType].available}
                    </span>
                    <p className="text-xs font-medium text-gray-500">Available</p>
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  Total Capacity: {" "}
                  <span className="font-semibold text-gray-700">
                    {bookingStats[selectedType].booked + 
                     bookingStats[selectedType].occupied + 
                     bookingStats[selectedType].available}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Bookings Card */}
        <Card className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-800">
              <div className="flex flex-col">
                <span>{selectedType === 'hall' ? 'Hall' : 'Room'}</span>
                <span>Bookings Overview</span>
              </div>
            </CardTitle>
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#ff4e4e]" />
                  <span>Booked</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-sm bg-[#696969]" />
                  <span>Available</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Dropdown>
                <DropdownTrigger>
                  <Button
                    variant="outline"
                    className="min-w-[130px] h-11 bg-gray-50/50 border border-gray-200 text-gray-700 hover:bg-gray-100 flex items-center justify-between px-4 rounded-lg transition-all duration-200"
                  >
                    <span className="mr-2 font-medium">
                      {selectedType === "hall" ? "Hall" : "Room"}
                    </span>
                    <ChevronDown className="h-4 w-4 text-gray-500" />
                  </Button>
                </DropdownTrigger>
                <DropdownMenu
                  aria-label="Booking type selection"
                  onAction={(key) => {
                    setSelectedType(key);
                    fetchBarChartData();
                  }}
                  className="min-w-[130px]"
                >
                  <DropdownItem
                    key="hall"
                    className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Hall
                  </DropdownItem>
                  <DropdownItem
                    key="room"
                    className="px-4 py-2.5 text-sm hover:bg-gray-50 cursor-pointer"
                  >
                    Room
                  </DropdownItem>
                </DropdownMenu>
              </Dropdown>

              <Select
                value={selectedDateRange}
                onValueChange={handleDateRangeChange}
              >
                <SelectTrigger
                  ref={selectTriggerRef}
                  className="w-[180px] h-11 bg-gray-50/50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <SelectValue className="font-medium">{getDateRangeDisplay()}</SelectValue>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="this-week">This week</SelectItem>
                  <SelectItem value="next-week">Next week</SelectItem>
                  <SelectItem value="custom">
                    {selectedDateRange === "custom" && appliedDateRange
                      ? `${format(appliedDateRange.from, "MMM dd")} - ${format(
                          appliedDateRange.to,
                          "MMM dd"
                        )}`
                      : "Custom"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            {maxRooms > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={filteredBookings}
                  margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
                  barSize={32}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    vertical={false} 
                    stroke="#f1f1f1"
                  />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#404040", fontSize: 11, fontWeight: 500 }}
                    tickFormatter={(value) => {
                      if (selectedDateRange === "custom" && value.includes(" - ")) {
                        // For weekly view, show the week start date
                        return value.split(" - ")[0];
                      }
                      const date = parseDate(value);
                      // Remove time formatting for today's view since we don't have time data
                      return format(date, "MMM dd");
                    }}
                    interval={selectedDateRange === "custom" ? 0 : "preserveStartEnd"}
                    dy={8}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "#404040", fontSize: 11, fontWeight: 500 }}
                    ticks={Array.from({ length: maxRooms + 1 }, (_, i) => i)}
                    domain={[0, maxRooms]}
                    dx={-8}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0, 0, 0, 0.04)' }}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "none",
                      borderRadius: "8px",
                      boxShadow: "0 2px 12px -2px rgb(0 0 0 / 0.15)",
                      padding: "8px 12px",
                    }}
                    formatter={(value, name) => [
                      value,
                      name === "booked" ? "Booked" : "Available",
                    ]}
                    labelFormatter={(label) => {
                      if (selectedDateRange === "custom" && filteredBookings[0]?.weekRange) {
                        // For weekly view, show the full week range
                        const weekData = filteredBookings.find(d => d.date === label);
                        return weekData?.weekRange || format(parseDate(label), "MMMM dd, yyyy");
                      }
                      // For daily view, show the full date
                      return format(parseDate(label), "MMMM dd, yyyy");
                    }}
                    labelStyle={{ fontWeight: 500, marginBottom: 4 }}
                  />
                  <Bar
                    dataKey="booked"
                    stackId="a"
                    fill="#ff4e4e"
                    radius={[4, 4, 0, 0]}
                  >
                    <LabelList
                      dataKey="booked"
                      position="center"
                      fill="#FFFFFF"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) => (value > 0 ? value : '')}
                    />
                  </Bar>
                  <Bar
                    dataKey="available"
                    stackId="a"
                    fill="#696969"
                    radius={[0, 0, 4, 4]}
                  >
                    <LabelList
                      dataKey="available"
                      position="center"
                      fill="#FFFFFF"
                      fontSize={10}
                      fontWeight={600}
                      formatter={(value) => (value > 0 ? value : '')}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Card */}
      <RevenueDisplay />

      {/* Render calendar at root level */}
      {isCalendarOpen && (
        <SimpleCalendar
          onSelect={(dateRange) => {
            handleDateSelect(dateRange);
            setIsCalendarOpen(false);
          }}
          onClose={() => setIsCalendarOpen(false)}
          minDate={new Date()}
        />
      )}

      {donutCalendarOpen && (
        <SimpleCalendar
          onSelect={(dateRange) => {
            setDonutDateRange("custom");
            setAppliedDonutRange(dateRange);
            setDonutCalendarOpen(false);
          }}
          onClose={() => setDonutCalendarOpen(false)}
          minDate={new Date()}
        />
      )}
    </div>
  );
}
