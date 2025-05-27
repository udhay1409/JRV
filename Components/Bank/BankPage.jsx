import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/button";
import { Tabs, Tab } from "@heroui/tabs";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Input } from "@heroui/input";
import {
  IconBuildingBank,
  IconCash,
  IconPencil,
  IconTrash,
} from "@tabler/icons-react";
import {
  FileText,
  FileSpreadsheet,
  FileJson,
  Download,
  Printer,
} from "lucide-react";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import axios from "axios";
import { toast } from "react-toastify";
import { usePagePermission } from "@/hooks/usePagePermission";
// import TableSkeleton from "@/Components/ui/TableSkeleton";

const BankPage = () => {
  /*  const hasViewPermission = usePagePermission("Bank", "view"); */
  const hasAddPermission = usePagePermission("Financials/Bank", "add");
  const hasEditPermission = usePagePermission("Financials/Bank", "edit");
  const hasDeletePermission = usePagePermission("Financials/Bank", "delete");

  const [activeTab, setActiveTab] = useState("bank");
  const [bankAccounts, setBankAccounts] = useState([]);
  const [cashAccounts, setCashAccounts] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [formData, setFormData] = useState({
    type: "bank",
    name: "",
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
    branchName: "",
    ifscCode: "",
    accountType: "",
    openingBalance: "",
    date: new Date().toISOString().split("T")[0],
  });
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fetch bank accounts
  const fetchBankAccounts = async () => {
    try {
      const response = await axios.get(
        "/api/financials/bank?type=bank&isActive=true"
      );
      if (response.data.success) {
        setBankAccounts(response.data.bankAccounts);
      }
    } catch (error) {
      console.error("Error fetching bank accounts:", error);
      toast.error("Failed to fetch bank accounts");
    }
  };

  // Fetch cash accounts
  const fetchCashAccounts = async () => {
    try {
      const response = await axios.get(
        "/api/financials/bank?type=cash&isActive=true"
      );
      if (response.data.success) {
        setCashAccounts(response.data.bankAccounts);
      }
    } catch (error) {
      console.error("Error fetching cash accounts:", error);
      toast.error("Failed to fetch cash accounts");
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchBankAccounts();
    fetchCashAccounts();
  }, []);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handle tab change
  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === "cash") {
      // Only keep relevant fields for cash accounts
      setFormData({
        type: "cash",
        name: "",
        openingBalance: "",
        date: new Date().toISOString().split("T")[0],
      });
    } else {
      // Reset form with bank fields
      setFormData({
        type: "bank",
        name: "",
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        branchName: "",
        ifscCode: "",
        accountType: "",
        openingBalance: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setEditMode(false);
    setEditId(null);
  };

  // Reset form
  const resetForm = () => {
    if (activeTab === "cash") {
      // Reset only cash-related fields
      setFormData({
        type: "cash",
        name: "",
        openingBalance: "",
        date: new Date().toISOString().split("T")[0],
      });
    } else {
      // Reset all bank fields
      setFormData({
        type: "bank",
        name: "",
        bankName: "",
        accountNumber: "",
        accountHolderName: "",
        branchName: "",
        ifscCode: "",
        accountType: "",
        openingBalance: "",
        date: new Date().toISOString().split("T")[0],
      });
    }
    setEditMode(false);
    setEditId(null);
  };

  // Handle edit
  const handleEdit = (account) => {
    if (!hasEditPermission) {
      toast.error("You don't have permission to edit bank accounts");
      return;
    }

    setEditMode(true);
    setEditId(account._id);
    setActiveTab(account.type);

    if (account.type === "cash") {
      // Only set cash-related fields
      setFormData({
        type: "cash",
        name: account.name || "",
        openingBalance: account.openingBalance || "",
        date: account.date
          ? new Date(account.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    } else {
      // Set all bank fields
      setFormData({
        type: "bank",
        name: account.name || "",
        bankName: account.bankName || "",
        accountNumber: account.accountNumber || "",
        accountHolderName: account.accountHolderName || "",
        branchName: account.branchName || "",
        ifscCode: account.ifscCode || "",
        accountType: account.accountType || "",
        openingBalance: account.openingBalance || "",
        date: account.date
          ? new Date(account.date).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0],
      });
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!hasDeletePermission) {
      toast.error("You don't have permission to delete bank accounts");
      return;
    }

    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        const response = await axios.delete(`/api/financials/bank?id=${id}`);
        if (response.data.success) {
          toast.success("Account deactivated successfully");
          fetchBankAccounts();
          fetchCashAccounts();
        }
      } catch (error) {
        console.error("Error deleting account:", error);
        toast.error("Failed to delete account");
      }
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let dataToSubmit = { ...formData };

      // Clean up data based on account type
      if (dataToSubmit.type === "cash") {
        // Remove bank-specific fields for cash accounts
        dataToSubmit = {
          type: "cash",
          name: formData.name,
          openingBalance: formData.openingBalance,
          date: formData.date,
        };
      }

      let response;
      if (editMode) {
        response = await axios.put("/api/financials/bank", {
          ...dataToSubmit,
          id: editId,
        });
      } else {
        response = await axios.post("/api/financials/bank", dataToSubmit);
      }

      if (response.data.success) {
        toast.success(
          `Account ${editMode ? "updated" : "created"} successfully`
        );
        resetForm();
        fetchBankAccounts();
        fetchCashAccounts();
      }
    } catch (error) {
      console.error(
        `Error ${editMode ? "updating" : "creating"} account:`,
        error
      );
      toast.error(
        error.response?.data?.message ||
          `Failed to ${editMode ? "update" : "create"} account`
      );
    } finally {
      setLoading(false);
    }
  };

  // Format currency for exports
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

  // Get export data based on active tab
  const getExportData = useCallback(() => {
    const accounts = activeTab === "bank" ? bankAccounts : cashAccounts;

    return accounts.map((account) => {
      if (activeTab === "bank") {
        return {
          "Account Name": account.name || "-",
          "Bank Name": account.bankName || "-",
          "Account Number": account.accountNumber || "-",
          "Account Holder": account.accountHolderName || "-",
          Branch: account.branchName || "-",
          "IFSC Code": account.ifscCode || "-",
          "Account Type": account.accountType || "-",
          Balance: formatCurrency(account.openingBalance) || "₹0",
          "Date Added": account.date
            ? new Date(account.date).toLocaleDateString()
            : "-",
        };
      } else {
        return {
          "Cash Account": account.name || "-",
          Balance: formatCurrency(account.openingBalance) || "₹0",
          "Date Added": account.date
            ? new Date(account.date).toLocaleDateString()
            : "-",
        };
      }
    });
  }, [activeTab, bankAccounts, cashAccounts]);

  // PDF Export function
  const handleDownloadPDF = useCallback(async () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF("l", "mm", "a4");
      const exportData = getExportData();
      const hotelPrimaryColor = getTailwindColor("div", "bg-hotel-primary");
      const title = activeTab === "bank" ? "Bank Accounts" : "Cash Accounts";

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
      doc.text(title, 15, 15);

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
            exportData[0] ||
              (activeTab === "bank"
                ? {
                    "Account Name": "",
                    "Bank Name": "",
                    "Account Number": "",
                    "Account Holder": "",
                    Branch: "",
                    "IFSC Code": "",
                    "Account Type": "",
                    Balance: "",
                    "Date Added": "",
                  }
                : {
                    "Cash Account": "",
                    Balance: "",
                    "Date Added": "",
                  })
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

      const filename =
        activeTab === "bank" ? "bank-accounts.pdf" : "cash-accounts.pdf";
      doc.save(filename);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, activeTab]);

  // Excel Export function
  const handleDownloadExcel = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      const sheetName =
        activeTab === "bank" ? "Bank Accounts" : "Cash Accounts";
      XLSX.utils.book_append_sheet(wb, ws, sheetName);

      const filename =
        activeTab === "bank" ? "bank-accounts.xlsx" : "cash-accounts.xlsx";
      XLSX.writeFile(wb, filename);
    } catch (error) {
      console.error("Error generating Excel:", error);
      toast.error("Failed to generate Excel file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, activeTab]);

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

      const filename =
        activeTab === "bank" ? "bank-accounts.csv" : "cash-accounts.csv";
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast.error("Failed to generate CSV file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, activeTab]);

  // JSON Export function
  const handleDownloadJSON = useCallback(() => {
    try {
      setIsExporting(true);
      const exportData = getExportData();
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);

      const filename =
        activeTab === "bank" ? "bank-accounts.json" : "cash-accounts.json";
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      console.error("Error generating JSON:", error);
      toast.error("Failed to generate JSON file");
    } finally {
      setIsExporting(false);
    }
  }, [getExportData, activeTab]);

  /*   if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don't have permission to view bank accounts
      </div>
    );
  }

  if (isLoading) {
    return <TableSkeleton />;
  } */

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Bank & Cash Management</h1>

      <div className="flex justify-between items-center mb-4">
        <div></div>
        <a href="/dashboard/financials/bank?tab=entry">
          <Button color="primary">Go to Entry Page</Button>
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={handleTabChange}
          color="warning"
          variant="underlined"
          aria-label="Bank account options"
          classNames={{
            tab: "px-4 py-2",
            tabList:
              "gap-6 w-full relative rounded-none p-0 border-b border-divider",
            cursor: "w-full bg-warning",
          }}
        >
          <Tab
            key="bank"
            title={
              <div className="flex items-center gap-2">
                <IconBuildingBank size={16} />
                <span>Bank</span>
              </div>
            }
          />
          <Tab
            key="cash"
            title={
              <div className="flex items-center gap-2">
                <IconCash size={16} />
                <span>Cash</span>
              </div>
            }
          />
        </Tabs>

        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-4">
            {activeTab === "bank" ? "Bank Account" : "Cash Account"}
          </h2>
          {(hasAddPermission || (hasEditPermission && editMode)) && (
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeTab === "bank" && (
                  <>
                    <Input
                      label="Bank Name"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="Enter bank name"
                      required
                    />
                    <Input
                      label="Account Number"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="Enter account number"
                      required
                    />
                    <Input
                      label="Account Holder Name"
                      name="accountHolderName"
                      value={formData.accountHolderName}
                      onChange={handleChange}
                      placeholder="Enter account holder name"
                    />
                    <Input
                      label="Branch Name"
                      name="branchName"
                      value={formData.branchName}
                      onChange={handleChange}
                      placeholder="Enter branch name"
                    />
                    <Input
                      label="IFSC Code"
                      name="ifscCode"
                      value={formData.ifscCode}
                      onChange={handleChange}
                      placeholder="Enter IFSC code"
                      required
                    />
                    <Input
                      label="Account Type"
                      name="accountType"
                      value={formData.accountType}
                      onChange={handleChange}
                      placeholder="Enter account type"
                    />
                  </>
                )}
                <Input
                  label="Name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={
                    activeTab === "bank"
                      ? "Enter a name for this account"
                      : "Enter cash account name"
                  }
                  required
                />
                <Input
                  type="number"
                  label="Opening Balance"
                  name="openingBalance"
                  value={formData.openingBalance}
                  onChange={handleChange}
                  placeholder="Enter opening balance"
                />
                <Input
                  type="date"
                  label="Date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                />
              </div>

              <div className="flex justify-end mt-6 gap-4">
                <Button color="default" variant="light" onPress={resetForm}>
                  Cancel
                </Button>
                <Button type="submit" color="warning" isLoading={loading}>
                  {editMode ? "Update" : "Save"}
                </Button>
              </div>
            </form>
          )}
          {!hasAddPermission && !hasEditPermission && (
            <div className="text-center p-4 text-gray-500">
              You don&apos;t have permission to {editMode ? "edit" : "add"} bank
              accounts
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-xl font-semibold mb-4">Bank</h2>
        <Table aria-label="Bank Accounts">
          <TableHeader>
            <TableColumn>BANK NAME</TableColumn>
            <TableColumn>ACCOUNT NUMBER</TableColumn>
            <TableColumn>ACCOUNT HOLDER NAME</TableColumn>
            <TableColumn>BRANCH NAME</TableColumn>
            <TableColumn>IFSC CODE</TableColumn>
            <TableColumn>ACCOUNT TYPE</TableColumn>
            <TableColumn>OPENING BALANCE</TableColumn>
            <TableColumn>CURRENT BALANCE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody>
            {bankAccounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell>{account.bankName}</TableCell>
                <TableCell>{account.accountNumber}</TableCell>
                <TableCell>{account.accountHolderName}</TableCell>
                <TableCell>{account.branchName}</TableCell>
                <TableCell>{account.ifscCode}</TableCell>
                <TableCell>{account.accountType}</TableCell>
                <TableCell>₹{account.openingBalance}</TableCell>
                <TableCell>
                  ₹
                  {account.currentBalance !== undefined
                    ? account.currentBalance
                    : account.openingBalance}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    {hasEditPermission && (
                      <Button
                        isIconOnly
                        size="sm"
                        color="primary"
                        onClick={() => handleEdit(account)}
                      >
                        <IconPencil size={16} />
                      </Button>
                    )}
                    {hasDeletePermission && (
                      <Button
                        isIconOnly
                        size="sm"
                        color="danger"
                        onClick={() => handleDelete(account._id)}
                      >
                        <IconTrash size={16} />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {bankAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center">
                  No bank accounts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <h2 className="text-xl font-semibold my-6">Cash</h2>
        <Table aria-label="Cash Accounts">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>OPENING BALANCE</TableColumn>
            <TableColumn>CURRENT BALANCE</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn>ACTION</TableColumn>
          </TableHeader>
          <TableBody>
            {cashAccounts.map((account) => (
              <TableRow key={account._id}>
                <TableCell>{account.name}</TableCell>
                <TableCell>₹{account.openingBalance}</TableCell>
                <TableCell>
                  ₹
                  {account.currentBalance !== undefined
                    ? account.currentBalance
                    : account.openingBalance}
                </TableCell>
                <TableCell>
                  {new Date(account.date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      isIconOnly
                      size="sm"
                      color="primary"
                      onClick={() => handleEdit(account)}
                    >
                      <IconPencil size={16} />
                    </Button>
                    <Button
                      isIconOnly
                      size="sm"
                      color="danger"
                      onClick={() => handleDelete(account._id)}
                    >
                      <IconTrash size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {cashAccounts.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
                  No cash accounts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-8">
        <div className="flex items-center gap-2">
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

          <Button
            size="sm"
            color="primary"
            isIconOnly
            onClick={() => window.print()}
          >
            <Printer size={18} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BankPage;
