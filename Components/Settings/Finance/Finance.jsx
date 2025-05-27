"use client";

import { useState, useEffect, useRef } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableColumn,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Switch } from "@heroui/switch";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Input } from "@heroui/input";
import { Pagination } from "@heroui/pagination";
import { Tooltip } from "@heroui/tooltip";

import { Calendar, Info, ChevronDown, Trash2, PenSquare } from "lucide-react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";
import { toast } from "react-toastify";

// Add this helper function at the top of your component file, outside the component
function sanitizeForComparison(obj) {
  if (!obj) return obj;
  const cleaned = {};

  Object.keys(obj).forEach((key) => {
    // Skip DOM elements and File objects
    if (obj[key] instanceof Element || obj[key] instanceof File) {
      cleaned[key] = obj[key].name || "file";
    }
    // Handle Date objects
    else if (obj[key] instanceof Date) {
      cleaned[key] = obj[key].toISOString();
    }
    // Handle nested objects
    else if (typeof obj[key] === "object" && obj[key] !== null) {
      cleaned[key] = sanitizeForComparison(obj[key]);
    }
    // Handle arrays
    else if (Array.isArray(obj[key])) {
      cleaned[key] = obj[key].map((item) =>
        typeof item === "object" ? sanitizeForComparison(item) : item
      );
    }
    // Handle primitive values
    else {
      cleaned[key] = obj[key];
    }
  });

  return cleaned;
}

// Add this CSS class at the top of the file, after the imports

