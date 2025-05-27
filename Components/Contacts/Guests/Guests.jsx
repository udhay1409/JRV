"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import { format } from "date-fns";
import { CalendarIcon, CalendarPlus } from "lucide-react";
import { Buttons } from "../../ui/button.tsx";
import { Calendar } from "../../ui/calendar.tsx";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover.tsx";
import { cn } from "@/lib/utils";
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
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import { usePagePermission } from "@/hooks/usePagePermission";
import TableSkeleton from "@/Components/ui/TableSkeleton";
import {
  ChevronDown,
  Download,
  Eye,
  FileEdit,
  FileText,
  FileSpreadsheet,
  FileJson,
} from "lucide-react";
import { SearchIcon } from "../../ui/Table/SearchIcon.jsx";
import { PiFadersHorizontal } from "react-icons/pi";
import { capitalize } from "../../ui/Table/utils.js";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import axios from "axios";
import Link from "next/link";

const INITIAL_VISIBLE_COLUMNS = [
  "guest",
  "mobileNo",
  "emailId",
  "stayDates",
  "totalVisit",
  "totalAmount",
  "roomCategory",
  "actions",
];

const getTailwindColor = (element, className) => {
  const tempElement = document.createElement(element);
  tempElement.className = className;
  document.body.appendChild(tempElement);

  const color = window.getComputedStyle(tempElement).backgroundColor;
  document.body.removeChild(tempElement);

  const match = color.match(/\d+/g);
  return match ? match.map(Number) : [41, 128, 185]; // fallback color
};

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export default function GuestInfoList() {
  // Add permission checks
  const hasViewPermission = usePagePermission("contacts/guest", "view");
  const hasAddPermission = usePagePermission("contacts/guest", "add");
  const hasEditPermission = usePagePermission("contacts/guest", "edit");
  // const hasDeletePermission = usePagePermission("contacts/guest", "delete");

  const [filterValue, setFilterValue] = useState("");
  const [_selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "guest",
    direction: "ascending", // Keep this as ascending
  });
  const [page, setPage] = useState(1);
  const [date, setDate] = useState({
    from: null,
    to: null,
  });
  const [isExporting, setIsExporting] = useState(false);
  const tableRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Replace static guests array with state
  const [guests, setGuests] = useState([]);

  // Add sort state
  const [sortOrder, setSortOrder] = useState("asc"); // Keep this as asc

  // Modify fetch function to use new API
  const fetchGuests = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await axios.get("/api/guests");

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch guests");
      }

      const processedGuests = data.guests.map((guest) => {
        // Sort stayHistory by checkInDate in descending order (most recent first)
        const sortedStayHistory = guest.stayHistory.sort(
          (a, b) => new Date(b.checkInDate) - new Date(a.checkInDate)
        );

        return {
          id: guest._id,
          name: guest.name,
          mobileNo: guest.mobileNo || "N/A",
          emailId: guest.email || "N/A",
          stayDates:
            sortedStayHistory.length > 0
              ? `${format(
                  new Date(sortedStayHistory[0].checkInDate),
                  "dd/MM/yyyy"
                )} - ${format(
                  new Date(sortedStayHistory[0].checkOutDate),
                  "dd/MM/yyyy"
                )}`
              : "N/A",
          totalVisit: guest.totalVisits,
          totalAmount: `₹${guest.totalAmountSpent.toLocaleString("en-IN")}`,
          roomCategory: sortedStayHistory[0]?.roomCategory || "N/A",
          bookingId: sortedStayHistory[0]?.bookingId || "N/A",
          guestId: guest.guestId,
          idProof: guest.verificationId || "N/A",
          address: guest.address || "N/A",
          notes: guest.notes || "N/A",
        };
      });

      setGuests(processedGuests);
    } catch (error) {
      console.error("Error fetching guests:", error);
      setError(error.response?.data?.error || error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const columns = useMemo(
    () => [
      { name: "GUEST NAME", uid: "guest", sortable: true },
      { name: "MOBILE NO", uid: "mobileNo", sortable: true },
      { name: "EMAIL ID", uid: "emailId", sortable: true },
      {
        name: "LAST STAY CHECK IN - CHECK OUT",
        uid: "stayDates",
        sortable: true,
      },
      { name: "TOTAL VISIT", uid: "totalVisit", sortable: true },
      { name: "TOTAL AMOUNT SPENT", uid: "totalAmount", sortable: true },
      { name: "ROOM CATEGORY", uid: "roomCategory", sortable: true },
      { name: "BOOKING ID", uid: "bookingId", sortable: true },
      { name: "GUEST ID", uid: "guestId", sortable: true },
      { name: "ID PROOF", uid: "idProof", sortable: true },
      { name: "ADDRESS", uid: "address", sortable: true },
      { name: "NOTES", uid: "notes", sortable: true },
      { name: "ACTION", uid: "actions" },
    ],
    []
  );

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const isValidDateRange = useCallback((dateRange) => {
    return (
      dateRange &&
      dateRange.from instanceof Date &&
      dateRange.to instanceof Date
    );
  }, []);

  const handleDateChange = useCallback((newDate) => {
    const validatedDate = {
      from: newDate?.from ? new Date(newDate.from) : null,
      to: newDate?.to ? new Date(newDate.to) : null,
    };
    setDate(validatedDate);
    setPage(1);
  }, []);

  const filteredItems = useMemo(() => {
    let filteredGuests = [...guests];

    if (isValidDateRange(date)) {
      filteredGuests = filteredGuests.filter((guest) => {
        try {
          if (!guest.stayDates) return false;

          const [checkInStr, checkOutStr] = guest.stayDates.split(" - ");
          if (!checkInStr || !checkOutStr) return false;

          const [checkInDay, checkInMonth, checkInYear] = checkInStr.split("/");
          const [checkOutDay, checkOutMonth, checkOutYear] =
            checkOutStr.split("/");

          const checkIn = new Date(checkInYear, checkInMonth - 1, checkInDay);
          const checkOut = new Date(
            checkOutYear,
            checkOutMonth - 1,
            checkOutDay
          );

          if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
            return false;
          }

          return (
            (checkIn >= date.from && checkIn <= date.to) ||
            (checkOut >= date.from && checkOut <= date.to) ||
            (checkIn <= date.from && checkOut >= date.to)
          );
        } catch (error) {
          console.error("Error parsing dates for guest:", guest, error);
          return false;
        }
      });
    }

    if (hasSearchFilter) {
      const searchTerm = filterValue.toLowerCase();
      filteredGuests = filteredGuests.filter((guest) => {
        return (
          guest.name?.toLowerCase().includes(searchTerm) ||
          guest.mobileNo?.toLowerCase().includes(searchTerm) ||
          guest.emailId?.toLowerCase().includes(searchTerm) ||
          guest.address?.toLowerCase().includes(searchTerm)
        );
      });
    }

    return filteredGuests;
  }, [guests, filterValue, hasSearchFilter, date, isValidDateRange]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      let cmp;

      // Special handling for name/guest column
      if (sortDescriptor.column === "guest") {
        cmp = a.name.localeCompare(b.name);
      } else {
        cmp = String(first).localeCompare(String(second));
      }

      // Apply direction
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = useCallback(
    (guest, columnKey) => {
      switch (columnKey) {
        case "guest":
          return guest.name;
        case "mobileNo":
          return guest.mobileNo;
        case "emailId":
          return guest.emailId;
        case "stayDates":
          return guest.stayDates;
        case "totalVisit":
          return guest.totalVisit;
        case "totalAmount":
          return guest.totalAmount;
        case "roomCategory":
          return guest.roomCategory;
        case "bookingId":
          return guest.bookingId;
        case "guestId":
          return guest.guestId || "N/A"; // Add case for guestId
        case "idProof":
          return guest.idProof;
        case "address":
          return guest.address;
        case "notes":
          return guest.notes;
        case "actions":
          return (
            <div className="flex justify-center gap-2">
              {/* View button - requires view permission */}
              {hasViewPermission && (
                <Link href={`/dashboard/contacts/guest/${guest.guestId}`}>
                  <Button
                    isIconOnly
                    variant="flat"
                    aria-label="View"
                    className="bg-hotel-secondary-light-grey text-hotel-primary"
                  >
                    <Eye size={16} />
                  </Button>
                </Link>
              )}

              {/* Edit button - requires edit permission */}
              {hasEditPermission && (
                <Link
                  href={`/dashboard/contacts/guest/edit-guest/${guest.guestId}`}
                >
                  <Button
                    isIconOnly
                    variant="flat"
                    aria-label="Edit"
                    className="bg-hotel-secondary-light-grey text-hotel-primary"
                    title="Edit guest details"
                  >
                    <FileEdit size={16} />
                  </Button>
                </Link>
              )}

              {/* Create Booking button - requires booking add permission */}
              {hasAddPermission && (
                <Link
                  href={`/dashboard/bookings/add-booking?email=${guest.emailId}`}
                >
                  <Button
                    isIconOnly
                    variant="flat"
                    aria-label="Create Booking"
                    className="bg-hotel-secondary-light-grey text-hotel-primary"
                    title="Create new booking for this guest"
                  >
                    <CalendarPlus size={16} />
                  </Button>
                </Link>
              )}
            </div>
          );
        default:
          return guest[columnKey];
      }
    },
    [hasViewPermission, hasEditPermission, hasAddPermission]
  );

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value);
      setPage(1);
    } else {
      setFilterValue("");
    }
  }, []);

  const onClear = useCallback(() => {
    setFilterValue("");
    setPage(1);
  }, []);

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const getExportData = useCallback(() => {
    return sortedItems.map((item) => {
      const rawAmount = parseFloat(item.totalAmount.replace(/[₹,]/g, ""));
      return {
        "Guest Name": item.name,
        "Mobile No": item.mobileNo,
        "Email ID": item.emailId,
        "Stay Dates": item.stayDates,
        "Total Visits": item.totalVisit,
        "Total Amount": formatCurrency(rawAmount),
        "Room Category": item.roomCategory,
        "Booking ID": item.bookingId,
        "Guest ID": item.guestId,
        "ID Proof": item.idProof,
        Address: item.address,
        Notes: item.notes,
      };
    });
  }, [sortedItems]);

  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF("l", "mm", "a4");
      const exportData = getExportData();
      const hotelPrimaryColor = getTailwindColor("div", "bg-hotel-primary");

      // Add header banner
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
      doc.text("Guest Information List", 15, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const dateStr = new Date().toLocaleDateString();
      doc.text(`Generated: ${dateStr}`, doc.internal.pageSize.width - 65, 35);

      // Add grand total
      const grandTotal = sortedItems.reduce((sum, item) => {
        const amount = parseFloat(item.totalAmount.replace(/[₹,]/g, "")) || 0;
        return sum + amount;
      }, 0);

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Guests: ${exportData.length}`, 15, 40);
      doc.text(
        `Grand Total: ${formatCurrency(grandTotal)}`,
        doc.internal.pageSize.width - 80,
        40
      );

      // Configure table
      doc.autoTable({
        head: [Object.keys(exportData[0])],
        body: exportData.map(Object.values),
        startY: 45,
        theme: "grid",
        styles: {
          fontSize: 8,
          cellPadding: 3,
          lineColor: [80, 80, 80],
          lineWidth: 0.1,
        },
        headStyles: {
          fillColor: hotelPrimaryColor,
          textColor: 255,
          fontSize: 9,
          fontStyle: "bold",
          halign: "center",
        },
        columnStyles: {
          "Guest Name": { cellWidth: 30 },
          "Mobile No": { cellWidth: 25 },
          "Email ID": { cellWidth: 40 },
          "Stay Dates": { cellWidth: 35 },
          "Total Visits": { cellWidth: 20, halign: "right" },
          "Total Amount": {
            cellWidth: 30,
            halign: "right",
            cellPadding: { right: 8 },
          },
          "Room Category": { cellWidth: 25 },
          "Guest ID": { cellWidth: 25 },
          Notes: { cellWidth: 30 },
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: (data) => {
          // Restore header banner on each page
          doc.setFillColor(
            hotelPrimaryColor[0],
            hotelPrimaryColor[1],
            hotelPrimaryColor[2]
          );
          doc.rect(0, 0, doc.internal.pageSize.width, 25, "F");

          // Add footer
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

      doc.save("guest-list.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, sortedItems]);

  const handleDownloadExcel = useCallback(() => {
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Guests");
      XLSX.writeFile(wb, "guest-list.xlsx");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    }
  }, [getExportData]);

  const handleDownloadCSV = useCallback(() => {
    try {
      const exportData = getExportData();
      const fields = Object.keys(exportData[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(exportData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "guest-list.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV file");
    }
  }, [getExportData]);

  const handleDownloadJSON = useCallback(() => {
    try {
      const exportData = getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "guest-list.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    }
  }, [getExportData]);

  const handleDownloadTXT = useCallback(() => {
    try {
      const exportData = getExportData();
      const text = exportData
        .map((item) =>
          Object.entries(item)
            .map(([key, value]) => `${key}: ${value}`)
            .join("\n")
        )
        .join("\n\n---\n\n");

      const blob = new Blob([text], { type: "text/plain" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "guest-list.txt";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating TXT:", error);
      toast.error("Failed to generate TXT file");
    }
  }, [getExportData]);

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
            isDisabled={isExporting}
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
            onPress={handleDownloadCSV}
          >
            CSV
          </DropdownItem>
          <DropdownItem
            key="json"
            startContent={<FileJson size={16} />}
            onPress={handleDownloadJSON}
          >
            JSON
          </DropdownItem>
          <DropdownItem
            key="txt"
            startContent={<FileText size={16} />}
            onPress={handleDownloadTXT}
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
      handleDownloadCSV,
      handleDownloadJSON,
      handleDownloadTXT,
    ]
  );

  const handleSortChange = useCallback((key) => {
    setSortOrder(key);
    setSortDescriptor({
      column: "guest",
      direction: key === "asc" ? "ascending" : "descending",
    });
    setPage(1); // Reset to first page when sort changes
  }, []);

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Guest Info List</h1>
          <div className="flex gap-3">
            <Input
              isClearable
              placeholder="Search by name, mobile, email, address..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
              classNames={{
                base: "w-full sm:max-w-[44%] date-btn",
                inputWrapper: "bg-hotel-secondary ",
                input: "text-hotel-primary-text",
              }}
            />

            {/* Date filter - requires view permission */}
            {hasViewPermission && (
              <Popover>
                <PopoverTrigger asChild>
                  <Buttons
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[280px] justify-start text-left font-normal bg-hotel-secondary",
                      !isValidDateRange(date) && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {isValidDateRange(date) ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      <span className="text-hotel-primary-text">
                        Pick a date
                      </span>
                    )}
                  </Buttons>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from || new Date()}
                    selected={date}
                    onSelect={handleDateChange}
                    numberOfMonths={2}
                    className="rounded-md border"
                  />
                </PopoverContent>
              </Popover>
            )}

            {/* Sort and filter dropdowns - requires view permission */}
            {hasViewPermission && (
              <>
                <Dropdown>
                  <DropdownTrigger className="hidden sm:flex">
                    <Button
                      endContent={<ChevronDown className="text-small" />}
                      variant="flat"
                      className="bg-hotel-secondary"
                    >
                      {sortOrder === "asc" ? "A to Z" : "Z to A"}
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu
                    aria-label="Sort Options"
                    disallowEmptySelection
                    selectionMode="single"
                    selectedKeys={new Set([sortOrder])}
                    onSelectionChange={(keys) =>
                      handleSortChange(Array.from(keys)[0])
                    }
                  >
                    <DropdownItem key="asc">A to Z</DropdownItem>
                    <DropdownItem key="desc">Z to A</DropdownItem>
                  </DropdownMenu>
                </Dropdown>
                <Dropdown>
                  <DropdownTrigger className="hidden sm:flex">
                    <Button className="min-w-20 bg-hotel-secondary text-hotel-primary-text">
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
                      <DropdownItem key={column.uid} className="capitalize">
                        {capitalize(column.name)}
                      </DropdownItem>
                    ))}
                  </DropdownMenu>
                </Dropdown>
              </>
            )}

            {/* Download button - requires view permission */}
            {hasViewPermission && downloadButton}

            {/* Add New button - requires add permission */}
            {hasAddPermission && (
              <Link href="/dashboard/contacts/guest/add-guest">
                <Button
                  color="warning"
                  className="bg-hotel-primary-yellow text-black"
                >
                  Add New
                </Button>
              </Link>
            )}

            {isLoading && <Spinner size="sm" />}
            {error && <span className="text-red-500">{error}</span>}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {guests.length} guests
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value={rowsPerPage}>{rowsPerPage}</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    filterValue,
    onSearchChange,
    onClear,
    date,
    visibleColumns,
    columns,
    isLoading,
    error,
    guests.length,
    rowsPerPage,
    onRowsPerPageChange,
    isValidDateRange,
    handleDateChange,
    downloadButton,
    sortOrder,
    handleSortChange,
    hasViewPermission,
    hasAddPermission,
  ]);

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          Showing {start}-{end} of {filteredItems.length}
        </span>
        <Pagination
          isCompact
          showControls
          showShadow
          className="custom-pagination"
          page={page}
          total={pages}
          onChange={setPage}
        />
      </div>
    );
  }, [page, pages, filteredItems.length, rowsPerPage]);

  // Show loading skeleton while checking permissions
  if (isLoading) {
    return <TableSkeleton />;
  }

  // Show unauthorized message if no view permission
  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view guests
      </div>
    );
  }

  return (
    <div>
      <div className="guest-table-container" ref={tableRef}>
        <Table
          aria-label="Guest Info List Table"
          isHeaderSticky
          bottomContent={bottomContent}
          bottomContentPlacement="inside"
          sortDescriptor={sortDescriptor}
          topContent={topContent}
          topContentPlacement="inside"
          onSelectionChange={setSelectedKeys}
          onSortChange={setSortDescriptor}
          isLoading={isLoading}
        >
          <TableHeader columns={headerColumns}>
            {(column) => (
              <TableColumn
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
                className="text-white font-medium"
              >
                {column.name}
              </TableColumn>
            )}
          </TableHeader>
          <TableBody items={sortedItems} emptyContent={"No guests found"}>
            {(item) => (
              <TableRow key={item.id}>
                {(columnKey) => (
                  <TableCell>{renderCell(item, columnKey)}</TableCell>
                )}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {isExporting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg flex items-center gap-2">
            <Spinner size="sm" />
            <span>Generating PDF...</span>
          </div>
        </div>
      )}
    </div>
  );
}
