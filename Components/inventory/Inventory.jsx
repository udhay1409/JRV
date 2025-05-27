"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  useMemo,
} from "react";
import axios from "axios";
import { FaEye, FaRegEdit } from "react-icons/fa";
import { CiFilter } from "react-icons/ci";
import Link from "next/link";
import { usePagePermission } from "../../hooks/usePagePermission";
import { FileText, FileSpreadsheet, FileJson, Download } from "lucide-react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { Parser } from "json2csv";
import { toast } from "react-toastify";
import { Spinner } from "@heroui/spinner";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Dropdown, DropdownTrigger } from "@heroui/dropdown";
import { DropdownMenu, DropdownItem } from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { Pagination } from "@heroui/pagination";
import { PlusIcon } from "../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import { PiFadersHorizontal } from "react-icons/pi";
import { capitalize } from "../ui/Table/utils";
import TableSkeleton from "../ui/TableSkeleton";

// Remove unused imports and constants

const statusOptions = [
  { name: "In Stock", uid: "inStock" },
  { name: "Low Stock", uid: "lowStock" },
  { name: "Out of Stock", uid: "outOfStock" },
];

const ALL_COLUMNS = [
  {
    name: "SUPPLIER",
    uid: "supplierName",
    key: "supplierName",
    sortable: true,
  },
  { name: "CATEGORY", uid: "category", key: "category", sortable: true },
  {
    name: "SUB CATEGORY",
    uid: "subCategory",
    key: "subCategory",
    sortable: true,
  },
  { name: "BRAND", uid: "brandName", key: "brandName", sortable: true },
  { name: "MODEL", uid: "model", key: "model", sortable: true },
  { name: "PRICE", uid: "price", key: "price", sortable: true },
  { name: "GST", uid: "gst", key: "gst", sortable: true },
  {
    name: "QUANTITY",
    uid: "quantityInStock",
    key: "quantityInStock",
    sortable: true,
  },
  { name: "STATUS", uid: "status", key: "status", sortable: true },
  {
    name: "LOW QUANTITY ALERT",
    uid: "lowQuantityAlert",
    key: "lowQuantityAlert",
    sortable: true,
  },
  {
    name: "DESCRIPTION",
    uid: "description",
    key: "description",
    sortable: true,
  },
  { name: "ACTIONS", uid: "actions", key: "actions" },
];

const DEFAULT_VISIBLE_COLUMNS = [
  "supplierName",
  "category",
  "brandName",
  "model",
  "price",
  "quantityInStock",
  "status",
  "actions",
];

const getItemStatus = (quantity, lowQuantityAlert) => {
  if (quantity <= 0) return "outOfStock";
  if (quantity <= lowQuantityAlert) return "lowStock";
  return "inStock";
};

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

