"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";

import axios from "axios";
import Link from "next/link";
import { toast } from "react-toastify";
import { SearchIcon } from "../ui/Table/SearchIcon";
import { PlusIcon } from "../ui/Table/PlusIcon";
import TableSkeleton from "../ui/TableSkeleton";
import { FileText, FileSpreadsheet, FileJson, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { User } from "@heroui/user";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Pagination } from "@heroui/pagination";
import { Spinner } from "@heroui/spinner";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { useRouter } from "next/navigation";
import { usePagePermission } from "../../hooks/usePagePermission";

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "email",
  "mobileno",
  "propertyType",
  "eventDates",
  "eventType",
  "notes",
  "actions",
];

const formatCurrency = (amount) => {
  if (!amount || isNaN(amount)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

const getTailwindColor = (element, className) => {
  const tempElement = document.createElement(element);
  tempElement.className = className;
  document.body.appendChild(tempElement);

  const color = window.getComputedStyle(tempElement).backgroundColor;
  document.body.removeChild(tempElement);

  const match = color.match(/\d+/g);
  return match ? match.map(Number) : [41, 128, 185]; // fallback color
};

export default function CrmList() {
  const router = useRouter();
  const [contacts, setContacts] = useState([]);
  // Initialize columns with default structure
  const [columns] = useState([
    {
      key: "name",
      label: "Name",
      allowsSorting: true,
    },
    {
      key: "email",
      label: "Email",
      allowsSorting: true,
    },
    {
      key: "mobileno",
      label: "Mobile No",
      allowsSorting: true,
    },
    {
      key: "propertyType",
      label: "Property Type",
      allowsSorting: true,
    },
    {
      key: "eventDates",
      label: "Event Dates",
      allowsSorting: true,
    },
    {
      key: "eventType",
      label: "Event Type",
      allowsSorting: true,
    },
    {
      key: "notes",
      label: "Notes",
      allowsSorting: true,
    },
    {
      key: "actions",
      label: "Actions",
      allowsSorting: false,
    },
  ]);
  const [filterValue, setFilterValue] = useState("");
  const [visibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS));
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "name",
    direction: "ascending",
  });
  const [isExporting, setIsExporting] = useState(false);

  const hasAddPermission = usePagePermission("crm/add-contact", "add");
  const hasMovePermission = usePagePermission("bookings", "add");

  const fetchContacts = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/crm`);
      if (response.data.success) {
        setContacts(response.data.contacts);
      } else {
        console.error("Failed to fetch contacts");
      }
    } catch (error) {
      console.error("Error fetching contacts:", error);
      toast.error("Failed to load contacts");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const hasSearchFilter = Boolean(filterValue);

  const filteredItems = useMemo(() => {
    let filteredContacts = [...contacts];

    if (hasSearchFilter) {
      filteredContacts = filteredContacts.filter((contact) =>
        contact.name.toLowerCase().includes(filterValue.toLowerCase())
      );
    }

    return filteredContacts;
  }, [contacts, filterValue, hasSearchFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column] ?? "";
      const second = b[sortDescriptor.column] ?? "";

      // Handle non-string values
      const firstValue = String(first).toLowerCase();
      const secondValue = String(second).toLowerCase();

      const cmp =
        firstValue < secondValue ? -1 : firstValue > secondValue ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const handleMoveToBooking = useCallback(
    async (contact) => {
      try {
        // Mark the contact as moved in the database
        const response = await fetch("/api/crm", {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contactId: contact._id,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to update contact status");
        }

        // Remove the contact from the local state
        setContacts((prevContacts) =>
          prevContacts.filter((c) => c._id !== contact._id)
        );

        // Format dates for URL parameters
        const startDate = new Date(contact.eventStartDate).toISOString();
        const endDate = new Date(contact.eventEndDate).toISOString();

        // Navigate to booking page with contact data
        router.push(
          `/dashboard/bookings/add-booking?firstName=${contact.firstName}&lastName=${contact.lastName}&email=${contact.email}&mobileno=${contact.mobileno}&propertyType=${contact.propertyType}&eventType=${contact.eventType}&startDate=${startDate}&endDate=${endDate}&notes=${contact.notes}`
        );
      } catch (error) {
        console.error("Error moving contact to booking:", error);
        // You might want to show an error toast/notification here
      }
    },
    [router]
  );

  const renderCell = useCallback(
    (contact, columnKey) => {
      // Add null check for contact
      if (!contact) return null;

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: "https://i.pravatar.cc/150",
              }}
              name={`${contact.firstName} ${contact.lastName}`}
            >
              {contact.email}
            </User>
          );
        case "eventDates":
          const startDate = new Date(
            contact.eventStartDate
          ).toLocaleDateString();
          const endDate = new Date(contact.eventEndDate).toLocaleDateString();
          return `${startDate} - ${endDate}`;
        case "propertyType":
          return (
            contact.propertyType.charAt(0).toUpperCase() +
            contact.propertyType.slice(1)
          );
        case "eventType":
          return (
            contact.eventType.charAt(0).toUpperCase() +
            contact.eventType.slice(1)
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasMovePermission && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary text-white"
                  onClick={() => handleMoveToBooking(contact)}
                >
                  MoveTo
                </Button>
              )}
            </div>
          );
        default:
          return contact[columnKey];
      }
    },
    [handleMoveToBooking, hasMovePermission]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

  const bottomContent = useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {`Showing ${start}-${end} of ${filteredItems.length}`}
        </span>
        <div className="hidden sm:flex w-[30%] justify-end gap-2">
          <div className="custom-pagination">
            <Pagination
              isCompact
              showControls
              showShadow
              page={page}
              total={pages}
              onChange={setPage}
              className="custom-pagination"
            />
          </div>
        </div>
      </div>
    );
  }, [page, pages, rowsPerPage, filteredItems.length]);

  // Function to get export data for PDF/Excel/CSV
  const getExportData = useCallback(() => {
    return sortedItems.map((contact) => {
      const startDate = contact.eventStartDate
        ? new Date(contact.eventStartDate).toLocaleDateString()
        : "-";
      const endDate = contact.eventEndDate
        ? new Date(contact.eventEndDate).toLocaleDateString()
        : "-";

      return {
        Name: `${contact.firstName} ${contact.lastName}` || "-",
        Email: contact.email || "-",
        "Mobile No": contact.mobileno || "-",
        "Property Type": contact.propertyType || "-",
        "Event Start Date": startDate,
        "Event End Date": endDate,
        "Event Type": contact.eventType || "-",
        Notes: contact.notes || "-",
      };
    });
  }, [sortedItems]);

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
      doc.text("CRM Contacts", 15, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width - 65,
        35
      );

      // Configure table
      doc.autoTable({
        head: [
          Object.keys(
            exportData[0] || {
              Name: "",
              Email: "",
              "Mobile No": "",
              "Property Type": "",
              "Event Start Date": "",
              "Event End Date": "",
              "Event Type": "",
              Notes: "",
            }
          ),
          Object.keys(
            exportData[0] || {
              Name: "",
              Email: "",
              "Mobile No": "",
              "Property Type": "",
              "Event Start Date": "",
              "Event End Date": "",
              "Event Type": "",
              Notes: "",
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

      doc.save("crm-contacts.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  // Excel Export function
  const handleDownloadExcel = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CRM Contacts");
      XLSX.writeFile(wb, "crm-contacts.xlsx");
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
      link.download = "crm-contacts.csv";
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
      link.download = "crm-contacts.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData]);

  // Export button dropdown
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
        </DropdownMenu>
      </Dropdown>
    ),
    [
      isExporting,
      handleDownloadPDF,
      handleDownloadExcel,
      handleDownloadCSV,
      handleDownloadJSON,
    ]
  );

  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">CRM Contacts</h1>
          <div className="flex gap-3">
            {downloadButton}
            <Input
              isClearable
              className="w-full sm:max-w-[44%]"
              classNames={{
                base: "w-full sm:max-w-[44%]",
                inputWrapper: "bg-hotel-secondary",
                input: "text-hotel-primary-text",
              }}
              placeholder="Search by name..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={setFilterValue}
            />
            {hasAddPermission && (
              <Button
                as={Link}
                href="/dashboard/crm/add-contact"
                className="bg-hotel-primary-yellow text-hotel-primary-text"
                endContent={<PlusIcon />}
              >
                Add Contact
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {contacts.length} contacts
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={(e) => setRowsPerPage(Number(e.target.value))}
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
    contacts.length,
    rowsPerPage,
    hasAddPermission,
    downloadButton,
  ]);

  if (isLoading) {
    return <TableSkeleton />;
  }

  return (
    <Table
      aria-label="CRM contacts table"
      isHeaderSticky
      classNames={{
        wrapper: "",
      }}
      sortDescriptor={sortDescriptor}
      topContent={topContent}
      topContentPlacement="inside"
      bottomContent={bottomContent}
      bottomContentPlacement="inside"
      onSortChange={setSortDescriptor}
    >
      <TableHeader>
        {columns.map((column) => (
          <TableColumn
            key={column.key}
            align={column.key === "actions" ? "center" : "start"}
            allowsSorting={column.allowsSorting}
          >
            {column.label}
          </TableColumn>
        ))}
      </TableHeader>
      <TableBody emptyContent={"No contacts found"} items={sortedItems || []}>
        {(item) => (
          <TableRow key={item._id}>
            {(columnKey) => (
              <TableCell>{renderCell(item, columnKey)}</TableCell>
            )}
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
