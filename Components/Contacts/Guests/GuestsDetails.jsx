"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Card, CardBody } from "@heroui/card";
import { DateRangePicker } from "@heroui/date-picker";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { useDisclosure } from "@heroui/use-disclosure";

import {
  Download,
  FileEdit,
  Upload,
  IndianRupee,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { Buttons } from "../../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";
import { cn } from "@/lib/utils";
import { PiFadersHorizontal } from "react-icons/pi";
import { FileText, FileSpreadsheet, FileJson, File } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import Invoice from "../../Invoice/InvoicePritnt";
import ConfirmationDialog from "../../ui/ConfirmationDialog";
import Link from "next/link";

// Add this utility function after imports
const getTailwindColor = (element, className) => {
  // Create a temporary element with the class
  const tempElement = document.createElement(element);
  tempElement.className = className;
  document.body.appendChild(tempElement);

  // Get the computed color
  const color = window.getComputedStyle(tempElement).backgroundColor;
  document.body.removeChild(tempElement);

  // Convert rgb(r, g, b) to [r, g, b]
  const match = color.match(/\d+/g);
  return match ? match.map(Number) : [41, 128, 185]; // fallback color if not found
};

const EXPORT_FIELDS = [
  "stayPeriod",
  "roomCategory",
  "roomNumber",
  "numberOfGuest",
  "paymentMethod",
  "amountPaid",
  "bookingId",
  "transactionId",
];

const BATCH_SIZE = 1000; // For handling large datasets

const processDataInBatches = (data, batchSize, processFunction) => {
  return new Promise((resolve, reject) => {
    try {
      const results = [];
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        results.push(...processFunction(batch));
      }
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
};

const formatDataForExport = (bookings) => {
  return bookings.map((booking) => {
    const formattedBooking = {};
    EXPORT_FIELDS.forEach((field) => {
      formattedBooking[field] = booking[field] || "N/A";
    });
    return formattedBooking;
  });
};

// Remove getDateFromString function as it won't be needed

// Add this helper function after the existing utility functions
const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function GuestProfile({ guestId }) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5); // Changed initial value to 5
  const [guestData, setGuestData] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [date, setDate] = useState({ from: null, to: null });
  const [transactionDate, setTransactionDate] = useState({
    from: null,
    to: null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    new Set([
      "stayPeriod",
      "propertyType",
      "roomNumber",
      "numberOfGuest",
      "paymentMethod",
      "amountPaid",
      "actions",
    ])
  );
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogState, setDeleteDialogState] = useState({
    isOpen: false,
    fileName: null,
  });
  const [selectedTab, setSelectedTab] = useState("bookings");
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionPage, setTransactionPage] = useState(1);
  const [transactionRowsPerPage, setTransactionRowsPerPage] = useState(5);
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  const columns = useMemo(
    () => [
      { name: "STAY PERIOD", uid: "stayPeriod" },
      { name: "PROPERTY TYPE", uid: "propertyType" },
      { name: "EVENT TYPE", uid: "eventType" },

      { name: "ROOM CATEGORY", uid: "roomCategory" },
      { name: "ROOM NUMBER", uid: "roomNumber" },
      { name: "NUMBER OF GUEST", uid: "numberOfGuest" },
      { name: "PAYMENT METHOD", uid: "paymentMethod" },
      { name: "AMOUNT PAID", uid: "amountPaid" },
      { name: "BOOKING ID", uid: "bookingId" },
      { name: "TRANSACTION ID", uid: "transactionId" },
      { name: "ACTIONS", uid: "actions" },
    ],
    []
  );

  // Move calculateTotals before handleDownloadPDF
  const calculateTotals = useMemo(() => {
    if (!filteredBookings.length) return { totalVisits: 0, totalAmount: 0 };

    return {
      totalVisits: filteredBookings.length,
      totalAmount: filteredBookings.reduce(
        (sum, booking) => sum + (booking.rawAmount || 0),
        0
      ),
    };
  }, [filteredBookings]);

  // Update calculatePendingAmount to check for partial payments
  const calculatePendingAmount = useMemo(() => {
    if (!transactionHistory || transactionHistory.length === 0) return 0;

    return transactionHistory.reduce((total, transaction) => {
      // Only include remaining balance if the transaction is not fully paid
      if (!transaction.isFullyPaid) {
        return total + (transaction.remainingBalance || 0);
      }
      return total;
    }, 0);
  }, [transactionHistory]);

  // Now handleDownloadPDF can access calculateTotals
  const handleDownloadPDF = useCallback(async () => {
    setIsExporting(true);
    try {
      const doc = new jsPDF("l", "mm", "a4");
      const formattedData = formatDataForExport(bookings).map((booking) => ({
        ...booking,
        amountPaid: formatCurrency(
          parseFloat(booking.amountPaid.replace(/[₹,]/g, ""))
        ),
      }));
      const hotelPrimaryColor = getTailwindColor("div", "bg-hotel-primary");

      // Add header
      doc.setFillColor(
        hotelPrimaryColor[0],
        hotelPrimaryColor[1],
        hotelPrimaryColor[2]
      );
      doc.rect(0, 0, doc.internal.pageSize.width, 25, "F");

      // Add title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(20);
      doc.setTextColor(255, 255, 255);
      doc.text("Guest Booking Details", 15, 15);

      // Add guest info
      doc.setFontSize(12);
      doc.setTextColor(60, 60, 60);
      doc.text(`Guest ID: ${guestId}`, 15, 35);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width - 65,
        35
      );

      // Add summary section
      const totalAmount = calculateTotals.totalAmount;
      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Bookings: ${calculateTotals.totalVisits}`, 15, 40);
      doc.text(
        `Total Amount: ${formatCurrency(totalAmount)}`,
        doc.internal.pageSize.width - 80,
        40
      );

      // Configure table
      doc.autoTable({
        head: [EXPORT_FIELDS.map((field) => field.toUpperCase())],
        body: formattedData.map((booking) =>
          EXPORT_FIELDS.map((field) => booking[field])
        ),
        startY: 45,
        theme: "grid",
        styles: {
          fontSize: 9,
          cellPadding: 3,
          lineColor: [80, 80, 80],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: hotelPrimaryColor,
          textColor: 255,
          fontSize: 10,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        columnStyles: {
          0: { cellWidth: 35 }, // stayPeriod
          1: { cellWidth: 30 }, // roomCategory
          2: { cellWidth: 25 }, // roomNumber
          3: { cellWidth: 25 }, // numberOfGuest
          4: { cellWidth: 30 }, // paymentMethod
          5: { cellWidth: 30, halign: "right", cellPadding: { right: 8 } }, // amountPaid
          6: { cellWidth: 30 }, // bookingId
          7: { cellWidth: 30 }, // transactionId
        },
        didDrawPage: (data) => {
          // Add footer on each page
          const pageCount = doc.internal.getNumberOfPages();
          doc.setFontSize(8);
          doc.setTextColor(70, 70, 70);
          doc.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            data.settings.margin.left,
            doc.internal.pageSize.height - 10
          );
        },
        margin: { top: 40, right: 15, bottom: 15, left: 15 },
      });

      doc.save(`guest-${guestId}-bookings.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [bookings, guestId, calculateTotals]);

  const handleDownloadExcel = useCallback(async () => {
    try {
      const formattedData = await processDataInBatches(
        bookings,
        BATCH_SIZE,
        formatDataForExport
      );
      const ws = XLSX.utils.json_to_sheet(formattedData);

      // Format header row
      const headerRange = XLSX.utils.decode_range(ws["!ref"]);
      for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!ws[address]) continue;
        ws[address].v = ws[address].v.toUpperCase();
      }

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Bookings");
      XLSX.writeFile(wb, `guest-${guestId}-bookings.xlsx`);
    } catch (error) {
      console.error("Error generating Excel:", error);
    }
  }, [bookings, guestId]);

  const downloadAsCsv = useCallback(async () => {
    try {
      const formattedData = await processDataInBatches(
        bookings,
        BATCH_SIZE,
        formatDataForExport
      );
      const parser = new Parser({
        fields: EXPORT_FIELDS,
        header: true,
      });

      const csv = parser.parse(formattedData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `guest-${guestId}-bookings.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating CSV:", error);
    }
  }, [bookings, guestId]);

  const downloadAsJson = useCallback(async () => {
    try {
      const formattedData = await processDataInBatches(
        bookings,
        BATCH_SIZE,
        formatDataForExport
      );
      const jsonString = JSON.stringify(formattedData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guest-${guestId}-bookings.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating JSON:", error);
    }
  }, [bookings, guestId]);

  const downloadAsTxt = useCallback(async () => {
    try {
      const formattedData = await processDataInBatches(
        bookings,
        BATCH_SIZE,
        formatDataForExport
      );
      const text = formattedData
        .map(
          (booking) =>
            EXPORT_FIELDS.map(
              (field) => `${field.toUpperCase()}: ${booking[field]}`
            ).join("\n") +
            "\n" +
            "-".repeat(50) +
            "\n"
        )
        .join("\n");

      const blob = new Blob([text], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `guest-${guestId}-bookings.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error generating TXT:", error);
    }
  }, [bookings, guestId]);

  const isValidDate = useCallback((date) => {
    return date instanceof Date && !isNaN(date);
  }, []);

  const parseDateSafely = useCallback(
    (dateStr) => {
      try {
        const date = new Date(dateStr);
        return isValidDate(date) ? date : null;
      } catch {
        return null;
      }
    },
    [isValidDate]
  );

  const handleDateChange = useCallback((range) => {
    if (!range || !range.start || !range.end) {
      setDate({
        from: null,
        to: null,
      });
      return;
    }

    const startDate = new Date(
      range.start.year,
      range.start.month - 1,
      range.start.day
    );
    const endDate = new Date(
      range.end.year,
      range.end.month - 1,
      range.end.day
    );

    setDate({
      from: startDate,
      to: endDate,
    });
  }, []);

  // Update handleTransactionDateChange
  const handleTransactionDateChange = useCallback((range) => {
    if (!range || !range.start || !range.end) {
      setTransactionDate({
        from: null,
        to: null,
      });
      return;
    }

    try {
      const startDate = new Date(
        range.start.year,
        range.start.month - 1,
        range.start.day
      );
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(
        range.end.year,
        range.end.month - 1,
        range.end.day
      );
      endDate.setHours(23, 59, 59, 999);

      setTransactionDate({
        from: startDate,
        to: endDate,
      });
    } catch (error) {
      console.error("Error setting transaction date range:", error);
      setTransactionDate({ from: null, to: null });
    }
  }, []);

  const filterBookingsByDateRange = useCallback((bookings, dateRange) => {
    // Show all bookings if no date range is selected
    if (!dateRange.from || !dateRange.to) return bookings;

    const rangeStart = new Date(dateRange.from);
    rangeStart.setHours(0, 0, 0, 0);

    const rangeEnd = new Date(dateRange.to);
    rangeEnd.setHours(23, 59, 59, 999);

    return bookings.filter((booking) => {
      // Parse the dates from DD/MM/YYYY format
      const [checkIn, checkOut] = booking.stayPeriod.split(" - ");
      const [dayIn, monthIn, yearIn] = checkIn.split("/");
      const [dayOut, monthOut, yearOut] = checkOut.split("/");

      const bookingStart = new Date(yearIn, monthIn - 1, dayIn);
      bookingStart.setHours(0, 0, 0, 0);

      const bookingEnd = new Date(yearOut, monthOut - 1, dayOut);
      bookingEnd.setHours(23, 59, 59, 999);

      // Check if the dates overlap
      return (
        (bookingStart <= rangeEnd && bookingEnd >= rangeStart) ||
        (rangeStart <= bookingEnd && rangeEnd >= bookingStart)
      );
    });
  }, []);

  // Update transaction date filtering
  useEffect(() => {
    try {
      if (!transactionHistory) {
        setFilteredTransactions([]);
        return;
      }

      if (!transactionDate.from || !transactionDate.to) {
        setFilteredTransactions(transactionHistory);
        return;
      }

      const rangeStart = new Date(transactionDate.from);
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(transactionDate.to);
      rangeEnd.setHours(23, 59, 59, 999);

      const filtered = transactionHistory.filter((transaction) => {
        if (!transaction.payments?.[0]?.paymentDate) return false;

        const paymentDate = new Date(transaction.payments[0].paymentDate);
        paymentDate.setHours(0, 0, 0, 0); // Normalize time to start of day

        return paymentDate >= rangeStart && paymentDate <= rangeEnd;
      });

      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      setFilteredTransactions(transactionHistory); // Fallback to showing all
    }
  }, [transactionDate, transactionHistory]);

  const fetchGuestData = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/api/guests?guestId=${guestId}`);

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch guest data");
      }

      const guest = data.guest;

      setGuestData({
        guestId: guest.guestId,
        name: guest.name,
        mobileNo: guest.mobileNo,
        email: guest.email,
        address: guest.address,
        dateOfBirth: guest.dateOfBirth,
        gender: guest.gender,
        nationality: guest.nationality,
        verificationType: guest.verificationType,
        verificationId: guest.verificationId,
        uploadedFiles: guest.uploadedFiles || [],
      });

      const transformedBookings = guest.stayHistory.map((stay) => ({
        id: stay.bookingId,
        bookingId: stay.bookingId,
        stayPeriod: `${new Date(
          stay.checkInDate
        ).toLocaleDateString()} - ${new Date(
          stay.checkOutDate
        ).toLocaleDateString()}`,
        roomCategory: stay.roomCategory || "N/A",
        propertyType: stay.propertyType || "N/A",
        eventType: stay.eventType || "N/A",
        roomNumber: stay.roomNumber || "N/A",
        numberOfGuest:
          typeof stay.numberOfGuest === "number" ? stay.numberOfGuest : "N/A",
        paymentMethod: stay.paymentMethod
          ? stay.paymentMethod.toUpperCase()
          : "N/A",
        rawAmount: stay.amount,
        amountPaid: `₹${(stay.amount || 0).toLocaleString("en-IN")}`,
        transactionId: stay.transactionId || "N/A",
        invoiceNumber: stay.invoiceNumber || null,
      }));

      setBookings(transformedBookings);
    } catch (error) {
      console.error("Error fetching guest data:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  // Add this new function to fetch transaction history for a guest
  const fetchTransactionHistory = useCallback(async () => {
    if (!guestId) return;

    setLoadingTransactions(true);
    try {
      const response = await axios.get(
        `/api/financials/transactions?guestId=${guestId}`
      );
      if (response.data.success) {
        setTransactionHistory(response.data.transactions || []);
      }
    } catch (error) {
      console.error("Error fetching transaction history:", error);
    } finally {
      setLoadingTransactions(false);
    }
  }, [guestId]);

  useEffect(() => {
    if (guestId) {
      const fetchInitialData = async () => {
        setLoading(true);
        try {
          await Promise.all([fetchGuestData(), fetchTransactionHistory()]);
        } catch (error) {
          console.error("Error fetching initial data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchInitialData();
    }
  }, [guestId, fetchGuestData, fetchTransactionHistory]);

  useEffect(() => {
    const filtered = filterBookingsByDateRange(bookings, date);
    setFilteredBookings(filtered);
    setPage(1); // Reset to first page when filter changes
  }, [date, bookings, filterBookingsByDateRange]);

  useEffect(() => {
    try {
      if (!transactionHistory) {
        setFilteredTransactions([]);
        return;
      }

      if (!transactionDate.from || !transactionDate.to) {
        setFilteredTransactions(transactionHistory);
        return;
      }

      const rangeStart = new Date(transactionDate.from);
      rangeStart.setHours(0, 0, 0, 0);

      const rangeEnd = new Date(transactionDate.to);
      rangeEnd.setHours(23, 59, 59, 999);

      const filtered = transactionHistory.filter((transaction) => {
        if (!transaction.payments?.[0]?.paymentDate) return false;

        const paymentDate = new Date(transaction.payments[0].paymentDate);
        paymentDate.setHours(0, 0, 0, 0); // Normalize time to start of day

        return paymentDate >= rangeStart && paymentDate <= rangeEnd;
      });

      setFilteredTransactions(filtered);
    } catch (error) {
      console.error("Error filtering transactions:", error);
      setFilteredTransactions(transactionHistory); // Fallback to showing all
    }
  }, [transactionDate, transactionHistory]);

  // Add a cleanup effect
  useEffect(() => {
    return () => {
      setGuestData(null);
      setError(null);
    };
  }, []);

  const paginatedBookings = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return filteredBookings.slice(start, end);
  }, [page, rowsPerPage, filteredBookings]);

  const transactionPages = useMemo(
    () => Math.ceil(filteredTransactions.length / transactionRowsPerPage),
    [filteredTransactions.length, transactionRowsPerPage]
  );

  const paginatedTransactions = useMemo(() => {
    const start = (transactionPage - 1) * transactionRowsPerPage;
    const end = start + transactionRowsPerPage;
    return filteredTransactions.slice(start, end);
  }, [transactionPage, transactionRowsPerPage, filteredTransactions]);

  const pages = Math.ceil(filteredBookings.length / rowsPerPage);

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const onTransactionRowsPerPageChange = useCallback((e) => {
    setTransactionRowsPerPage(Number(e.target.value));
    setTransactionPage(1);
  }, []);

  const downloadButton = useMemo(
    () => (
      <Dropdown>
        <DropdownTrigger>
          <Button
            isIconOnly
            variant="flat"
            className="bg-hotel-secondary"
            isLoading={isExporting}
          >
            {isExporting ? <Spinner size="sm" /> : <Download size={18} />}
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Download Options">
          <DropdownItem
            key="pdf"
            startContent={<FileText size={16} />}
            onPress={handleDownloadPDF}
          >
            PDF
          </DropdownItem>
          <DropdownItem
            key="excel"
            startContent={<FileSpreadsheet size={16} />}
            onPress={handleDownloadExcel}
          >
            Excel
          </DropdownItem>
          <DropdownItem
            key="csv"
            startContent={<FileText size={16} />}
            onPress={downloadAsCsv}
          >
            CSV
          </DropdownItem>
          <DropdownItem
            key="json"
            startContent={<FileJson size={16} />}
            onPress={downloadAsJson}
          >
            JSON
          </DropdownItem>
          <DropdownItem
            key="txt"
            startContent={<File size={16} />}
            onPress={downloadAsTxt}
          >
            TXT
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    ),
    [
      isExporting,
      handleDownloadPDF,
      handleDownloadExcel,
      downloadAsCsv,
      downloadAsJson,
      downloadAsTxt,
    ]
  );

  const handleShowInvoice = useCallback(
    async (bookingId) => {
      try {
        const response = await axios.get(
          `/api/financials/invoices?bookingNumber=${bookingId}`
        );
        if (response.data.success && response.data.invoices.length > 0) {
          setSelectedInvoice(response.data.invoices[0]);
          onOpen();
        } else {
          console.error("Invoice not found");
          // Optionally show a notification to the user
          alert("Invoice not found for this booking");
        }
      } catch (error) {
        console.error("Error fetching invoice:", error);
        alert("Error fetching invoice. Please try again.");
      }
    },
    [onOpen]
  );

  const renderCell = useCallback(
    (item, columnKey) => {
      if (columnKey === "actions") {
        return (
          <Button
            color="primary"
            className={`text-white rounded-md ${
              item.invoiceNumber && item.invoiceNumber !== "N/A"
                ? "bg-hotel-primary"
                : "bg-gray-400 cursor-not-allowed"
            }`}
            onClick={() => handleShowInvoice(item.bookingId)}
            disabled={!item.invoiceNumber || item.invoiceNumber === "N/A"}
          >
            Invoice
          </Button>
        );
      }
      return item[columnKey];
    },
    [handleShowInvoice]
  );

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedData({
      name: guestData.name,
      mobileNo: guestData.mobileNo,
      email: guestData.email,
      address: guestData.address,
      dateOfBirth: guestData.dateOfBirth,
      gender: guestData.gender,
      nationality: guestData.nationality,
      verificationType: guestData.verificationType,
      verificationId: guestData.verificationId,
    });
  };

  const handleSaveClick = async () => {
    try {
      // Update local state first
      setGuestData((prev) => ({ ...prev, ...editedData }));
      setIsEditing(false);

      // Make API call with all edited data including address
      const response = await axios.put(`/api/guests/${guestId}`, editedData, {
        headers: {
          "Content-Type": "application/json", // Explicitly set content type
        },
      });

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update guest");
      }

      // Refresh data from server to ensure sync
      await fetchGuestData();
    } catch (error) {
      console.error("Error updating guest:", error);
      // Revert to previous state on error
      await fetchGuestData();
      setError(error.message);
    }
  };

  const handleFileUpload = async (event) => {
    const files = event.target.files;
    if (!files.length) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await axios.put(`/api/guests/${guestId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.data.success) {
        // Update the local state with new file information
        setGuestData((prev) => ({
          ...prev,
          uploadedFiles: [
            ...(prev.uploadedFiles || []),
            ...response.data.uploadedFiles,
          ],
        }));
      }
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleDeleteClick = (fileName) => {
    setDeleteDialogState({
      isOpen: true,
      fileName,
    });
  };

  const handleConfirmDelete = async () => {
    const fileName = deleteDialogState.fileName;
    setIsDeleting(true);
    try {
      const response = await axios.delete(`/api/guests/${guestId}`, {
        data: { fileName },
      });

      if (response.data.success) {
        setGuestData((prev) => ({
          ...prev,
          uploadedFiles: prev.uploadedFiles.filter(
            (file) => file.fileName !== fileName
          ),
        }));
      } else {
        throw new Error(response.data.error || "Failed to delete file");
      }
    } catch (error) {
      console.error("Error deleting file:", error);
      alert("Error deleting file. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!guestData) return <div>No guest data found</div>;

  return (
    <>
      <div className="flex bg-white p-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
        <div className="w-1/4 p-8 bg-hotel-primary-bg rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
          <h2 className="text-xl font-medium mb-6">Profile</h2>

          <div className="bg-white p-4 rounded-lg mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <div className="flex justify-between mb-4">
              <div className="text-hotel-secondary-grey text-sm">
                {guestData.guestId}
              </div>

              {isEditing ? (
                <div className="flex gap-2">
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={handleSaveClick}
                    className="text-green-600"
                  >
                    ✓
                  </Button>
                  <Button
                    isIconOnly
                    variant="light"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="text-red-600"
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  onClick={handleEditClick}
                >
                  <FileEdit size={18} />
                </Button>
              )}
            </div>

            {isEditing ? (
              <>
                <Input
                  className="mb-4"
                  value={editedData.name}
                  onChange={(e) =>
                    setEditedData({ ...editedData, name: e.target.value })
                  }
                  label="Name"
                />
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                  </svg>
                  <Input
                    value={editedData.mobileNo}
                    onChange={(e) =>
                      setEditedData({ ...editedData, mobileNo: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                  </svg>
                  <Input
                    value={editedData.email}
                    onChange={(e) =>
                      setEditedData({ ...editedData, email: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                  </svg>
                  <Input
                    value={editedData.address}
                    onChange={(e) =>
                      setEditedData({ ...editedData, address: e.target.value })
                    }
                  />
                </div>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-semibold mb-4">
                  {guestData.name}
                </h3>

                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.568 17.568 0 0 0 4.168 6.608 17.569 17.569 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.678.678 0 0 0-.58-.122l-2.19.547a1.745 1.745 0 0 1-1.657-.459L5.482 8.062a1.745 1.745 0 0 1-.46-1.657l.548-2.19a.678.678 0 0 0-.122-.58L3.654 1.328zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.678.678 0 0 0 .178.643l2.457 2.457a.678.678 0 0 0 .644.178l2.189-.547a1.745 1.745 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.634 18.634 0 0 1-7.01-4.42 18.634 18.634 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877L1.885.511z" />
                  </svg>
                  <span>{guestData.mobileNo}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-3">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M0 4a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2V4Zm2-1a1 1 0 0 0-1 1v.217l7 4.2 7-4.2V4a1 1 0 0 0-1-1H2Zm13 2.383-4.708 2.825L15 11.105V5.383Zm-.034 6.876-5.64-3.471L8 9.583l-1.326-.795-5.64 3.47A1 1 0 0 0 2 13h12a1 1 0 0 0 .966-.741ZM1 11.105l4.708-2.897L1 5.383v5.722Z" />
                  </svg>
                  <span>{guestData.email}</span>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8 16s6-5.686 6-10A6 6 0 0 0 2 6c0 4.314 6 10 6 10zm0-7a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" />
                  </svg>
                  <span>{guestData.address}</span>
                </div>
              </>
            )}
          </div>

          <div className="bg-white p-4 rounded-lg mb-8 shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <h3 className="font-semibold mb-4">Personal Information</h3>

            <div className="grid grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Date of Birth
                    </div>
                    <Input
                      type="date"
                      value={editedData.dateOfBirth || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          dateOfBirth: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Gender
                    </div>
                    <select
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editedData.gender || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          gender: e.target.value,
                        })
                      }
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Nationality
                    </div>
                    <Input
                      value={editedData.nationality || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          nationality: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      ID Type
                    </div>
                    <select
                      className="w-full rounded-md border border-gray-300 p-2"
                      value={editedData.verificationType || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          verificationType: e.target.value,
                        })
                      }
                    >
                      <option value="">Select ID Type</option>
                      <option value="Aadhar">Aadhar</option>
                      <option value="Passport">Passport</option>
                      {/* <option value="Driving License">Driving License</option>
                      <option value="Voter ID">Voter ID</option> */}
                    </select>
                  </div>
                  <div className="col-span-2">
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      ID Number
                    </div>
                    <Input
                      value={editedData.verificationId || ""}
                      onChange={(e) =>
                        setEditedData({
                          ...editedData,
                          verificationId: e.target.value,
                        })
                      }
                      placeholder="Enter ID number"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Date of Birth
                    </div>
                    <div>{format(guestData.dateOfBirth, "MMM dd, yyyy")}</div>
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Gender
                    </div>
                    <div>{guestData.gender}</div>
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      Nationality
                    </div>
                    <div>{guestData.nationality}</div>
                  </div>
                  <div>
                    <div className="text-xs text-hotel-secondary-grey mb-1">
                      {guestData.verificationType}
                    </div>
                    <div>{guestData.verificationId}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
            <h3 className="font-semibold mb-4">ID Proof Information</h3>

            {isEditing ? (
              <div className="space-y-4">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                  accept="image/*,.pdf"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex items-center justify-center w-full p-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-hotel-primary"
                >
                  <Upload size={16} className="mr-2" />
                  <span>Upload New Files</span>
                </label>

                {/* Display existing files with delete option */}
                <div className="mt-4 space-y-2">
                  {guestData.uploadedFiles?.map((file, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <span className="text-sm text-gray-600 truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                      <div className="flex gap-2">
                        <a
                          href={
                            file.fileUrl ||
                            `/assets/images/booking/guest_files/${file.fileName}`
                          }
                          download
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Download size={16} />
                        </a>
                        <Button
                          isIconOnly
                          size="sm"
                          color="danger"
                          variant="light"
                          isLoading={isDeleting}
                          onClick={() => handleDeleteClick(file.fileName)}
                          className="text-red-600 hover:text-red-800"
                        >
                          ✕
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // Display mode remains unchanged
              guestData.uploadedFiles?.map((file, index) => (
                <div
                  key={index}
                  className="text-sm text-gray-600 mb-3 flex justify-between items-center"
                >
                  <span>{file.fileName}</span>
                  <a
                    href={
                      file.fileUrl ||
                      `/assets/images/booking/guest_files/${file.fileName}`
                    }
                    download
                    className="cursor-pointer"
                  >
                    <Download size={16} />
                  </a>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="w-3/4 p-8">
          <h2 className="text-xl font-medium mb-6">Overview</h2>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <CardBody className="flex flex-row justify-between items-center p-4">
                <div>
                  <div className="text-sm text-gray-500">Total Visit</div>
                  <div className="text-2xl font-bold">
                    {calculateTotals.totalVisits}
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  className="text-black bg-hotel-secondary"
                >
                  <IndianRupee size={18} />{" "}
                </Button>
              </CardBody>
            </Card>

            <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <CardBody className="flex flex-row justify-between items-center p-4">
                <div>
                  <div className="text-sm text-gray-500">
                    Total Amount Spent- Bookings
                  </div>
                  <div className="text-2xl font-bold">
                    ₹{calculateTotals.totalAmount.toLocaleString("en-IN")}
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  className="text-black bg-hotel-secondary"
                >
                  <IndianRupee size={18} />{" "}
                </Button>
              </CardBody>
            </Card>
            <Card className="bg-white shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
              <CardBody className="flex flex-row justify-between items-center p-4">
                <div>
                  <div className="text-sm text-gray-500">Pending&apos;s</div>
                  <div className="text-2xl font-bold">
                    {formatCurrency(calculatePendingAmount)}
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  className="text-black bg-hotel-secondary"
                >
                  <IndianRupee size={18} />{" "}
                </Button>
              </CardBody>
            </Card>
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="flex gap-4">
                <button
                  className={`py-2 px-4 font-medium ${
                    selectedTab === "bookings"
                      ? "text-hotel-primary border-b-2 border-hotel-primary"
                      : "text-gray-600 hover:text-hotel-primary"
                  }`}
                  onClick={() => setSelectedTab("bookings")}
                >
                  Booking History
                </button>
                <button
                  className={`py-2 px-4 font-medium ${
                    selectedTab === "transactions"
                      ? "text-hotel-primary border-b-2 border-hotel-primary"
                      : "text-gray-600 hover:text-hotel-primary"
                  }`}
                  onClick={() => setSelectedTab("transactions")}
                >
                  Transaction History
                </button>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {/* Tabs navigation */}

              {/* Action buttons - only show filter controls for bookings tab */}
              <div className="flex gap-2">
                {selectedTab === "bookings" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <DateRangePicker
                        className="min-w-[40px]"
                        classNames={{
                          base: "bg-white rounded-lg", // Changed from bg-hotel-secondary
                          trigger: "h-9 w-9 min-h-9 min-w-9 p-0",
                          triggerContent:
                            "flex h-full items-center justify-center",
                          dropdown: "bg-white rounded-lg shadow-lg",
                          monthHeader: "text-hotel-primary-text",
                          calendar: "bg-white",
                          weekDays: "text-hotel-primary-text",
                          dayButton: {
                            base: "text-hotel-primary-text hover:bg-hotel-secondary-hover",
                            today: "text-hotel-primary",
                            selected:
                              "bg-hotel-primary text-white hover:!bg-hotel-primary",
                            rangeStart: "rounded-l-lg",
                            rangeEnd: "rounded-r-lg",
                            rangeMiddle: "bg-hotel-primary/20",
                          },
                        }}
                        placeholder=""
                        onChange={handleDateChange}
                        popoverProps={{
                          placement: "bottom-start",
                          offset: 5,
                          radius: "lg",
                          backdrop: "opaque",
                        }}
                        triggerContent={<Calendar size={18} />}
                      />

                      <Dropdown>
                        <DropdownTrigger>
                          <Button className="bg-hotel-secondary">
                            <PiFadersHorizontal />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu
                          disallowEmptySelection
                          aria-label="Table Columns"
                          closeOnSelect={false}
                          selectedKeys={visibleColumns}
                          selectionMode="multiple"
                          onSelectionChange={setVisibleColumns}
                        >
                          {columns.map((column) => (
                            <DropdownItem
                              key={column.uid}
                              className="capitalize"
                            >
                              {column.name}
                            </DropdownItem>
                          ))}
                        </DropdownMenu>
                      </Dropdown>

                      {downloadButton}
                      <Link
                        href={`/dashboard/bookings/add-booking?email=${guestData.email}`}
                      >
                        <Button className="bg-yellow-400 text-black">
                          Add Booking
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}

                {selectedTab === "transactions" && (
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <DateRangePicker
                        className="min-w-[40px]"
                        classNames={{
                          base: "bg-white rounded-lg", // Changed from bg-hotel-secondary
                          trigger: "h-9 w-9 min-h-9 min-w-9 p-0",
                          triggerContent:
                            "flex h-full items-center justify-center",
                          dropdown: "bg-white rounded-lg shadow-lg",
                          monthHeader: "text-hotel-primary-text",
                          calendar: "bg-white",
                          weekDays: "text-hotel-primary-text",
                          dayButton: {
                            base: "text-hotel-primary-text hover:bg-hotel-secondary-hover",
                            today: "text-hotel-primary",
                            selected:
                              "bg-hotel-primary text-white hover:!bg-hotel-primary",
                            rangeStart: "rounded-l-lg",
                            rangeEnd: "rounded-r-lg",
                            rangeMiddle: "bg-hotel-primary/20",
                          },
                        }}
                        placeholder=""
                        onChange={handleTransactionDateChange}
                        popoverProps={{
                          placement: "bottom-start",
                          offset: 5,
                          radius: "lg",
                          backdrop: "opaque",
                        }}
                        triggerContent={<Calendar size={18} />}
                      />

                      <Link
                        href={`/dashboard/financials/invoices/record-payement?customerSearch=${encodeURIComponent(
                          guestData.name
                        )}`}
                      >
                        <Button className="bg-yellow-400 text-black">
                          Record Payment
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>{" "}
          <div className="shadow-[0_2px_12px_rgba(0,0,0,0.08)] rounded-lg overflow-hidden">
            {selectedTab === "bookings" ? (
              // Bookings Table
              <Table
                aria-label="Bookings history table"
                bottomContent={
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        Rows per page:{" "}
                        <select
                          className="bg-transparent outline-none text-default-400"
                          onChange={onRowsPerPageChange}
                          value={rowsPerPage}
                        >
                          <option value="5">5</option>
                          <option value="10">10</option>
                          <option value="15">15</option>
                        </select>
                      </span>
                      <span className="text-sm text-gray-500">
                        Showing{" "}
                        {Math.min(
                          (page - 1) * rowsPerPage + 1,
                          filteredBookings.length
                        )}
                        -{Math.min(page * rowsPerPage, filteredBookings.length)}{" "}
                        of {filteredBookings.length}
                      </span>
                    </div>
                    <Pagination
                      showControls
                      classNames={{
                        cursor: "bg-hotel-primary",
                        item: "text-gray-600 hover:text-hotel-primary",
                        next: "text-hotel-primary",
                        prev: "text-hotel-primary",
                      }}
                      page={page}
                      total={pages}
                      onChange={setPage}
                    />
                  </div>
                }
              >
                <TableHeader>
                  {Array.from(visibleColumns).map((columnKey) => (
                    <TableColumn
                      key={columnKey}
                      className="bg-hotel-primary text-white font-medium"
                    >
                      {columns.find((col) => col.uid === columnKey)?.name}
                    </TableColumn>
                  ))}
                </TableHeader>
                <TableBody items={paginatedBookings}>
                  {(item) => (
                    <TableRow key={item.id}>
                      {Array.from(visibleColumns).map((columnKey) => (
                        <TableCell key={columnKey}>
                          {renderCell(item, columnKey)}
                        </TableCell>
                      ))}
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            ) : (
              // Transaction History Table
              <>
                {" "}
                {loadingTransactions ? (
                  <div className="flex justify-center py-8">
                    <Spinner size="lg" />
                  </div>
                ) : transactionHistory.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No transaction records found for this guest
                  </div>
                ) : (
                  <Table
                    aria-label="Transaction history"
                    bottomContent={
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">
                            Rows per page:{" "}
                            <select
                              className="bg-transparent outline-none text-default-400"
                              onChange={onTransactionRowsPerPageChange}
                              value={transactionRowsPerPage}
                            >
                              <option value="5">5</option>
                              <option value="10">10</option>
                              <option value="15">15</option>
                            </select>
                          </span>
                          <span className="text-sm text-gray-500">
                            {filteredTransactions.length > 0
                              ? `Showing ${Math.min(
                                  (transactionPage - 1) *
                                    transactionRowsPerPage +
                                    1,
                                  filteredTransactions.length
                                )}-${Math.min(
                                  transactionPage * transactionRowsPerPage,
                                  filteredTransactions.length
                                )} of ${filteredTransactions.length}`
                              : "No results"}
                          </span>
                        </div>
                        {transactionPages > 0 && (
                          <Pagination
                            showControls
                            classNames={{
                              cursor: "bg-hotel-primary",
                              item: "text-gray-600 hover:text-hotel-primary",
                              next: "text-hotel-primary",
                              prev: "text-hotel-primary",
                            }}
                            page={transactionPage}
                            total={transactionPages}
                            onChange={setTransactionPage}
                          />
                        )}
                      </div>
                    }
                  >
                    <TableHeader>
                      <TableColumn key="bookingNumber">BOOKING ID</TableColumn>
                      <TableColumn key="date">DATE</TableColumn>
                      <TableColumn key="paymentMethod">
                        PAYMENT METHOD
                      </TableColumn>
                      <TableColumn key="paymentType">PAYMENT TYPE</TableColumn>
                      <TableColumn key="amount">AMOUNT</TableColumn>
                      <TableColumn key="status">STATUS</TableColumn>
                      <TableColumn key="transactionId">
                        TRANSACTION ID
                      </TableColumn>
                    </TableHeader>
                    <TableBody
                      emptyContent={"No transactions found."}
                      items={paginatedTransactions}
                    >
                      {(transaction) => (
                        <TableRow key={transaction._id}>
                          <TableCell>
                            <Link
                              href={`/dashboard/bookings/${transaction.bookingNumber}`}
                            >
                              <span className="text-hotel-primary hover:underline">
                                {transaction.bookingNumber}
                              </span>
                            </Link>
                          </TableCell>
                          <TableCell>
                            {transaction.payments &&
                            transaction.payments.length > 0
                              ? new Date(
                                  transaction.payments[0].paymentDate
                                ).toLocaleDateString()
                              : "N/A"}
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {transaction.payments &&
                              transaction.payments.length > 0
                                ? transaction.payments[0].paymentMethod
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="capitalize">
                              {transaction.payments &&
                              transaction.payments.length > 0
                                ? transaction.payments[0].paymentType || "N/A"
                                : "N/A"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">
                              {formatCurrency(transaction.totalPaid)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                transaction.isFullyPaid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-amber-100 text-amber-800"
                              }`}
                            >
                              {transaction.isFullyPaid
                                ? "Fully Paid"
                                : "Partial Payment"}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm text-gray-600">
                              {transaction.payments &&
                              transaction.payments.length > 0 &&
                              transaction.payments[0].transactionId
                                ? transaction.payments[0].transactionId
                                : "N/A"}
                            </span>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add Modal for Invoice */}
      <Modal
        isOpen={isOpen}
        onClose={() => {
          setSelectedInvoice(null);
          onClose();
        }}
        size="full"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader>Invoice Details</ModalHeader>
              <ModalBody>
                {selectedInvoice && <Invoice {...selectedInvoice} />}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {/* Add ConfirmationDialog for file deletion */}
      <ConfirmationDialog
        isOpen={deleteDialogState.isOpen}
        onClose={() => setDeleteDialogState({ isOpen: false, fileName: null })}
        onConfirm={handleConfirmDelete}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone."
        confirmText="Delete"
      />
    </>
  );
}