export default function App() {
  const hasViewPermission = usePagePermission("Inventory", "view");
  const hasAddPermission = usePagePermission("Inventory", "add");
  const hasEditPermission = usePagePermission("Inventory", "edit");
  const [inventory, setInventory] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brandNames, setBrandNames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterValue, setFilterValue] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = React.useState(
    new Set(DEFAULT_VISIBLE_COLUMNS)
  );
  const [categoryFilter, setCategoryFilter] = React.useState(new Set([]));
  const [brandFilter, setBrandFilter] = React.useState(new Set([]));
  const [statusFilter, setStatusFilter] = React.useState(new Set([]));
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "age",
    direction: "ascending",
  });
  const [page, setPage] = React.useState(1);
  const [isMounted, setIsMounted] = useState(false);
  const keyCounterRef = useRef(0);
  const [isExporting, setIsExporting] = useState(false);

  const hasSearchFilter = Boolean(filterValue);

  const fetchInventory = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`/api/inventory`);
      if (response.data.success) {
        setInventory(response.data.data);
        setCategories([
          ...new Set(response.data.data.map((item) => item.category)),
        ]);
        setBrandNames([
          ...new Set(response.data.data.map((item) => item.brandName)),
        ]);
      }
    } catch (error) {
      console.error("Failed to fetch inventory:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchInventory();
  }, []);

  const generateUniqueKey = (item, index) => {
    keyCounterRef.current += 1;
    return `row-${index}-${item?.brandName || "unknown"}-${
      item?._id || "none"
    }-${keyCounterRef.current}`;
  };

  const headerColumns = React.useMemo(() => {
    if (visibleColumns === "all") return ALL_COLUMNS;
    return ALL_COLUMNS.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns]);

  const filteredItems = React.useMemo(() => {
    let filteredInventory = [...inventory];

    if (hasSearchFilter) {
      filteredInventory = filteredInventory.filter(
        (item) =>
          item.brandName.toLowerCase().includes(filterValue.toLowerCase()) ||
          item.category.toLowerCase().includes(filterValue.toLowerCase()) ||
          getItemStatus(item.quantityInStock, item.lowQuantityAlert)
            .toLowerCase()
            .includes(filterValue.toLowerCase())
      );
    }

    if (categoryFilter.size > 0) {
      filteredInventory = filteredInventory.filter((item) =>
        Array.from(categoryFilter).includes(item.category)
      );
    }

    if (brandFilter.size > 0) {
      filteredInventory = filteredInventory.filter((item) =>
        Array.from(brandFilter).includes(item.brandName)
      );
    }

    if (statusFilter.size > 0) {
      filteredInventory = filteredInventory.filter((item) => {
        const itemStatus = getItemStatus(
          item.quantityInStock,
          item.lowQuantityAlert
        );
        return Array.from(statusFilter).includes(itemStatus);
      });
    }

    return filteredInventory;
  }, [
    inventory,
    filterValue,
    categoryFilter,
    brandFilter,
    statusFilter,
    hasSearchFilter,
  ]);

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

  useEffect(() => {
    keyCounterRef.current = 0;
  }, [sortedItems]);

  const renderCell = React.useCallback(
    (item, columnKey) => {
      const cellValue = item[columnKey];

      switch (columnKey) {
        case "status":
          const status = getItemStatus(
            item.quantityInStock,
            item.lowQuantityAlert
          );
          return (
            <Chip
              className={`capitalize ${
                status === "inStock"
                  ? "bg-hotel-primary-green text-white"
                  : status === "lowStock"
                  ? "bg-hotel-primary text-white"
                  : "bg-hotel-primary-red text-white"
              }`}
              size="md"
              radius="sm"
            >
              {status === "inStock"
                ? "In Stock"
                : status === "lowStock"
                ? "Low Stock"
                : "Out of Stock"}
            </Chip>
          );
        case "price":
          return `₹${cellValue}`;
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasViewPermission && (
                <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                  <Link href={`/dashboard/inventory/${item._id}`}>
                    {" "}
                    <FaEye style={{ color: "#6E6E6E" }} />
                  </Link>
                </div>
              )}
              {hasEditPermission && (
                <Link href={`/dashboard/inventory/edit-item/${item._id}`}>
                  <div className="actions-icons-bg p-2 rounded-medium flex gap-2">
                    <FaRegEdit style={{ color: "#6E6E6E" }} />
                  </div>
                </Link>
              )}
            </div>
          );
        default:
          return cellValue;
      }
    },
    [hasViewPermission, hasEditPermission]
  );

  // Function to get export data
  const getExportData = useCallback(() => {
    return filteredItems.map((item) => {
      return {
        Supplier: item.supplierName || "-",
        Category: item.category || "-",
        "Sub Category": item.subCategory || "-",
        Brand: item.brandName || "-",
        Model: item.model || "-",
        Price: formatCurrency(item.price) || "-",
        GST: `${item.gst}%` || "-",
        Quantity: item.quantityInStock || "-",
        Status: getItemStatus(item.quantityInStock, item.lowQuantityAlert),
        "Low Quantity Alert": item.lowQuantityAlert || "-",
        Description: item.description || "-",
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
      doc.text("Inventory", 15, 15);

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
              Supplier: "",
              Category: "",
              "Sub Category": "",
              Brand: "",
              Model: "",
              Price: "",
              GST: "",
              Quantity: "",
              Status: "",
              "Low Quantity Alert": "",
              Description: "",
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

      doc.save("inventory.pdf");
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
      XLSX.utils.book_append_sheet(wb, ws, "Inventory");
      XLSX.writeFile(wb, "inventory.xlsx");
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
      link.download = "inventory.csv";
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
      link.download = "inventory.json";
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

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-bold">Inventory</h1>
          <div className="flex gap-3">
            {downloadButton}
            <Input
              isClearable
              className="w-full sm:max-w-[44%] "
              classNames={{
                base: "w-full sm:max-w-[44%] ",
                inputWrapper: "bg-hotel-secondary ",
                input: "text-hotel-primary-text",
              }}
              placeholder="Search by brand, category..."
              startContent={<SearchIcon />}
              value={filterValue}
              onClear={() => setFilterValue("")}
              onValueChange={setFilterValue}
            />
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {categoryFilter.size
                    ? `${categoryFilter.size} Categories`
                    : "All Categories"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by Category"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={categoryFilter}
                onSelectionChange={setCategoryFilter}
              >
                {categories.map((category) => (
                  <DropdownItem key={category} className="capitalize">
                    {category}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {brandFilter.size
                    ? `${brandFilter.size} Brands`
                    : "All Brands"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by Brand"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={brandFilter}
                onSelectionChange={setBrandFilter}
              >
                {brandNames.map((brand) => (
                  <DropdownItem key={brand} className="capitalize">
                    {brand}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  className="min-w-28 bg-hotel-secondary text-hotel-primary-text"
                  startContent={<CiFilter />}
                  variant="flat"
                >
                  {statusFilter.size
                    ? `${statusFilter.size} Status`
                    : "All Status"}
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by Status"
                closeOnSelect={false}
                selectionMode="multiple"
                selectedKeys={statusFilter}
                onSelectionChange={setStatusFilter}
              >
                {statusOptions.map((status) => (
                  <DropdownItem key={status.uid} className="capitalize">
                    {status.name}
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
                {ALL_COLUMNS.map((column) => (
                  <DropdownItem key={column.uid} className="capitalize">
                    {capitalize(column.name)}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
            {hasAddPermission && (
              <Button
                className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                endContent={<PlusIcon />}
                as={Link}
                href="/dashboard/inventory/add-item"
              >
                Add Item
              </Button>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-default-400 text-small">
            Total {inventory.length} items
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
    categoryFilter,
    brandFilter,
    statusFilter,
    visibleColumns,
    categories,
    brandNames,
    rowsPerPage,
    inventory.length,
    hasAddPermission,
    downloadButton,
  ]);

  const bottomContent = React.useMemo(() => {
    const start = (page - 1) * rowsPerPage + 1;
    const end = Math.min(page * rowsPerPage, filteredItems.length);

    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          Showing {start}-{end} of {filteredItems.length}
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
  }, [filteredItems.length, page, pages, rowsPerPage]);

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view inventory
      </div>
    );
  }
  return (
    <div role="region" aria-label="Inventory Management">
      {isMounted ? (
        isLoading ? (
          <TableSkeleton />
        ) : (
          <Table
            aria-label="Inventory items table"
            isHeaderSticky
            bottomContent={bottomContent}
            bottomContentPlacement="inside"
            selectionMode="single"
            classNames={{
              wrapper: "min-h-[400px]",
            }}
            sortDescriptor={sortDescriptor}
            topContent={topContent}
            topContentPlacement="inside"
            onSelectionChange={setSelectedKeys}
            onSortChange={setSortDescriptor}
            hideHeader={!isMounted}
          >
            <TableHeader>
              {headerColumns.map((column) => (
                <TableColumn
                  key={column.key}
                  align={column.uid === "actions" ? "center" : "start"}
                  allowsSorting={column.sortable}
                  className="text-sm capitalize"
                >
                  {column.name}
                </TableColumn>
              ))}
            </TableHeader>
            <TableBody
              items={sortedItems}
              isLoading={isLoading}
              loadingContent={<div>Loading inventory...</div>}
              emptyContent={!isLoading ? "No inventory items found" : null}
            >
              {(item, index) => (
                <TableRow key={generateUniqueKey(item, index)}>
                  {(columnKey) =>
                    headerColumns.some((col) => col.uid === columnKey) && (
                      <TableCell
                        key={`${generateUniqueKey(item, index)}-${columnKey}`}
                      >
                        {renderCell(item, columnKey)}
                      </TableCell>
                    )
                  }
                </TableRow>
              )}
            </TableBody>
          </Table>
        )
      ) : (
        <TableSkeleton />
      )}
    </div>
  );
}
