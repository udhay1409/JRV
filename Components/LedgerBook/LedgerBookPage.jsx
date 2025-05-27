import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Select, SelectItem } from "@heroui/select";
import {
  IconPrinter,
  IconDownload,
  IconCalendarEvent,
} from "@tabler/icons-react";
import {
  FileText,
  FileSpreadsheet,
  FileJson,
  Download,
  Eye,
} from "lucide-react";
import axios from "axios";
import { toast } from "react-toastify";
import { DateRangePicker } from "@heroui/date-picker";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Spinner } from "@heroui/spinner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import { format, startOfMonth, endOfMonth, isWithinInterval } from "date-fns";
import { CalendarDate } from "@internationalized/date";
import { Pagination } from "@heroui/pagination";

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

const LedgerBookPage = () => {
  const [ledger, setLedger] = useState(null);
  const [loading, setLoading] = useState(false);

  // Create date range using proper CalendarDate objects
  const startOfCurrentMonth = startOfMonth(new Date());
  const endOfCurrentMonth = endOfMonth(new Date());

  const [dateRange, setDateRange] = useState({
    start: new CalendarDate(
      startOfCurrentMonth.getFullYear(),
      startOfCurrentMonth.getMonth() + 1,
      startOfCurrentMonth.getDate()
    ),
    end: new CalendarDate(
      endOfCurrentMonth.getFullYear(),
      endOfCurrentMonth.getMonth() + 1,
      endOfCurrentMonth.getDate()
    ),
  });

  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState("all");
  const [accountType, setAccountType] = useState("all");
  const [isExporting, setIsExporting] = useState(false);
  const [bankBalance, setBankBalance] = useState(0);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const rowsPerPageOptions = [5, 10, 15, 20, 25, 30];
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);

  // Convert date range to month/year for API
  const getMonthYearFromDateRange = useCallback(() => {
    if (!dateRange?.start)
      return {
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      };

    // We'll use the start date's month and year for the API
    return {
      month: dateRange.start.month,
      year: dateRange.start.year,
    };
  }, [dateRange]);

  // Fetch ledger data
  const fetchLedger = useCallback(async () => {
    try {
      setLoading(true);
      const { month, year } = getMonthYearFromDateRange();

      const response = await axios.get(
        `/api/financials/ledger-book?month=${month}&year=${year}&accountType=${accountType}`
      );

      if (response.data.success) {
        setLedger(response.data.ledger);
      }
    } catch (error) {
      console.error("Error fetching ledger:", error);
      toast.error("Failed to fetch ledger data");
    } finally {
      setLoading(false);
    }
  }, [accountType, getMonthYearFromDateRange]);

  // Fetch bank accounts
  const fetchBanks = async () => {
    try {
      const response = await axios.get("/api/financials/bank?isActive=true");
      if (response.data.success) {
        setBanks(response.data.bankAccounts);
        const totalBankBalance = response.data.bankAccounts.reduce(
          (total, bank) => total + Number(bank.currentBalance || 0),
          0
        );
        setBankBalance(totalBankBalance);
      }
    } catch (error) {
      console.error("Error fetching banks:", error);
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchLedger();
    fetchBanks();
  }, [fetchLedger]);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    if (!range || !range.start || !range.end) {
      // If no range is selected, default to current month
      const currentMonth = startOfMonth(new Date());
      const endOfCurrentMonth = endOfMonth(new Date());

      setDateRange({
        start: new CalendarDate(
          currentMonth.getFullYear(),
          currentMonth.getMonth() + 1,
          currentMonth.getDate()
        ),
        end: new CalendarDate(
          endOfCurrentMonth.getFullYear(),
          endOfCurrentMonth.getMonth() + 1,
          endOfCurrentMonth.getDate()
        ),
      });
      return;
    }

    setDateRange(range);

    // Re-fetch ledger data when date range changes
    // Only need to fetch new data if the month/year changed
    const newMonth = range.start.month;
    const newYear = range.start.year;

    const oldMonth = dateRange.start?.month;
    const oldYear = dateRange.start?.year;

    if (newMonth !== oldMonth || newYear !== oldYear) {
      setTimeout(() => fetchLedger(), 0);
    }
  };

  // Handle bank filter change
  const handleBankChange = (e) => {
    const bankId = e.target.value;
    setSelectedBank(bankId);

    // Update accountType based on selected bank
    if (bankId === "all") {
      setAccountType("all");
    } else {
      const selectedBankAccount = banks.find((bank) => bank._id === bankId);
      if (selectedBankAccount) {
        setAccountType(selectedBankAccount.type);
      }
    }
  };

  // Filter entries by bank and date range
  const filteredEntries = useMemo(() => {
    if (!ledger?.entries) return [];

    // First filter by date range
    const dateFiltered = ledger.entries.filter((entry) => {
      // Check if entry date is within the selected date range
      if (dateRange?.start && dateRange?.end) {
        const entryDate = new Date(entry.date);

        const fromDate = new Date(
          dateRange.start.year,
          dateRange.start.month - 1,
          dateRange.start.day
        );

        const toDate = new Date(
          dateRange.end.year,
          dateRange.end.month - 1,
          dateRange.end.day
        );

        // Set hours to 0 for date-only comparison
        fromDate.setHours(0, 0, 0, 0);
        toDate.setHours(23, 59, 59, 999);

        return isWithinInterval(entryDate, { start: fromDate, end: toDate });
      }

      return true;
    });

    // Then filter by bank if a specific bank is selected
    const bankFiltered =
      selectedBank === "all"
        ? dateFiltered
        : dateFiltered.filter((entry) => entry.bank?._id === selectedBank);

    // If we're filtering by bank, recalculate running balances
    if (selectedBank !== "all") {
      // Get the opening balance for this account type
      const openingBalance =
        banks.find((bank) => bank._id === selectedBank)?.openingBalance || 0;

      // Sort entries by date
      const sortedEntries = [...bankFiltered].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      // Recalculate running balance starting from the account's opening balance
      let runningBalance = Number(openingBalance);

      return sortedEntries.map((entry) => {
        // Update running balance based on transaction type
        if (entry.type === "income") {
          runningBalance += Number(entry.credit || 0);
        } else if (entry.type === "expenses") {
          runningBalance -= Number(entry.debit || 0);
        }

        // Return entry with corrected balance
        return {
          ...entry,
          balance: runningBalance,
        };
      });
    }

    // If "all" is selected, return entries with original balance
    return bankFiltered;
  }, [ledger, selectedBank, dateRange, banks]);

  // Calculate summary values based on filtered entries
  const summary = useMemo(() => {
    if (!filteredEntries.length)
      return {
        income: 0,
        expenses: 0,
        netProfit: 0,
      };

    const income = filteredEntries
      .filter((entry) => entry.type === "income")
      .reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

    const expenses = filteredEntries
      .filter((entry) => entry.type === "expenses")
      .reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);

    return {
      income,
      expenses,
      netProfit: income - expenses,
    };
  }, [filteredEntries]);

  // Generate month name

  // Update getFormattedDateRange to regular function instead of useMemo
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const getFormattedDateRange = useCallback(() => {
    if (!dateRange?.start || !dateRange?.end) return "";

    const fromDate = new Date(
      dateRange.start.year,
      dateRange.start.month - 1,
      dateRange.start.day
    );

    const toDate = new Date(
      dateRange.end.year,
      dateRange.end.month - 1,
      dateRange.end.day
    );

    return `${format(fromDate, "MMM dd, yyyy")} - ${format(
      toDate,
      "MMM dd, yyyy"
    )}`;
  });

  // Function to get data for export
  const getExportData = useCallback(() => {
    if (!filteredEntries || filteredEntries.length === 0) return [];

    return filteredEntries.map((entry) => {
      return {
        "Transaction Date": format(new Date(entry.date), "dd/MM/yyyy"),
        "Transaction Type": entry.type,
        Description: entry.description,
        Account: entry.bank?.name || "N/A",
        "Account Type": entry.bank?.type || "N/A",
        Reference: entry.reference || "N/A",
        Income: entry.type === "income" ? formatCurrency(entry.credit) : "",
        Expense: entry.type === "expense" ? formatCurrency(entry.debit) : "",
        Balance: formatCurrency(entry.balance),
      };
    });
  }, [filteredEntries]);

  // Update the PDF export to use the function
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
      doc.text("Ledger Book", 15, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setTextColor(60, 60, 60);
      const dateStr = getFormattedDateRange();
      doc.text(`Date Range: ${dateStr}`, 15, 35);
      doc.text(
        `Generated: ${new Date().toLocaleDateString()}`,
        doc.internal.pageSize.width - 65,
        35
      );

      // Add grand total
      const totalIncome = filteredEntries
        .filter((entry) => entry.type === "income")
        .reduce((sum, entry) => sum + (Number(entry.credit) || 0), 0);

      const totalExpense = filteredEntries
        .filter((entry) => entry.type === "expense")
        .reduce((sum, entry) => sum + (Number(entry.debit) || 0), 0);

      doc.setFontSize(11);
      doc.setTextColor(60, 60, 60);
      doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 15, 40);
      doc.text(
        `Total Expense: ${formatCurrency(totalExpense)}`,
        doc.internal.pageSize.width - 80,
        40
      );
      doc.text(
        `Net: ${formatCurrency(totalIncome - totalExpense)}`,
        doc.internal.pageSize.width - 80,
        45
      );

      // Configure table
      doc.autoTable({
        head: [Object.keys(exportData[0] || {})],
        body: exportData.map(Object.values),
        startY: 50,
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
          "Transaction Date": { cellWidth: 20 },
          "Transaction Type": { cellWidth: 20 },
          Description: { cellWidth: 40 },
          Account: { cellWidth: 25 },
          "Account Type": { cellWidth: 20 },
          Reference: { cellWidth: 20 },
          Income: { cellWidth: 20, halign: "right" },
          Expense: { cellWidth: 20, halign: "right" },
          Balance: { cellWidth: 20, halign: "right" },
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

      doc.save("ledger-book.pdf");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, getFormattedDateRange, filteredEntries]);

  // Download Excel function
  const handleDownloadExcel = useCallback(() => {
    try {
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Ledger Book");
      XLSX.writeFile(wb, "ledger-book.xlsx");
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    }
  }, [getExportData]);

  // Download CSV function
  const handleDownloadCSV = useCallback(() => {
    try {
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
      link.download = "ledger-book.csv";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV file");
    }
  }, [getExportData]);

  // Download JSON function
  const handleDownloadJSON = useCallback(() => {
    try {
      const exportData = getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "ledger-book.json";
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    }
  }, [getExportData]);

  // Open modal to view entry details
  const handleViewEntry = (entry) => {
    setSelectedEntry(entry);
    setIsEntryModalOpen(true);
  };

  // Close the entry details modal
  const handleCloseEntryModal = () => {
    setIsEntryModalOpen(false);
    setSelectedEntry(null);
  };

  // Update pagination calculation
  const totalEntries = filteredEntries.length;
  const totalPages = Math.ceil(totalEntries / rowsPerPage);
  const start = (page - 1) * rowsPerPage;
  const end = start + rowsPerPage;

  // Get paginated entries
  const paginatedEntries = useMemo(() => {
    if (!filteredEntries || filteredEntries.length === 0) return [];
    return filteredEntries.slice(start, end);
  }, [filteredEntries, start, end]);

  // Handle page change
  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (e) => {
    const newRowsPerPage = Number(e.target.value);
    setRowsPerPage(newRowsPerPage);
    setPage(1); // Reset to first page when changing rows per page
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Ledger Book</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-yellow-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Income</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(summary.income || 0)}
              </h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange()}</p>
            </div>
            <div className="bg-yellow-100 p-2 rounded-md">
              <IconDownload className="text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-red-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Total Expenses</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(summary.expenses || 0)}
              </h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange()}</p>
            </div>
            <div className="bg-red-100 p-2 rounded-md">
              <IconPrinter className="text-red-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Bank Balance</p>
              <h3 className="text-2xl font-bold">
                {selectedBank === "all"
                  ? formatCurrency(bankBalance || 0)
                  : formatCurrency(
                      banks.find((bank) => bank._id === selectedBank)
                        ?.currentBalance || 0
                    )}
              </h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange()}</p>
            </div>
            <div className="bg-blue-100 p-2 rounded-md">
              <IconDownload className="text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-green-500">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-gray-500 text-sm">Net Profit</p>
              <h3 className="text-2xl font-bold">
                {formatCurrency(summary.netProfit || 0)}
              </h3>
              <p className="text-gray-400 text-xs">{getFormattedDateRange()}</p>
            </div>
            <div className="bg-green-100 p-2 rounded-md">
              <IconDownload className="text-green-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Overall Ledger</h2>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <span>Type</span>
              <Select
                aria-label="Type"
                selectedKeys={[selectedBank]}
                onChange={handleBankChange}
                className="w-40"
              >
                <SelectItem key="all" value="all">
                  All
                </SelectItem>
                {banks.map((bank) => (
                  <SelectItem key={bank._id} value={bank._id}>
                    {bank.type === "bank" ? bank.bankName : bank.name}
                  </SelectItem>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <DateRangePicker
                id="ledger-date-range"
                aria-label="Select date range"
                value={dateRange}
                onChange={handleDateRangeChange}
                showMonthAndYearPickers
                visibleMonths={2}
                popoverProps={{
                  placement: "bottom-end",
                }}
                selectorIcon={<IconCalendarEvent size={18} />}
                selectorButtonPlacement="end"
                classNames={{
                  base: "min-w-[240px]",
                }}
              />
            </div>

            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-default-100"
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
          </div>
        </div>

        <Table aria-label="Ledger Book Entries">
          <TableHeader>
            <TableColumn>DATE</TableColumn>
            <TableColumn>TYPE</TableColumn>
            <TableColumn>CATEGORY</TableColumn>
            <TableColumn>REF / BOOKING ID</TableColumn>
            <TableColumn>DEBIT</TableColumn>
            <TableColumn>CREDIT</TableColumn>
            <TableColumn>BALANCE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody>
            {!loading && ledger && (
              <>
                <TableRow>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                  <TableCell>₹{ledger.openingBalance}</TableCell>
                  <TableCell></TableCell>
                </TableRow>

                {paginatedEntries.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      {new Date(entry.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {entry.type === "income" ? "Income" : "Expenses"}
                    </TableCell>
                    <TableCell>{entry.category}</TableCell>
                    <TableCell>{entry.refId}</TableCell>
                    <TableCell>
                      {entry.debit > 0 ? `₹${entry.debit}` : ""}
                    </TableCell>
                    <TableCell>
                      {entry.credit > 0 ? `₹${entry.credit}` : ""}
                    </TableCell>
                    <TableCell>₹{entry.balance}</TableCell>
                    <TableCell>
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        variant="light"
                        onPress={() => handleViewEntry(entry)}
                      >
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Opening Balance:
                  </TableCell>
                  <TableCell colSpan={3}>
                    ₹{ledger.accountTypeSummary?.openingBalance || 0}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Current Total:
                  </TableCell>
                  <TableCell>
                    ₹{ledger.accountTypeSummary?.totalDebited || 0}
                  </TableCell>
                  <TableCell>
                    ₹{ledger.accountTypeSummary?.totalCredited || 0}
                  </TableCell>
                  <TableCell></TableCell>
                  <TableCell></TableCell>
                </TableRow>
                <TableRow className="bg-gray-50">
                  <TableCell colSpan={4} className="text-right font-semibold">
                    Closing Balance:
                  </TableCell>
                  <TableCell colSpan={3}>
                    ₹{ledger.accountTypeSummary?.closingBalance || 0}
                  </TableCell>
                  <TableCell></TableCell>
                </TableRow>
              </>
            )}

            {loading && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  Loading ledger data...
                </TableCell>
              </TableRow>
            )}

            {!loading && (!ledger || filteredEntries.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} className="text-center">
                  No ledger entries found for this period
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination controls */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 mt-6 px-2 custom-pagination">
          <div className="flex items-center gap-2 text-gray-600">
            <span className="text-sm">Rows per page:</span>
            <Select
              aria-label="Rows per page"
              selectedKeys={[String(rowsPerPage)]}
              onChange={handleRowsPerPageChange}
              className="w-24 min-w-[96px]"
              size="sm"
            >
              {rowsPerPageOptions.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option}
                </SelectItem>
              ))}
            </Select>
            <span className="text-sm whitespace-nowrap">
              {start + 1}-{Math.min(end, totalEntries)} of {totalEntries}
            </span>
          </div>{" "}
          <Pagination
            showControls
            total={totalPages}
            initialPage={1}
            page={page}
            onChange={handlePageChange}
            variant="bordered"
            size="sm"
            color="primary"
            radius="sm"
            className="gap-1 custom-pagination"
            classNames={{
              wrapper: "gap-0 overflow-visible h-8",
              item: "w-8 h-8 text-small bg-transparent hover:bg-gray-100",
              cursor: "text-white font-medium",
              next: "bg-transparent hover:bg-gray-100",
              prev: "bg-transparent hover:bg-gray-100",
            }}
          />
        </div>
      </div>

      {/* Entry Details Modal */}
      <Modal
        isOpen={isEntryModalOpen}
        onOpenChange={handleCloseEntryModal}
        placement="center"
        backdrop="blur"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="text-lg font-semibold">
                Transaction Details
              </ModalHeader>
              <ModalBody>
                {selectedEntry && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {new Date(selectedEntry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Type:</span>
                      <span
                        className={`font-medium ${
                          selectedEntry.type === "income"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {selectedEntry.type === "income"
                          ? "Income"
                          : "Expenses"}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Category:</span>
                      <span className="font-medium">
                        {selectedEntry.category}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Reference ID:</span>
                      <span className="font-medium">
                        {selectedEntry.refId || "N/A"}
                      </span>
                    </div>
                    {selectedEntry.type === "income" && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Credit Amount:</span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(selectedEntry.credit || 0)}
                        </span>
                      </div>
                    )}
                    {selectedEntry.type === "expenses" && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Debit Amount:</span>
                        <span className="font-medium text-red-600">
                          {formatCurrency(selectedEntry.debit || 0)}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Balance:</span>
                      <span className="font-medium">
                        {formatCurrency(selectedEntry.balance || 0)}
                      </span>
                    </div>
                    {selectedEntry.description && (
                      <div className="flex flex-col">
                        <span className="text-gray-600">Description:</span>
                        <p className="mt-1 p-2 bg-gray-50 rounded text-sm">
                          {selectedEntry.description}
                        </p>
                      </div>
                    )}
                    {selectedEntry.bank && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">Account:</span>
                        <span className="font-medium">
                          {selectedEntry.bank.type === "bank"
                            ? selectedEntry.bank.bankName
                            : selectedEntry.bank.name}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="default" variant="light" onPress={onClose}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LedgerBookPage;
