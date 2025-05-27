"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { User } from "@heroui/user";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Spinner } from "@heroui/spinner";
import { Pagination } from "@heroui/pagination";
import { Input } from "@heroui/input";

import { FileText, FileSpreadsheet, FileJson, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import { toast } from "react-toastify";
import { PlusIcon } from "../../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../../ui/Table/SearchIcon.jsx";
import { PiFadersHorizontal } from "react-icons/pi";
import { columns } from "./data";
import { capitalize } from "../../ui/Table/utils";
import EmployeeProfileModal from "./EmployeeDetails";
import TableSkeleton from "../../ui/TableSkeleton.jsx";
import Link from "next/link";
import { usePagePermission } from "../../../hooks/usePagePermission";

const INITIAL_VISIBLE_COLUMNS = [
  "name",
  "department",
  "role",
  "schedule",
  "contact",
  "email",
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

export default function Employees() {
  const hasViewPermission = usePagePermission("Employees", "view");
  const hasAddPermission = usePagePermission("Employees", "add");
  const hasEditPermission = usePagePermission("Employees", "edit");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [employees, setEmployees] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [roleOptions, setRoleOptions] = useState([]);
  const [scheduleOptions, setScheduleOptions] = useState([]);
  const [isClient, setIsClient] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState(new Set([]));
  const [roleFilter, setRoleFilter] = useState(new Set([]));
  const [scheduleFilter, setScheduleFilter] = useState(new Set([]));
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    async function fetchEmployees() {
      setIsLoading(true);
      try {
        const response = await fetch(`/api/employeeManagement`);
        const result = await response.json();
        if (response.ok) {
          setEmployees(result.employees);
          setDepartmentOptions(
            getUniqueOptions(result.employees, "department.name")
          );
          setRoleOptions(getUniqueOptions(result.employees, "role.role"));
          setScheduleOptions(
            getUniqueOptions(result.employees, "shiftTime.name")
          );
        } else {
          console.error("Failed to fetch employees:", result.message);
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmployees();
  }, []);

  const getUniqueOptions = (data, key) => {
    const options = data.map((item) => {
      const keys = key.split(".");
      let value = item;
      keys.forEach((k) => {
        value = value ? value[k] : undefined;
      });
      return value;
    });
    return [...new Set(options.filter(Boolean))].map((option) => ({
      uid: option.toLowerCase().replace(/\s+/g, "_"),
      name: option,
    }));
  };

  const openModal = (employee) => {
    const simplifiedEmployee = {
      employeeId: employee.employeeId,
      firstName: employee.firstName,
      lastName: employee.lastName,
      avatar: employee.avatar,
      role: employee.role,
      gender: employee.gender,
      dateOfBirth: employee.dateOfBirth,
      email: employee.email,
      mobileNo: employee.mobileNo,
      dateOfHiring: employee.dateOfHiring,
      department: employee.department,
      shiftTime: employee.shiftTime,
      weekOff: employee.weekOff,
      documents: employee.documents,
    };
    setSelectedEmployee(simplifiedEmployee);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedEmployee(null);
  };

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredEmployees = [...employees];

    if (filterValue) {
      const searchTerm = filterValue.toLowerCase().trim();
      filteredEmployees = filteredEmployees.filter((employee) => {
        return (
          employee.firstName?.toLowerCase().includes(searchTerm) ||
          employee.lastName?.toLowerCase().includes(searchTerm) ||
          employee.employeeId?.toLowerCase().includes(searchTerm) ||
          employee.email?.toLowerCase().includes(searchTerm) ||
          employee.department?.name?.toLowerCase().includes(searchTerm) ||
          employee.role?.role?.toLowerCase().includes(searchTerm) ||
          employee.mobileNo?.includes(searchTerm) ||
          `${employee.firstName} ${employee.lastName}`
            .toLowerCase()
            .includes(searchTerm)
        );
      });
    }

    if (departmentFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(departmentFilter).includes(
          employee.department?.name?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    if (roleFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(roleFilter).includes(
          employee.role?.role?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    if (scheduleFilter.size > 0) {
      filteredEmployees = filteredEmployees.filter((employee) =>
        Array.from(scheduleFilter).includes(
          employee.shiftTime?.name?.toLowerCase().replace(/\s+/g, "_")
        )
      );
    }

    return filteredEmployees;
  }, [employees, filterValue, departmentFilter, roleFilter, scheduleFilter]);

  const pages = Math.ceil(filteredItems.length / rowsPerPage);

  const items = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    const end = start + rowsPerPage;

    return filteredItems.slice(start, end);
  }, [page, filteredItems, rowsPerPage]);

  const sortedItems = React.useMemo(() => {
    return [...items].sort((a, b) => {
      const first = a[sortDescriptor.column];
      const second = b[sortDescriptor.column];
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = React.useCallback(
    (employee, columnKey) => {
      const cellValue = employee[columnKey];

      switch (columnKey) {
        case "name":
          return (
            <User
              avatarProps={{ radius: "lg", src: employee.avatar }}
              description={employee.employeeId}
              name={`${employee.firstName} ${employee.lastName}`}
            >
              {employee.email}
            </User>
          );
        case "department":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.department?.name || "N/A"}
              </p>
            </div>
          );
        case "role":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.role?.role || "N/A"}
              </p>
            </div>
          );
        case "schedule":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.shiftTime.name}
              </p>
              <p className="text-bold text-tiny capitalize">
                {employee.shiftTime.startTime} - {employee.shiftTime.endTime}
              </p>
            </div>
          );
        case "contact":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.mobileNo}
              </p>
            </div>
          );
        case "email":
          return (
            <div className="flex flex-col">
              <p className="text-bold text-small capitalize">
                {employee.email}
              </p>
            </div>
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                {hasViewPermission && (
                  <Button
                    isIconOnly
                    variant="light"
                    onPress={() => openModal(employee)}
                    className="text-default-500"
                  >
                    <FaEye size={18} />
                  </Button>
                )}
                {hasEditPermission && (
                  <Link href={`/dashboard/employees/${employee.employeeId}`}>
                    <Button
                      isIconOnly
                      variant="light"
                      className="text-default-500"
                    >
                      <FaRegEdit size={18} />
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          );
        default:
          return cellValue;
      }
    },
    [hasViewPermission, hasEditPermission]
  );

  const onRowsPerPageChange = (e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  };

  const onSearchChange = (value) => {
    setFilterValue(value);
    setPage(1);
  };

  const onClear = () => {
    setFilterValue("");
    setPage(1);
  };

  // Function to get export data
  const getExportData = useCallback(() => {
    return filteredItems.map((employee) => {
      return {
        Name: `${employee.firstName} ${employee.lastName}` || "-",
        "Employee ID": employee.employeeId || "-",
        Department: employee.department?.name || "-",
        Role: employee.role?.role || "-",
        Schedule: employee.shiftTime?.name || "-",
        Contact: employee.mobileNo || "-",
        Email: employee.email || "-",
        Gender: employee.gender || "-",
        "Date of Birth": employee.dateOfBirth
          ? new Date(employee.dateOfBirth).toLocaleDateString()
          : "-",
        "Date of Hiring": employee.dateOfHiring
          ? new Date(employee.dateOfHiring).toLocaleDateString()
          : "-",
        "Week Off": employee.weekOff?.join(", ") || "-",
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
      doc.text("Employees", 15, 15);

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
              "Employee ID": "",
              Department: "",
              Role: "",
              Schedule: "",
              Contact: "",
              Email: "",
              Gender: "",
              "Date of Birth": "",
              "Date of Hiring": "",
              "Week Off": "",
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

      doc.save("employees.pdf");
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
      XLSX.utils.book_append_sheet(wb, ws, "Employees");
      XLSX.writeFile(wb, "employees.xlsx");
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
      link.download = "employees.csv";
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
      link.download = "employees.json";
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

  // Update topContent to include the downloadButton
  const topContent = useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Employees</h1>
          <div className="flex gap-3">
            {downloadButton}
            <Input
              isClearable
              placeholder="Search..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
              classNames={{
                base: "w-full sm:max-w-[44%]",
                inputWrapper: "bg-hotel-secondary",
                input: "text-hotel-primary-text",
              }}
            />
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<CiFilter />}
                  variant="flat"
                  className="bg-hotel-secondary text-hotel-primary-text"
                >
                  {departmentFilter.size
                    ? `${departmentFilter.size} Departments`
                    : "Department"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Department"
                closeOnSelect={false}
                selectedKeys={departmentFilter}
                selectionMode="multiple"
                onSelectionChange={setDepartmentFilter}
              >
                {departmentOptions.map((department) => (
                  <DropdownItem key={department.uid} className="capitalize">
                    {department.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<CiFilter />}
                  variant="flat"
                  className="bg-hotel-secondary text-hotel-primary-text"
                >
                  {roleFilter.size ? `${roleFilter.size} Roles` : "Role"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Role"
                closeOnSelect={false}
                selectedKeys={roleFilter}
                selectionMode="multiple"
                onSelectionChange={setRoleFilter}
              >
                {roleOptions.map((role) => (
                  <DropdownItem key={role.uid} className="capitalize">
                    {role.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={<CiFilter />}
                  variant="flat"
                  className="bg-hotel-secondary text-hotel-primary-text"
                >
                  {scheduleFilter.size
                    ? `${scheduleFilter.size} Schedules`
                    : "Schedule"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Schedule"
                closeOnSelect={false}
                selectedKeys={scheduleFilter}
                selectionMode="multiple"
                onSelectionChange={setScheduleFilter}
              >
                {scheduleOptions.map((schedule) => (
                  <DropdownItem key={schedule.uid} className="capitalize">
                    {schedule.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  isIconOnly
                  variant="flat"
                  className="bg-hotel-secondary text-hotel-primary-text"
                >
                  <PiFadersHorizontal />
                </Button>
              </DropdownTrigger>
              <DropdownMenu
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
            {hasAddPermission && (
              <Button
                as={Link}
                href="/dashboard/employees/add-employee"
                className="bg-hotel-primary-yellow text-hotel-primary-text"
                endContent={<PlusIcon />}
              >
                Add Employee
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {employees.length} employees
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
    departmentFilter,
    roleFilter,
    scheduleFilter,
    visibleColumns,
    employees.length,
    rowsPerPage,
    onSearchChange,
    onClear,
    onRowsPerPageChange,
    departmentOptions,
    roleOptions,
    scheduleOptions,
    hasAddPermission,
    downloadButton,
  ]);

  const bottomContent = (
    <div className="py-2 px-2 flex justify-between items-center">
      <span className="w-[30%] text-small text-default-400">
        Showing {Math.min((page - 1) * rowsPerPage + 1, filteredItems.length)}-
        {Math.min(page * rowsPerPage, filteredItems.length)} of{" "}
        {filteredItems.length}
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

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view employees
      </div>
    );
  }

  return (
    <>
      {isClient ? (
        isLoading ? (
          <TableSkeleton />
        ) : (
          <Table
            aria-label="Employee table"
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="inside"
            classNames={{
              wrapper: "",
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
                  suppressHydrationWarning={true}
                >
                  {column.name}
                </TableColumn>
              )}
            </TableHeader>
            <TableBody emptyContent={"No employees found"} items={sortedItems}>
              {(item) => (
                <TableRow key={item._id}>
                  {(columnKey) => (
                    <TableCell style={{ color: "#0D0E0D" }}>
                      {renderCell(item, columnKey)}
                    </TableCell>
                  )}
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      ) : null}

      {isModalOpen && selectedEmployee && (
        <EmployeeProfileModal
          isModalOpen={isModalOpen}
          onCloseModal={closeModal}
          employee={selectedEmployee}
        />
      )}
    </>
  );
}