export default function FinanceSettings() {
  const [formData, setFormData] = useState({
    startDate: new Date("2024-04-01"), // Default to April 2024 as an example
    endDate: new Date("2025-03-31"),
    invoiceFormat: {
      prefix: "INV",
      sequence: 1,
      financialYear: "",
    },
    color: "#00569B",
    logo: "",
    category: new Set([]), // Initialize as empty Set for NextUI Select
    expense: new Set([]), // Initialize as empty Set for NextUI Select
    financialYearHistory: [],
    manualYearControl: false,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [errors, setErrors] = useState({});
  const [initialData, setInitialData] = useState(null);

  const [categoryInput, setCategoryInput] = useState("");
  const [expenseInput, setExpenseInput] = useState("");
  const [showCategories, setShowCategories] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingExpense, setIsCreatingExpense] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [editingExpense, setEditingExpense] = useState(null);
  const categoryInputRef = useRef(null);
  const expenseInputRef = useRef(null);
  const [categories, setCategories] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [yearError, setYearError] = useState("");
  const [activeYear, setActiveYear] = useState(null);
  const [manualControl, setManualControl] = useState(false);
  const [page, setPage] = useState(1);
  const rowsPerPage = 2;

  const [isEditMode, setIsEditMode] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [editType, setEditType] = useState(null);

  useEffect(() => {
    fetchFinanceSettings();
    fetchExpensesSettings();
  }, []);

  // Update the useEffect for change detection
  useEffect(() => {
    if (initialData) {
      try {
        const sanitizedFormData = sanitizeForComparison(formData);
        const sanitizedInitialData = sanitizeForComparison(initialData);
        const hasChanged =
          JSON.stringify(sanitizedFormData) !==
          JSON.stringify(sanitizedInitialData);
        setHasUnsavedChanges(hasChanged);
      } catch (error) {
        console.error("Error comparing data:", error);
        setHasUnsavedChanges(false);
      }
    }
  }, [formData, initialData]);

  useEffect(() => {
    // Set financial year based on start and end dates
    const updateFinancialYear = () => {
      const startYear = formData.startDate.getFullYear().toString().slice(-2);
      const endYear = formData.endDate.getFullYear().toString().slice(-2);
      setFormData((prev) => ({
        ...prev,
        invoiceFormat: {
          ...prev.invoiceFormat,
          financialYear: `${startYear}-${endYear}`,
        },
      }));
    };
    updateFinancialYear();
  }, [formData.startDate, formData.endDate]);

  // Update the useEffect for click-outside handling
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't handle click-outside if we're in edit mode
      if (isEditMode) {
        return;
      }

      if (
        categoryInputRef.current &&
        !categoryInputRef.current.contains(event.target)
      ) {
        setIsCreatingCategory(false);
        setShowCategories(false);
      }
      if (
        expenseInputRef.current &&
        !expenseInputRef.current.contains(event.target)
      ) {
        setIsCreatingExpense(false);
        setShowExpenses(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isEditMode, editingCategory, editingExpense]);

  const validateFinancialYear = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    // Ensure dates are whole years apart
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    if (yearDiff < 1 || startDate >= endDate) {
      setYearError("Financial year must span at least one full year");
      return false;
    }

    // Ensure start date is first of month
    if (startDate.getDate() !== 1) {
      setYearError("Start date must be the first day of a month");
      return false;
    }

    setYearError("");
    return true;
  };

  const handleDateChange = (field, date) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [field]: date,
      };

      // Automatically set this as active year when changing dates
      const startYear = newData.startDate.getFullYear().toString().slice(-2);
      const endYear = newData.endDate.getFullYear().toString().slice(-2);
      const yearFormat = `${startYear}-${endYear}`;

      // Update financial year history to reflect active status
      const updatedHistory = prev.financialYearHistory.map((year) => ({
        ...year,
        isActive: year.yearFormat === yearFormat,
      }));

      newData.financialYearHistory = updatedHistory;

      validateFinancialYear(
        field === "startDate" ? date : prev.startDate,
        field === "endDate" ? date : prev.endDate
      );
      return newData;
    });
  };

  // Update toggleActiveYear function
  const toggleActiveYear = async (yearFormat) => {
    try {
      setIsLoading(true);
      const yearToActivate = formData.financialYearHistory.find(
        (y) => y.yearFormat === yearFormat
      );

      if (!yearToActivate) {
        toast.error("Selected year not found");
        return;
      }

      const formDataToSend = new FormData();
      formDataToSend.append(
        "startDate",
        yearToActivate.startDate.toISOString()
      );
      formDataToSend.append("endDate", yearToActivate.endDate.toISOString());
      formDataToSend.append("invoiceFormat", formData.invoiceFormat.prefix);
      formDataToSend.append("color", formData.color);
      formDataToSend.append("manualYearActivation", "true");
      formDataToSend.append("manualYearControl", "true");
      formDataToSend.append(
        "yearSequence",
        String(yearToActivate.sequence || 0)
      );

      const response = await axios.post(
        `/api/settings/finance/invoice`,
        formDataToSend
      );

      if (response.data.success) {
        await fetchFinanceSettings();
        toast.success("Financial year activated successfully");
        setManualControl(true); // Update local state
        setFormData((prev) => ({
          ...prev,
          manualYearControl: true,
        }));
      }
    } catch (error) {
      console.error("Toggle year error:", error);
      toast.error(
        error.response?.data?.error || "Failed to set active financial year"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Update the fetchFinanceSettings function
  const fetchFinanceSettings = async () => {
    setIsFetching(true);
    try {
      const response = await axios.get(`/api/settings/finance/invoice`);
      if (response.data.success) {
        const settings = response.data.settings;
        const newFormData = {
          startDate: settings.financialYear.startDate
            ? new Date(settings.financialYear.startDate)
            : new Date(),
          endDate: settings.financialYear.endDate
            ? new Date(settings.financialYear.endDate)
            : new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          invoiceFormat: {
            prefix: settings.invoiceFormat.prefix || "INV",
            sequence: settings.invoiceFormat.sequence || 1,
            financialYear: settings.invoiceFormat.financialYear || "",
          },
          color: settings.color || "#00569B",
          logo: settings.logo?.url || "",
          financialYearHistory: (settings.financialYearHistory || []).map(
            (year) => ({
              ...year,
              startDate: new Date(year.startDate),
              endDate: new Date(year.endDate),
            })
          ),
          manualYearControl: settings.manualYearControl || false,
        };
        setFormData(newFormData);
        setInitialData(newFormData);
        setManualControl(settings.manualYearControl || false);

        // Only set active year if there's history
        if (settings.financialYearHistory?.length > 0) {
          const active = settings.financialYearHistory.find((y) => y.isActive);
          setActiveYear(active);
        }
      }
    } catch (error) {
      toast.error("Failed to fetch settings. Please try again.");
    } finally {
      setIsFetching(false);
    }
  };

  const fetchExpensesSettings = async () => {
    try {
      const response = await axios.get(`/api/settings/finance/expenses`);
      if (response.data.success) {
        setCategories(response.data.settings.category || []);
        setExpenses(response.data.settings.expense || []);
      }
    } catch (error) {
      toast.error("Failed to fetch expense settings");
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        logo: file,
      }));
      console.log("File uploaded:", file);
    }
  };

  const handleInvoicePrefixChange = (e) => {
    const value = e.target.value.toUpperCase();
    if (value.length <= 3) {
      setFormData((prev) => ({
        ...prev,
        invoiceFormat: {
          ...prev.invoiceFormat,
          prefix: value,
        },
      }));
    }
  };

  const validateInvoicePrefix = (prefix) => {
    return /^[A-Z]{3}$/.test(prefix);
  };

  const getInvoicePrefixStatus = () => {
    const prefix = formData.invoiceFormat.prefix;
    if (!prefix) return "default";
    if (prefix.length < 3) return "warning";
    if (validateInvoicePrefix(prefix)) return "success";
    return "error";
  };

  const getInvoicePreview = () => {
    const { prefix } = formData.invoiceFormat;
    const activeYear = formData.financialYearHistory.find((y) => y.isActive);
    const yearFormat =
      activeYear?.yearFormat || formData.invoiceFormat.financialYear;
    const sequence = String(1);
    return `${prefix}/${yearFormat}/${sequence}`;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.invoiceFormat.prefix) {
      newErrors.prefix = "Invoice prefix is required";
    }
    // Add more validations as needed
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }
    setShowSaveModal(true);
  };

  // Update the confirmSave function
  const confirmSave = async () => {
    if (!validateFinancialYear(formData.startDate, formData.endDate)) {
      toast.error(yearError);
      return;
    }

    setIsLoading(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("startDate", formData.startDate.toISOString());
      formDataToSend.append("endDate", formData.endDate.toISOString());
      formDataToSend.append("invoiceFormat", formData.invoiceFormat.prefix);
      formDataToSend.append("color", formData.color);

      if (formData.logo instanceof File) {
        formDataToSend.append("logo", formData.logo);
      }

      formDataToSend.append("manualYearControl", String(manualControl));

      const response = await axios.post(
        `/api/settings/finance/invoice`,
        formDataToSend
      );

      if (response.data.success) {
        await fetchFinanceSettings(); // Refresh with latest data
        toast.success("Finance settings updated successfully");
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save settings");
    } finally {
      setIsLoading(false);
      setShowSaveModal(false);
    }
  };

  // Update handleSaveCategory function
  const handleSaveCategory = async () => {
    if (!categoryInput.trim()) return;

    try {
      let response;
      if (editingCategory) {
        response = await axios.put(`/api/settings/finance/expenses`, {
          type: "category",
          oldName: editingCategory,
          newName: categoryInput,
          description: "Category update",
        });
      } else {
        response = await axios.post(`/api/settings/finance/expenses`, {
          type: "category",
          name: categoryInput,
          description: "New category",
        });
      }

      if (response.data.success) {
        toast.success(
          editingCategory
            ? "Category updated successfully"
            : "Category added successfully"
        );
        setCategoryInput("");
        setEditingCategory(null);
        setIsEditMode(false);
        await fetchExpensesSettings();
        // Reopen the dropdown after successful update
        setTimeout(() => {
          setShowCategories(true);
        }, 100);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save category");
    }
  };

  const handleDeleteCategory = async (name) => {
    try {
      const response = await axios.delete(`/api/settings/finance/expenses`, {
        data: { type: "category", name },
      });
      if (response.data.success) {
        toast.success("Category deleted successfully");
        await fetchFinanceSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete category");
    }
  };

  // Update handleSaveExpense function
  const handleSaveExpense = async () => {
    if (!expenseInput.trim()) return;

    try {
      let response;
      if (editingExpense) {
        response = await axios.put(`/api/settings/finance/expenses`, {
          type: "expense",
          oldName: editingExpense,
          newName: expenseInput,
          description: "Expense update",
        });
      } else {
        response = await axios.post(`/api/settings/finance/expenses`, {
          type: "expense",
          name: expenseInput,
          description: "New expense",
        });
      }

      if (response.data.success) {
        toast.success(
          editingExpense
            ? "Expense updated successfully"
            : "Expense added successfully"
        );
        setExpenseInput("");
        setEditingExpense(null);
        setIsEditMode(false);
        await fetchExpensesSettings();
        // Reopen the dropdown after successful update
        setTimeout(() => {
          setShowExpenses(true);
        }, 100);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save expense");
    }
  };

  const handleDeleteExpense = async (name) => {
    try {
      const response = await axios.delete(`/api/settings/finance/expenses`, {
        data: { type: "expense", name },
      });
      if (response.data.success) {
        toast.success("Expense deleted successfully");
        await fetchFinanceSettings();
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete expense");
    }
  };

  const handleCategoryInputChange = (value) => {
    setCategoryInput(value);
    const matchingCategory = categories.find(
      (cat) => cat.name.toLowerCase() === value.toLowerCase()
    );
    if (matchingCategory) {
      setIsCreatingCategory(false);
    } else {
      setIsCreatingCategory(true);
    }
  };

  const handleExpenseInputChange = (value) => {
    setExpenseInput(value);
    const matchingExpense = expenses.find(
      (exp) => exp.name.toLowerCase() === value.toLowerCase()
    );
    if (matchingExpense) {
      setIsCreatingExpense(false);
    } else {
      setIsCreatingExpense(true);
    }
  };

  const getFilteredCategories = () => {
    return categories
      .map((category) => ({
        ...category,
        isEditing: editingCategory === category.name,
      }))
      .filter((category) =>
        category.name.toLowerCase().includes(categoryInput.toLowerCase())
      );
  };

  const getFilteredExpenses = () => {
    return expenses
      .map((expense) => ({
        ...expense,
        isEditing: editingExpense === expense.name,
      }))
      .filter((expense) =>
        expense.name.toLowerCase().includes(expenseInput.toLowerCase())
      );
  };

  // Update the handleEditMode function
  const handleEditMode = (item, type) => {
    setIsEditMode(true);
    setEditItem(item);
    setEditType(type);
    if (type === "category") {
      setEditingCategory(item.name);
      setCategoryInput(item.name);
      setShowCategories(true); // Keep dropdown open during edit
      setIsCreatingCategory(false);
    } else {
      setEditingExpense(item.name);
      setExpenseInput(item.name);
      setShowExpenses(true); // Keep dropdown open during edit
      setIsCreatingExpense(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[811px]">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#0066B2]" />
      </div>
    );
  }

  const getYearHistoryPages = () => {
    const history = formData.financialYearHistory || [];
    const pages = Math.ceil(history.length / rowsPerPage);
    const items = history.slice((page - 1) * rowsPerPage, page * rowsPerPage);
    return { pages, items };
  };

  const renderFinancialYearHistory = () => {
    const { pages, items } = getYearHistoryPages();

    return (
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Financial Year History</h3>
        <Table
          aria-label="Financial Year History"
          bottomContent={
            pages > 1 ? (
              <div className="flex w-full justify-center">
                <Pagination
                  isCompact
                  showControls
                  showShadow
                  color="primary"
                  page={page}
                  total={pages}
                  onChange={setPage}
                />
              </div>
            ) : null
          }
        >
          <TableHeader>
            <TableColumn>FINANCIAL YEAR</TableColumn>
            <TableColumn>START DATE</TableColumn>
            <TableColumn>END DATE</TableColumn>
            <TableColumn>SEQUENCE</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {items.map((year) => (
              <TableRow key={year._id || year.yearFormat}>
                <TableCell>FY {year.yearFormat}</TableCell>
                <TableCell>
                  {new Date(year.startDate).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  {new Date(year.endDate).toLocaleDateString()}
                </TableCell>
                <TableCell>{year.sequence}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs ${
                      year.isActive
                        ? "bg-blue-100 text-blue-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {year.isActive ? "Active" : "Inactive"}
                  </span>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    className="bg-hotel-primary text-white"
                    variant={year.isActive ? "solid" : "bordered"}
                    onPress={() => toggleActiveYear(year.yearFormat)}
                    isDisabled={isLoading}
                  >
                    {year.isActive ? "Active" : "Set Active"}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <section className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm min-h-[811px]">
      <div className=" mx-auto p-6 space-y-12">
        {/* Invoice Settings Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Invoice Settings</h2>

          <div className="space-y-6">
            <div className="flex gap-20">
              <label className="flex items-center gap-2">
                Financial Year
                <Tooltip content="Set the start and end dates for your financial year">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <div className="flex flex-col gap-4">
                <div className="flex gap-4">
                  <div className="relative">
                    <DatePicker
                      selected={formData.startDate}
                      onChange={(date) => handleDateChange("startDate", date)}
                      customInput={
                        <Input
                          value={formData.startDate.toLocaleDateString()}
                          variant="bordered"
                          radius="lg"
                          className="min-w-[150px]"
                          endContent={
                            <Calendar className="w-4 h-4 text-default-400" />
                          }
                        />
                      }
                    />
                  </div>
                  <div className="relative">
                    <DatePicker
                      selected={formData.endDate}
                      onChange={(date) => handleDateChange("endDate", date)}
                      customInput={
                        <Input
                          value={formData.endDate.toLocaleDateString()}
                          variant="bordered"
                          radius="lg"
                          className="min-w-[150px]"
                          endContent={
                            <Calendar className="w-4 h-4 text-default-400" />
                          }
                        />
                      }
                    />
                  </div>
                </div>
                {yearError && (
                  <span className="text-red-500 text-sm">{yearError}</span>
                )}
              </div>
            </div>

            <div className="flex gap-8">
              <label className="flex items-center gap-2">
                Invoice Format
                <Tooltip content="This prefix will appear on all your invoices">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                </Tooltip>
              </label>
              <div className="flex flex-col gap-2 w-1/3">
                <Input
                  value={formData.invoiceFormat.prefix}
                  onChange={handleInvoicePrefixChange}
                  variant="bordered"
                  radius="lg"
                  placeholder="INV"
                  maxLength={3}
                  label="Prefix (3 letters)"
                  description="Enter exactly 3 uppercase letters (e.g., INV)"
                  color={getInvoicePrefixStatus()}
                  errorMessage={
                    formData.invoiceFormat.prefix &&
                    !validateInvoicePrefix(formData.invoiceFormat.prefix) &&
                    "Must be exactly 3 uppercase letters"
                  }
                  startContent={
                    <div className="pointer-events-none flex items-center">
                      <span className="text-default-400 text-small">#</span>
                    </div>
                  }
                />
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <span>Preview:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                      {getInvoicePreview()}
                    </span>
                  </div>
                  <div className="flex flex-col text-xs text-gray-400">
                    <span>Format: PREFIX/YY-YY/000001</span>
                    <span>Example: INV/24-25/000001</span>
                  </div>
                </div>
                <div className="flex gap-2 mt-1">
                  {["INV", "BIL", "RCT"].map((suggestion) => (
                    <Button
                      key={suggestion}
                      size="sm"
                      variant="flat"
                      onPress={() =>
                        setFormData((prev) => ({
                          ...prev,
                          invoiceFormat: {
                            ...prev.invoiceFormat,
                            prefix: suggestion,
                          },
                        }))
                      }
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-12">
              <label className="block text-sm font-medium mb-2 items-center mt-3">
                Set Color
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleChange("color", e.target.value)}
                  variant="bordered"
                  radius="lg"
                  className="flex-1 w-1/4"
                />
                <div
                  className="w-16 h-[40px] rounded-lg"
                  style={{ backgroundColor: formData.color }}
                />
              </div>
            </div>

            <div className="flex gap-5">
              <label className="block text-sm font-medium mb-2 items-center justify-center mt-3 ">
                Logo Upload
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Logo"
                  value={
                    formData.logo instanceof File
                      ? formData.logo.name
                      : formData.logo
                  }
                  variant="bordered"
                  radius="lg"
                  className="flex-1"
                  readOnly
                />
                <Button
                  color="primary"
                  className="bg-hotel-primary w-[150px] "
                  radius="full"
                  onPress={() =>
                    document.getElementById("logo-upload")?.click()
                  }
                >
                  Upload
                </Button>
                <input
                  id="logo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>
            </div>
          </div>
        </div>

        {renderFinancialYearHistory()}

        {/* Expenses Settings Section */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Expenses Settings</h2>

          <div className="grid  gap-8">
            {/* Categories Column */}
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="block text-[15px] font-medium text-[#111111] mb-2 w-1/3">
                  Category
                </label>
                <div className="relative w-2/3" ref={categoryInputRef}>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search or create category"
                      value={categoryInput}
                      onChange={(e) =>
                        handleCategoryInputChange(e.target.value)
                      }
                      className="w-1/2"
                      onClick={() => !isEditMode && setShowCategories(true)}
                      endContent={
                        <ChevronDown
                          className={`w-4 h-4 text-[#70707B] cursor-pointer ${
                            editingCategory ? "hidden" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditMode) setShowCategories(!showCategories);
                          }}
                        />
                      }
                    />
                    {(isCreatingCategory || editingCategory) && (
                      <Button
                        className="bg-[#0066B2] text-white"
                        onPress={handleSaveCategory}
                      >
                        {editingCategory ? "Update" : "Create"}
                      </Button>
                    )}
                  </div>
                  {showCategories &&
                    !editingCategory && ( // Only show dropdown when not editing
                      <div className="absolute z-50 w-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredCategories().map((category) => (
                          <div
                            key={category.name}
                            className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <span className="flex-1 px-2">{category.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                isIconOnly
                                className="bg-transparent hover:bg-gray-200"
                                onPress={(e) => {
                                  handleEditMode(category, "category");
                                }}
                              >
                                <PenSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                isIconOnly
                                className="bg-transparent hover:bg-gray-200"
                                onPress={(e) => {
                                  handleDeleteCategory(category.name);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
            {/* Expenses Column */}
            <div className="space-y-4">
              <div className="flex items-center">
                <label className="block text-[15px] font-medium text-[#111111] mb-2 w-1/3">
                  Expense
                </label>
                <div className="relative w-2/3" ref={expenseInputRef}>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Search or create expense"
                      value={expenseInput}
                      onChange={(e) => handleExpenseInputChange(e.target.value)}
                      className="w-1/2"
                      onClick={() => !isEditMode && setShowExpenses(true)}
                      endContent={
                        <ChevronDown
                          className={`w-4 h-4 text-[#70707B] cursor-pointer ${
                            editingExpense ? "hidden" : ""
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isEditMode) setShowExpenses(!showExpenses);
                          }}
                        />
                      }
                    />
                    {(isCreatingExpense || editingExpense) && (
                      <Button
                        className="ml-2 bg-[#0066B2] text-white"
                        onPress={handleSaveExpense}
                      >
                        {editingExpense ? "Update" : "Create"}
                      </Button>
                    )}
                  </div>
                  {showExpenses &&
                    !editingExpense && ( // Only show dropdown when not editing
                      <div className="absolute z-50 w-1/2 mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {getFilteredExpenses().map((expense) => (
                          <div
                            key={expense.name}
                            className="flex justify-between items-center p-2 hover:bg-gray-100 cursor-pointer"
                          >
                            <span className="flex-1 px-2">{expense.name}</span>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                isIconOnly
                                className="bg-transparent hover:bg-gray-200"
                                onPress={(e) => {
                                  handleEditMode(expense, "expense");
                                }}
                              >
                                <PenSquare className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                isIconOnly
                                className="bg-transparent hover:bg-gray-200"
                                onPress={(e) => {
                                  handleDeleteExpense(expense.name);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-4">
            <Switch
              isSelected={manualControl} // Change checked to isSelected for NextUI v2
              onValueChange={async (checked) => {
                // Change onChange to onValueChange
                try {
                  setIsLoading(true);
                  const formDataToSend = new FormData();
                  formDataToSend.append(
                    "startDate",
                    formData.startDate.toISOString()
                  );
                  formDataToSend.append(
                    "endDate",
                    formData.endDate.toISOString()
                  );
                  formDataToSend.append(
                    "invoiceFormat",
                    formData.invoiceFormat.prefix
                  );
                  formDataToSend.append("color", formData.color);
                  formDataToSend.append("manualYearControl", String(checked));

                  const response = await axios.post(
                    `/api/settings/finance/invoice`,
                    formDataToSend
                  );

                  if (response.data.success) {
                    setManualControl(checked);
                    setFormData((prev) => ({
                      ...prev,
                      manualYearControl: checked,
                    }));
                    toast.success(
                      `Manual control ${checked ? "enabled" : "disabled"}`
                    );
                  }
                } catch (error) {
                  toast.error("Failed to update manual control setting");
                } finally {
                  setIsLoading(false);
                }
              }}
            />
            <span>Manual Financial Year Control</span>
          </div>

          <div className="flex justify-center pt-4">
            <Button
              className={`px-12 bg-hotel-primary text-white ${
                hasUnsavedChanges ? "animate-pulse" : ""
              }`}
              radius="full"
              onPress={handleSave}
              isLoading={isLoading}
              disabled={!hasUnsavedChanges}
            >
              {hasUnsavedChanges ? "Save Changes" : "Saved"}
            </Button>
          </div>
        </div>
      </div>

      <Modal isOpen={showSaveModal} onClose={() => setShowSaveModal(false)}>
        <ModalContent>
          <ModalHeader>Confirm Save</ModalHeader>
          <ModalBody>Are you sure you want to save these changes?</ModalBody>
          <ModalFooter>
            <Button
              color="danger"
              variant="light"
              onPress={() => setShowSaveModal(false)}
            >
              Cancel
            </Button>
            <Button
              className="bg-hotel-primary text-white"
              onPress={confirmSave}
              isLoading={isLoading}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </section>
  );
}
