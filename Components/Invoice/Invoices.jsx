"use client";

// Update imports
import { DateRangePicker } from "@heroui/date-picker";
import { format } from "date-fns";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import { FaEye } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import axios from "axios";
import {
  CalendarIcon,
  FileText,
  FileSpreadsheet,
  FileJson,
  Download,
  Printer,
} from "lucide-react";
import { PiFadersHorizontal } from "react-icons/pi";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import { Spinner } from "@heroui/spinner";

import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Buttons } from "../ui/button";
import { cn } from "@/lib/utils";
import { usePagePermission } from "../../hooks/usePagePermission";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Pagination } from "@heroui/pagination";
import { useDisclosure } from "@heroui/use-disclosure";

import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import Invoice from "./InvoicePritnt";
import TableSkeleton from "../ui/TableSkeleton";

// Update COLUMNS to match API data structure
const COLUMNS = [
  {
    uid: "bookingNumber",
    name: "Booking ID",
    sortable: true,
  },
  {
    uid: "invoiceNumber",
    name: "Invoice No",
    sortable: true,
  },
  {
    uid: "customerName",
    name: "Customer Name",
    sortable: true,
  },
  {
    uid: "stayDates",
    name: "Stay Period",
    sortable: true,
  },
  {
    uid: "paymentMethod",
    name: "Payment Method",
    sortable: true,
  },
  {
    uid: "paymentStatus",
    name: "Payment Status",
    sortable: true,
  },
  {
    uid: "totalAmount",
    name: "Amount",
    sortable: true,
  },
  {
    uid: "actions",
    name: "Actions",
    sortable: false,
  },
];

// Payment method options from schema
const PAYMENT_METHODS = ["online", "cod", "paymentLink"];

const INITIAL_VISIBLE_COLUMNS = [
  "bookingNumber",
  "invoiceNumber",
  "customerName",
  "bookingDates",
  "paymentMethod",
  "totalAmount",
  "actions",
];

