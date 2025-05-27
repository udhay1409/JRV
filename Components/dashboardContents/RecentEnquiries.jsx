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
import { useRouter } from "next/navigation";
import DashboardTableSkeleton from "./DashboardTableSkeleton"
import { usePagePermission } from "../../hooks/usePagePermission";

const columns = [
  {
    key: "name",
    label: "NAME",
    allowsSorting: true,
  },
  {
    key: "email",
    label: "EMAIL",
    allowsSorting: true,
  },
  {
    key: "mobileno",
    label: "MOBILE NO",
    allowsSorting: true,
  },
  {
    key: "propertyType",
    label: "PROPERTY TYPE",
    allowsSorting: true,
  },
  {
    key: "eventDates",
    label: "EVENT DATES",
    allowsSorting: true,
  },
  {
    key: "eventType",
    label: "EVENT TYPE",
    allowsSorting: true,
  },
  {
    key: "notes",
    label: "NOTES",
    allowsSorting: true,
  },
  {
    key: "actions",
    label: "ACTION",
    allowsSorting: false,
  },
];

export default function RecentEnquiries() {
  const router = useRouter();
  const hasDashboardAddPermission = usePagePermission('Dashboard', 'add');
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentEnquiries();
  }, []);

  const fetchRecentEnquiries = async () => {
    try {
      const response = await axios.get("/api/crm");
      if (response.data.success) {
        // Sort enquiries by date (most recent first) and take only the last 5
        const sortedEnquiries = response.data.contacts
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);
        setEnquiries(sortedEnquiries);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching enquiries:", error);
      setLoading(false);
    }
  };

  const handleMoveToBooking = (contact) => {
    const queryParams = new URLSearchParams({
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      email: contact.email || "",
      mobileNo: contact.mobileno || "",
      notes: contact.notes || "",
    }).toString();

    router.push(`/dashboard/bookings/add-booking?${queryParams}`);
  };

  const formatEventDates = (dates) => {
    if (!dates) return "";
    try {
      if (typeof dates === "string") {
        // If it's already a string, return as is
        return dates;
      }
      if (Array.isArray(dates)) {
        // If it's an array of dates, join with ' - '
        return dates.join(" - ");
      }
      // If it's a date object, format it
      if (dates instanceof Date) {
        return dates.toLocaleDateString();
      }
      // If it's a date range object
      if (dates.startDate && dates.endDate) {
        return `${dates.startDate} - ${dates.endDate}`;
      }
      return "";
    } catch (error) {
      return "";
    }
  };

  const renderCell = (item, columnKey) => {
    switch (columnKey) {
      case "name":
        return item.firstName || item.name || "";
      case "email":
        return item.email;
      case "mobileno":
        return item.mobileno;
      case "propertyType":
        return item.propertyType?.toLowerCase() || "hall";
      case "eventDates":
        const startDate = item.eventStartDate
          ? new Date(item.eventStartDate).toLocaleDateString()
          : "";
        const endDate = item.eventEndDate
          ? new Date(item.eventEndDate).toLocaleDateString()
          : "";
        return startDate && endDate ? `${startDate} - ${endDate}` : "";
      case "eventType":
        return item.eventType?.toLowerCase() || "marriage";
      case "notes":
        const notes = item.notes || "gfdh";
        return (
          <div className="max-w-[200px] truncate" title={notes}>
            {notes}
          </div>
        );
      case "actions":
        return hasDashboardAddPermission ? (
          <Button
            size="sm"
            variant="flat"
            className="bg-hotel-primary text-white capitalize"
            onClick={() => handleMoveToBooking(item)}
          >
            MoveTo
          </Button>
        ) : null;
      default:
        return null;
    }
  };

  if (loading) {
    return <DashboardTableSkeleton />;
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Recent Enquiries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table aria-label="Recent enquiries table" className="min-h-[400px]">
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
          <TableBody items={enquiries} emptyContent={"No enquiries found"}>
            {(item) => (
              <TableRow key={item._id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
