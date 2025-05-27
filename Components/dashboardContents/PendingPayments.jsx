"use client";

import { useState, useEffect } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import { Eye, FileEdit } from "lucide-react";
import { useRouter } from "next/navigation";
import DashboardTableSkeleton from "./DashboardTableSkeleton"

const columns = [
  {
    key: "customerName",
    label: "CUSTOMER NAME",
    allowsSorting: true,
  },
/*   {
    key: "mobileNo",
    label: "MOBILE NO.",
    allowsSorting: true,
  }, */
/*   {
    key: "totalBookings",
    label: "TOTAL BOOKINGS",
    allowsSorting: true,
  }, */
  {
    key: "lastBooking",
    label: "LAST BOOKING",
    allowsSorting: true,
  },
  {
    key: "totalAmount",
    label: "TOTAL AMOUNT",
    allowsSorting: true,
  },
  {
    key: "paidAmount",
    label: "PAID AMOUNT",
    allowsSorting: true,
  },
  {
    key: "status",
    label: "STATUS",
    allowsSorting: true,
  },
  {
    key: "actions",
    label: "ACTION",
    allowsSorting: false,
  },
];

export default function PendingPayments() {
  const router = useRouter();
  const [pendingPayments, setPendingPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      const response = await axios.get("/api/financials/transactions");
      if (response.data.success) {
        // Filter transactions where isFullyPaid is false
        const pendingTransactions = response.data.transactions
          .filter(transaction => !transaction.isFullyPaid)
          // Sort by createdAt date (most recent first)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          // Take only the last 5
          .slice(0, 5);
        setPendingPayments(pendingTransactions);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const renderCell = (item, columnKey) => {
    switch (columnKey) {
      case "customerName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.customerName}</p>
            <p className="text-bold text-tiny text-default-500">{item.bookingNumber}</p>
          </div>
        );
 /*      case "mobileNo":
        // Assuming the mobile number is stored in the transaction or needs to be displayed
        return "01"; // Placeholder mobile number as shown in the image */
  /*     case "totalBookings":
        return "01"; // This might need to be calculated from your bookings data */
      case "lastBooking":
        return formatDate(item.createdAt);
      case "totalAmount":
        return formatCurrency(item.payableAmount);
      case "paidAmount":
        return formatCurrency(item.totalPaid);
      case "status":
        return (
          <span className="bg-[#FFF2CC] text-[#FFA800] px-3 py-1 rounded-full text-xs font-medium">
            Pending
          </span>
        );
      case "actions":
        return (
          <div className="flex gap-2 justify-center">
            <Button
              size="sm"
              variant="flat"
              isIconOnly
              className="bg-hotel-primary text-white"
              onClick={() => router.push(`/dashboard/contacts/guest/${item.guestId}`)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return <DashboardTableSkeleton />;
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Pending Payments</CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          aria-label="Pending payments table"
          className="min-h-[400px]"
        >
          <TableHeader>
            {columns.map((column) => (
              <TableColumn 
                key={column.key}
                align={column.key === "actions" ? "center" : "start"}
                allowsSorting={column.allowsSorting}
                className="bg-hotel-primary text-white"
              >
                {column.label}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody 
            items={pendingPayments}
            emptyContent={"No pending payments found"}
          >
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => (
                  <TableCell>
                    {renderCell(item, columnKey)}
                  </TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 