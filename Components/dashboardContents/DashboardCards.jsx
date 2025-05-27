"use client";

import { useState, useEffect } from "react";
import { Card } from "@/Components/ui/card";
import axios from "axios";
import { CalendarDays, IndianRupee, AlertCircle, Users } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";

export default function DashboardCards() {
  const [metrics, setMetrics] = useState({
    totalBookings: 0,
    totalRevenue: 0,
    paymentPending: 0,
    totalEnquiries: 0,
  });

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      // Get current month's start and end dates
      const now = new Date();
      const monthStart = startOfMonth(now);
      const monthEnd = endOfMonth(now);

      // Fetch bookings for current month
      const bookingsResponse = await axios.get("/api/bookings");
      const currentMonthBookings = bookingsResponse.data.bookings.filter(booking => {
        const bookingDate = new Date(booking.createdAt);
        return bookingDate >= monthStart && bookingDate <= monthEnd;
      });

      // Fetch revenue data (already available in the format we need)
      const currentMonth = format(now, "MMM yyyy");
      const revenueResponse = await axios.get(`/api/financials/ledger-book?month=${now.getMonth() + 1}&year=${now.getFullYear()}`);
      
      // Fetch pending payments
      const transactionsResponse = await axios.get("/api/financials/transactions");
      const pendingPayments = transactionsResponse.data.transactions.filter(transaction => {
        const transactionDate = new Date(transaction.createdAt);
        return !transaction.isFullyPaid && 
               transactionDate >= monthStart && 
               transactionDate <= monthEnd;
      });

      // Fetch enquiries
      const enquiriesResponse = await axios.get("/api/crm");
      const currentMonthEnquiries = enquiriesResponse.data.contacts.filter(enquiry => {
        const enquiryDate = new Date(enquiry.createdAt);
        return enquiryDate >= monthStart && enquiryDate <= monthEnd;
      });

      setMetrics({
        totalBookings: currentMonthBookings.length,
        totalRevenue: revenueResponse.data.ledger?.totalIncome || 0,
        paymentPending: pendingPayments.length,
        totalEnquiries: currentMonthEnquiries.length,
      });
    } catch (error) {
      console.error("Error fetching metrics:", error);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="grid grid-cols-4 gap-6 mb-6">
      {/* Total Bookings */}
      <Card className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-hotel-primary rounded-lg">
            <CalendarDays className="h-6 w-6 text-[#F5F5F5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Bookings</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.totalBookings}</h3>
            <p className="text-xs text-gray-400 mt-1">This Month</p>
          </div>
        </div>
      </Card>

      {/* Total Revenue */}
      <Card className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-hotel-primary rounded-lg">
            <IndianRupee className="h-6 w-6 text-[#F5F5F5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Revenue</p>
            <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.totalRevenue)}</h3>
            <p className="text-xs text-gray-400 mt-1">This Month</p>
          </div>
        </div>
      </Card>

      {/* Payment Pending */}
      <Card className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-hotel-primary rounded-lg">
            <AlertCircle className="h-6 w-6 text-[#F5F5F5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Payment Pending</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.paymentPending}</h3>
            <p className="text-xs text-gray-400 mt-1">This Month</p>
          </div>
        </div>
      </Card>

      {/* No. of Enquiries */}
      <Card className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-hotel-primary rounded-lg">
            <Users className="h-6 w-6 text-[#F5F5F5]" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">No. of Enquiries</p>
            <h3 className="text-2xl font-bold text-gray-900">{metrics.totalEnquiries}</h3>
            <p className="text-xs text-gray-400 mt-1">This Month</p>
          </div>
        </div>
      </Card>
    </div>
  );
} 