export default function Invoices() {
  const hasViewPermission = usePagePermission("Financials/Invoices", "view");
  const hasAddPermission = usePagePermission("Financials/Invoices", "add");
  const hasEditPermission = usePagePermission("Financials/Invoices", "edit");
  const hasDeletePermission = usePagePermission(
    "Financials/Invoices",
    "delete"
  );

  const [state, setState] = useState({
    invoices: [],
    settings: null,
    loading: true,
    error: null,
    filterValue: "",
    page: 1,
    rowsPerPage: 10,
  });

  // Update date state to handle null values properly
  const [date, setDate] = useState({
    from: null,
    to: null,
  });

  // Handle date selection with null check
  const handleDateSelect = (selectedDate) => {
    if (!selectedDate) {
      setDate({ from: null, to: null });
    } else {
      setDate(selectedDate);
    }
  };

  // Keep payment method filter
  const [paymentMethodFilter, setPaymentMethodFilter] = useState(new Set([]));

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );

  const [sortDescriptor, setSortDescriptor] = useState({
    column: "age",
    direction: "ascending",
  });

  const [isExporting, setIsExporting] = useState(false);

  const openModal = () => setIsModalOpen(true);

  const fetchData = useCallback(async () => {
    try {
      setState((prev) => ({ ...prev, loading: true }));
      const response = await axios.get(`/api/financials/invoices`);

      if (response.data.success) {
        setState((prev) => ({
          ...prev,
          invoices: response.data.invoices,
          settings: response.data.settings,
          loading: false,
        }));
      }
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error.message,
        loading: false,
      }));
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleViewInvoice = useCallback(
    (invoice) => {
      setSelectedInvoice({
        ...invoice,
      });
      onOpen();
    },
    [onOpen]
  );

  // Close the invoice
  const closeInvoice = () => {
    setSelectedInvoice(null);
    onClose();
  };

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return COLUMNS;

    return COLUMNS.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  // Update payment method filter handler
  const handlePaymentMethodChange = useCallback((keys) => {
    setPaymentMethodFilter(keys);
  }, []);

  // Update filteredItems to handle payment method filter correctly
  const filteredItems = useMemo(() => {
    return state.invoices.filter((invoice) => {
      // Search filter
      if (state.filterValue) {
        const searchFields = [
          invoice.invoiceNumber,
          invoice.bookingNumber,
          invoice.customerDetails?.name,
          invoice.paymentDetails?.method,
          invoice.paymentDetails?.status,
        ];

        const searchTerm = state.filterValue.toLowerCase();
        return searchFields.some(
          (field) => field && field.toLowerCase().includes(searchTerm)
        );
      }

      // Payment method filter
      if (paymentMethodFilter.size > 0) {
        const method = invoice.paymentDetails?.method?.toLowerCase();
        if (!method || !Array.from(paymentMethodFilter).some(key => key.toLowerCase() === method)) {
          return false;
        }
      }

      // Date range filter - only apply if date range is selected
      if (date?.from && date?.to) {
        try {
          const invoiceDate = new Date(invoice.createdAt);
          invoiceDate.setHours(0, 0, 0, 0);
          
          const startDate = new Date(date.from);
          startDate.setHours(0, 0, 0, 0);
          
          const endDate = new Date(date.to);
          endDate.setHours(23, 59, 59, 999);

          return invoiceDate >= startDate && invoiceDate <= endDate;
        } catch (error) {
          console.error('Error filtering by date:', error);
          return true; // Include the invoice if there's an error parsing dates
        }
      }

      return true; // Include all items when no filters are applied
    });
  }, [state.invoices, state.filterValue, paymentMethodFilter, date]);

  const pages = Math.ceil(filteredItems.length / state.rowsPerPage);

  const items = useMemo(() => {
    const start = (state.page - 1) * state.rowsPerPage;
    const end = start + state.rowsPerPage;

    return filteredItems.slice(start, end);
  }, [state.page, filteredItems, state.rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  // Format currency for the exports
  const formatCurrency = (amount) => {
    if (!amount || isNaN(amount)) return "₹0.00";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Get tailwind color for PDF exports
  const getTailwindColor = (element, className) => {
    const tempElement = document.createElement(element);
    tempElement.className = className;
    document.body.appendChild(tempElement);

    const color = window.getComputedStyle(tempElement).backgroundColor;
    document.body.removeChild(tempElement);

    const match = color.match(/\d+/g);
    return match ? match.map(Number) : [41, 128, 185]; // fallback color
  };

  // Prepare data for exports
  const getExportData = useCallback(() => {
    return filteredItems.map((invoice) => {
      return {
        "Invoice No": invoice.invoiceNumber || "-",
        "Booking ID": invoice.bookingNumber || "-",
        "Customer Name": invoice.customerDetails?.name || "-",
        "Stay Period": invoice.stayDetails
          ? `${format(
              new Date(invoice.stayDetails.checkIn),
              "dd/MM/yyyy"
            )} - ${format(
              new Date(invoice.stayDetails.checkOut),
              "dd/MM/yyyy"
            )}`
          : "-",
        "Payment Method": invoice.paymentDetails?.method || "-",
        "Payment Status": invoice.paymentDetails?.status || "-",
        Amount: formatCurrency(invoice.amounts?.totalAmount) || "-",
      };
    });
  }, [filteredItems]);

  // PDF Export function
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
      doc.text("Invoices", 15, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width - 65,
        35
      );

      if (date.from && date.to) {
        doc.text(
          `Period: ${format(date.from, "MMM dd, yyyy")} - ${format(
            date.to,
            "MMM dd, yyyy"
          )}`,
          15,
          35
        );
      }

      // Configure table
      doc.autoTable({
        head: [
          Object.keys(
            exportData[0] || {
              "Invoice No": "",
              "Booking ID": "",
              "Customer Name": "",
              "Stay Period": "",
              "Payment Method": "",
              "Payment Status": "",
              Amount: "",
            }
          ),
          Object.values(
            exportData[0] || {
              "Invoice No": "",
              "Booking ID": "",
              "Customer Name": "",
              "Stay Period": "",
              "Payment Method": "",
              "Payment Status": "",
              Amount: "",
            }
          ),
        ],
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
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
        didDrawPage: (data) => {
          // Restore header on each page
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
      });

      doc.save("invoices.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, date]);

  // Excel Export function
  const handleDownloadExcel = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Invoices");
      XLSX.writeFile(wb, "invoices.xlsx");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  // CSV Export function
  const handleDownloadCSV = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      if (exportData.length === 0) {
        toast.error("No data to export");
        return;
      }

      const fields = Object.keys(exportData[0]);
      const parser = new Parser({ fields });
      const csv = parser.parse(exportData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "invoices.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  // JSON Export function
  const handleDownloadJSON = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "invoices.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  // Update the renderCell function
  const renderCell = useCallback(
    (invoice, columnKey) => {
      switch (columnKey) {
        case "bookingNumber":
          return invoice.bookingNumber;
        case "customerName":
          return invoice.customerDetails.name;
        case "invoiceNumber":
          return invoice.invoiceNumber;
        case "stayDates":
          return (
            <div className="flex flex-col">
              <span>
                Check-in:{" "}
                {format(new Date(invoice.stayDetails.checkIn), "dd/MM/yyyy")}
              </span>
              <span>
                Check-out:{" "}
                {format(new Date(invoice.stayDetails.checkOut), "dd/MM/yyyy")}
              </span>
            </div>
          );
        case "paymentStatus":
          return (
            <div
              className={`capitalize ${
                invoice.paymentDetails.status === "completed"
                  ? "text-green-600"
                  : invoice.paymentDetails.status === "pending"
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {invoice.paymentDetails.status}
            </div>
          );
        case "totalAmount":
          return `₹${invoice.amounts.totalAmount.toFixed(2)}`;
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasViewPermission && (
                <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                  <FaEye onClick={() => handleViewInvoice(invoice)} />
                </div>
              )}
            </div>
          );
        case "guests":
          return `Adults: ${invoice.guests.adults}, Children: ${invoice.guests.children}`;
        case "paymentMethod":
          return (
            <div className="space-y-1 max-w-[300px]">
              <div className="font-semibold capitalize">
                {invoice.paymentDetails.method}
              </div>
              {invoice.paymentDetails.method === "online" && (
                <>
                  <div className="text-xs text-gray-600">
                    <div>
                      Order ID: {invoice.paymentDetails.razorpayOrderId}
                    </div>
                    <div>
                      Payment ID: {invoice.paymentDetails.razorpayPaymentId}
                    </div>
                    {/* <div>Amount: ₹{invoice.paymentDetails.amount}</div> */}
                  </div>
                </>
              )}
              {invoice.paymentDetails.method === "paymentLink" && (
                <div className="text-xs text-gray-600">
                  Link ID: {invoice.paymentDetails.razorpayPaymentLinkId}
                </div>
              )}
              {invoice.paymentDetails.method === "qr" && (
                <div className="text-xs text-gray-600">
                  QR ID: {invoice.paymentDetails.qrCodeId}
                </div>
              )}
            </div>
          );
        case "numberOfRooms":
          return invoice.numberOfRooms;
        case "mobileNo":
          return invoice.customerDetails.phone;
        case "email":
          return invoice.customerDetails.email;
        case "status":
          return (
            <div
              className={`capitalize ${
                invoice.status === "checked-in"
                  ? "text-green-600"
                  : invoice.status === "checked-out"
                  ? "text-blue-600"
                  : invoice.status === "cancelled"
                  ? "text-red-600"
                  : "text-yellow-600"
              }`}
            >
              {invoice.status}
            </div>
          );
        default:
          return invoice[columnKey];
      }
    },
    [handleViewInvoice, hasViewPermission]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setState((prev) => ({
      ...prev,
      rowsPerPage: Number(e.target.value),
      page: 1,
    }));
  }, []);

  const onSearchChange = useCallback((value) => {
    if (value) {
      setState((prev) => ({ ...prev, filterValue: value, page: 1 }));
    } else {
      setState((prev) => ({ ...prev, filterValue: "" }));
    }
  }, []);

  const onClear = useCallback(() => {
    setState((prev) => ({ ...prev, filterValue: "", page: 1 }));
  }, []);

  // Update handleDateChange handler
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

  // Update topContent to use DateRangePicker
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <Input
            isClearable
            className="w-full sm:max-w-[20%] "
            classNames={{
              base: "w-full sm:max-w-[44%] ",
              inputWrapper: "bg-hotel-secondary ",
              input: "text-hotel-primary-text",
            }}
            placeholder="Search invoices..."
            startContent={<SearchIcon />}
            value={state.filterValue}
            onClear={() => onClear()}
            onValueChange={onSearchChange}
          />
          <div className="flex gap-3">
            <DateRangePicker
              className="min-w-[280px]"
              classNames={{
                base: "bg-white rounded-lg",
                trigger: "h-10 min-h-10",
                triggerContent:
                  "flex h-full items-center gap-2 text-hotel-primary-text",
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
              placeholder="Select date range"
              onChange={handleDateChange}
              popoverProps={{
                placement: "bottom",
                offset: 5,
                radius: "lg",
                backdrop: "opaque",
              }}
              triggerContent={(value) => (
                <div className="flex items-center">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date?.from ? (
                    date.to ? (
                      <>
                        {format(date.from, "LLL dd, y")} -{" "}
                        {format(date.to, "LLL dd, y")}
                      </>
                    ) : (
                      format(date.from, "LLL dd, y")
                    )
                  ) : (
                    <span>Pick a date</span>
                  )}
                </div>
              )}
            />

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className=" min-w-28 bg-hotel-secondary  "
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {paymentMethodFilter.size
                    ? `${paymentMethodFilter.size} Selected`
                    : "All Payment Methods"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Payment Method Filter"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={paymentMethodFilter}
                onSelectionChange={handlePaymentMethodChange}
              >
                {PAYMENT_METHODS.map((method) => (
                  <DropdownItem
                    key={method.toLowerCase()}
                    className="capitalize"
                  >
                    {method}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button className="min-w-12 bg-hotel-secondary text-hotel-primary-text">
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
                {COLUMNS.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {filteredItems.length} Invoices
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
            >
              <option value={state.rowsPerPage}>{state.rowsPerPage}</option>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>
      </div>
    );
  }, [
    state.filterValue,
    paymentMethodFilter,
    visibleColumns,
    date,
    onSearchChange,
    onClear,
    handleDateChange,
  ]);

  const bottomContent = useMemo(() => {
    const start = (state.page - 1) * state.rowsPerPage + 1;
    const end = Math.min(state.page * state.rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="text-small text-default-400">
          Showing {start}-{end} of {filteredItems.length}
        </span>

        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              page={state.page}
              total={pages}
              onChange={(page) => setState((prev) => ({ ...prev, page }))}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [state.page, state.rowsPerPage, filteredItems.length, pages]);

  if (state.error) {
    return (
      <div className="p-4 text-red-500">
        Error loading invoices: {state.error}
      </div>
    );
  }

  if (state.loading) {
    return <TableSkeleton />;
  }

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view invoices
      </div>
    );
  }

  return (
    <>
      <Table
        aria-label="Example table with custom cells, pagination and sorting"
        isHeaderSticky
        bottomContent={bottomContent}
        bottomContentPlacement="inside"
        classNames={{
          wrapper: "",
          td: "py-3", // Add padding to table cells to accommodate more content
        }}
        sortDescriptor={sortDescriptor}
        topContent={topContent}
        topContentPlacement="inside"
        onSelectionChange={setSelectedKeys}
        onSortChange={setSortDescriptor}
      >
        <TableHeader columns={headerColumns} className="table-header">
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === "actions" ? "center" : "start"}
              allowsSorting={column.sortable}
              className="table-header"
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody emptyContent={"No Invoices found"} items={sortedItems}>
          {(item) => (
            <TableRow key={item._id || item.bookingNumber}>
              {(columnKey) => (
                <TableCell style={{ color: "#0D0E0D" }}>
                  {renderCell(item, columnKey)}
                </TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Modal
        isOpen={isOpen}
        onClose={closeInvoice}
        size="full"
        scrollBehavior="inside"
        className="max-w-full h-screen"
      >
        <ModalContent className="h-full">
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Invoice Details
              </ModalHeader>
              <ModalBody className="flex-grow overflow-auto">
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
    </>
  );
}
