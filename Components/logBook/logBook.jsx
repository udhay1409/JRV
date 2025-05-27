"use client"

import React, { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays } from "date-fns"
import { 
  CalendarIcon, 
  Download, 
  Eye, 
  FileEdit, 
  Search, 
  Trash2,
  X
} from "lucide-react"
import { 
  FaBoxOpen,  // For issued items
  FaMoneyBillWave,  // For charges
  FaClock,  // For pending items
  FaExclamationTriangle  // For damaged items
} from "react-icons/fa"
import { Button } from "@heroui/button"
import { Input } from "@heroui/input"
import { Table, TableHeader, TableBody, TableColumn, TableRow, TableCell } from "@heroui/table"
import { Pagination } from "@heroui/pagination"
import { DateRangePicker } from "@heroui/date-picker"
import { Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/dropdown"
import { PiFadersHorizontal } from "react-icons/pi"
import ConfirmationDialog from "../ui/ConfirmationDialog"
import { PlusIcon } from "@/Components/ui/Table/PlusIcon"
import { cn } from "@/lib/utils"
import "./logbook.css"
import { Chip } from "@heroui/chip"
import { Tooltip } from "@heroui/tooltip"
import Link from "next/link"
import axios from "axios"
import { toast } from "react-toastify"
import { Modal } from "@heroui/modal"
import ViewLogBookDetails from "@/Components/logBook/ViewLogBookDetails"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/Components/ui/select"
import LogBookSkeleton from "./LogBookSkeleton"
import { usePagePermission } from "@/hooks/usePagePermission"

const INITIAL_VISIBLE_COLUMNS = [
  "customerName",
  "propertyType",
  "event",
  "date",
  "checkInTime",
  "issuedItems",
  "status",
  "actions"
]

const statusColorMap = {
  Verified: "success",
  Issued: "warning",
};

export default function LogBook() {
  // Add permission checks
  const hasAddPermission = usePagePermission("LogBook", "add");
  const hasEditPermission = usePagePermission("LogBook", "edit");
  const hasDeletePermission = usePagePermission("LogBook", "delete");

  const [filterValue, setFilterValue] = useState("")
  const [page, setPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)
  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: addDays(new Date(), 1),
  })
  const [columns, setColumns] = useState([])
  const [visibleColumns, setVisibleColumns] = useState(new Set(INITIAL_VISIBLE_COLUMNS))
  const [logEntries, setLogEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortDescriptor, setSortDescriptor] = useState({ column: "", direction: "ascending" });

  // Fetch log entries
  const fetchLogEntries = async () => {
    try {
      setIsLoading(true)
      const response = await axios.get(`/api/logBook?page=${page}&limit=${rowsPerPage}`)
      if (response.data.success) {
        setLogEntries(response.data.data)
        setTotalItems(response.data.pagination.total)
        setTotalPages(response.data.pagination.pages)
      }
    } catch (error) {
      console.error('Error fetching log entries:', error)
      toast.error('Failed to fetch log entries')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchLogEntries()
  }, [page, rowsPerPage])

  const handleDeleteClick = (item) => {
    if (!hasDeletePermission) {
      toast.error("You don't have permission to delete log entries");
      return;
    }
    setItemToDelete(item)
    setIsDeleteDialogOpen(true)
  }

  const handleDelete = async () => {
    try {
      if (!itemToDelete) return

      const response = await axios.delete(`/api/logBook?id=${itemToDelete._id}`)
      if (response.data.success) {
        toast.success('Log entry deleted successfully')
        fetchLogEntries() // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting log entry:', error)
      toast.error('Failed to delete log entry')
    } finally {
      setIsDeleteDialogOpen(false)
      setItemToDelete(null)
    }
  }

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value))
    setPage(1)
  }, [])

  const onSearchChange = useCallback((value) => {
    if (value) {
      setFilterValue(value)
      setPage(1)
    } else {
      setFilterValue("")
    }
  }, [])

  const onClear = useCallback(() => {
    setFilterValue("")
    setPage(1)
  }, [])

  const filteredData = logEntries.filter(item => {
    const searchTerm = filterValue.toLowerCase();
    const itemFromDate = new Date(item.dateRange?.from);
    const itemToDate = new Date(item.dateRange?.to);
    const filterFromDate = new Date(dateRange.from);
    const filterToDate = new Date(dateRange.to);

    // Add status filter check
    const matchesStatus = statusFilter === "all" || item.status === statusFilter;

    // Rest of your existing date checks...
    filterFromDate.setHours(0, 0, 0, 0);
    filterToDate.setHours(23, 59, 59, 999);
    itemFromDate.setHours(0, 0, 0, 0);
    itemToDate.setHours(23, 59, 59, 999);

    const isDefaultDateRange = 
      filterFromDate.getTime() === new Date().setHours(0, 0, 0, 0) &&
      filterToDate.getTime() === addDays(new Date(), 1).setHours(23, 59, 59, 999);

    if (isDefaultDateRange) {
      return matchesStatus && (
        item.customerName?.toLowerCase().includes(searchTerm) ||
        item.bookingId?.toLowerCase().includes(searchTerm) ||
        item.mobileNo?.toLowerCase().includes(searchTerm) ||
        item.propertyType?.toLowerCase().includes(searchTerm) ||
        item.eventType?.toLowerCase().includes(searchTerm) ||
        item.status?.toLowerCase().includes(searchTerm)
      );
    }

    const isDateInRange = (
      (itemFromDate >= filterFromDate && itemFromDate <= filterToDate) ||
      (itemToDate >= filterFromDate && itemToDate <= filterToDate) ||
      (itemFromDate <= filterFromDate && itemToDate >= filterToDate)
    );

    const matchesSearch = (
      item.customerName?.toLowerCase().includes(searchTerm) ||
      item.bookingId?.toLowerCase().includes(searchTerm) ||
      item.mobileNo?.toLowerCase().includes(searchTerm) ||
      item.propertyType?.toLowerCase().includes(searchTerm) ||
      item.eventType?.toLowerCase().includes(searchTerm) ||
      item.status?.toLowerCase().includes(searchTerm)
    );

    return matchesSearch && isDateInRange && matchesStatus;
  });

  const generateColumns = useCallback(() => {
    const newColumns = [
      {
        key: "customerName",
        name: "Customer Name",
        uid: "customerName",
        sortable: true,
      },
      {
        key: "propertyType",
        name: "Property Type",
        uid: "propertyType",
        sortable: true,
      },
      {
        key: "event",
        name: "Event Type",
        uid: "eventType",
        sortable: true,
      },
      {
        key: "date",
        name: "Date",
        uid: "dateRange",
        sortable: true,
      },
      {
        key: "issuedItems",
        name: "Issued Items",
        uid: "itemsIssued",
        sortable: true,
      },
      {
        key: "status",
        name: "Status",
        uid: "status",
        sortable: true,
      },
      {
        key: "mobileNo",
        name: "Mobile No",
        uid: "mobileNo",
        sortable: true,
      },
      {
        key: "checkInTime",
        name: "Check-in Time",
        uid: "checkInTime",
        sortable: true,
      },
      {
        key: "notes",
        name: "Notes",
        uid: "notes",
        sortable: true,
      },
      {
        key: "electricity",
        name: "Electricity/Generator",
        uid: "electricityReadings",
        sortable: true,
      },
      {
        key: "actions",
        name: "Actions",
        uid: "actions",
      }
    ]
    setColumns(newColumns)
  }, [])

  const handleViewDetails = (item) => {
    setSelectedLog(item);
    setDetailModalOpen(true);
  };

  const renderCell = useCallback((item, column) => {
    const cellValue = item[column.uid]

    switch (column.uid) {
      case "customerName":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.customerName}</p>
            <p className="text-bold text-tiny text-default-500">{item.bookingId}</p>
          </div>
        )
      case "propertyType":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small capitalize">{item.propertyType}</p>
          </div>
        )
      case "itemsIssued":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
            color={item.itemsIssued.length > 5 ? "warning" : "success"}
          >
            {item.itemsIssued.length} items
          </Chip>
        )
      case "status":
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[item.status]}
            size="sm"
            variant="flat"
          >
            {item.status}
          </Chip>
        )
      case "dateRange":
        return (
          <div className="flex flex-col">
            <p className="text-bold text-small">
              {format(new Date(item.dateRange.from), 'dd/MM/yyyy')}
            </p>
            <p className="text-bold text-tiny text-default-500">
              to {format(new Date(item.dateRange.to), 'dd/MM/yyyy')}
            </p>
          </div>
        )
      case "checkInTime":
        if (!cellValue) return "-";
        try {
          return new Date(`2000-01-01T${cellValue}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
          });
        } catch (error) {
          return cellValue;
        }
      case "electricityReadings":
        return (
          <Chip
            className="capitalize"
            size="sm"
            variant="flat"
            color={item.electricityReadings.length > 0 ? "success" : "default"}
          >
            {item.electricityReadings.length > 0 ? "Yes" : "No"}
          </Chip>
        )
      case "eventType":
        return (
          <div className="flex flex-col">
            {item.eventType ? (
              <p className="text-bold text-small capitalize">{item.eventType}</p>
            ) : (
              <span className="text-gray-400 text-xs">N/A</span>
            )}
          </div>
        )
      case "actions":
        return (
          <div className="relative flex items-center justify-center gap-2">
            <Tooltip content="View Details">
              <Button 
                isIconOnly 
                variant="light" 
                className="text-default-400 cursor-pointer active:opacity-50" 
                onPress={() => handleViewDetails(item)}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Tooltip>
            
            {/* Only show edit button if status is not Verified and user has edit permission */}
            {item.status !== 'Verified' && hasEditPermission && (
              <Tooltip content="Edit">
                <Link href={`/dashboard/logBook/edit-log/${item._id}`}>
                  <Button 
                    isIconOnly 
                    variant="light" 
                    className="text-default-400 cursor-pointer active:opacity-50"
                  >
                    <FileEdit className="h-4 w-4" />
                  </Button>
                </Link>
              </Tooltip>
            )}

            {hasDeletePermission && (
              <Tooltip content="Delete">
                <Button 
                  isIconOnly 
                  variant="light" 
                  className="text-danger cursor-pointer active:opacity-50"
                  onPress={() => handleDeleteClick(item)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </Tooltip>
            )}
          </div>
        )
      default:
        return cellValue
    }
  }, [])

  useEffect(() => {
    generateColumns()
  }, [generateColumns])

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns
    return columns.filter((column) => 
      Array.from(visibleColumns).includes(column.uid)
    )
  }, [visibleColumns, columns])

  // Calculate metrics
  const calculateMetrics = useMemo(() => {
    // Get today's date at the start of the day (midnight)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Get today's date at the end of the day
    const endOfToday = new Date()
    endOfToday.setHours(23, 59, 59, 999)
    
    // Filter entries created today based on createdAt timestamp
    const todayEntries = logEntries.filter(entry => {
      const createdDate = new Date(entry.createdAt)
      return createdDate >= today && createdDate <= endOfToday
    })
    
    // 1. Total Items Issued Today (count of entries issued today with 'Issued' status)
    const totalItemsIssued = todayEntries.filter(entry => entry.status === 'Issued').length
    
    // 2. Total Item Charges (calculate grand total from all entries)
    const totalCharges = logEntries.reduce((sum, entry) => 
      sum + (entry.grandTotal || entry.totalAmount || 0), 0)
    
    // 3. Pending Items to Return (count of entries with status 'Issued')
    const pendingItems = logEntries.filter(entry => entry.status === 'Issued').length
    
    // 4. Damage Items Reported (count of entries with damage reports)
    const damagedItems = logEntries.filter(entry => 
      (entry.damageLossSummary && entry.damageLossSummary.length > 0) || 
      entry.itemsIssued.some(item => item.condition === 'Poor')
    ).length
    
    return {
      totalItemsIssued,
      totalCharges,
      pendingItems,
      damagedItems
    }
  }, [logEntries])

  const handleDownload = () => {
    try {
      // Define the headers for the CSV
      const headers = [
        "Customer Name",
        "Booking ID",
        "Property Type",
        "Event Type",
        "Date From",
        "Date To",
        "Check-in Time",
        "Items Issued",
        "Status",
        "Notes"
      ];

      // Format the data for CSV
      const csvData = filteredData.map(entry => [
        entry.customerName,
        entry.bookingId,
        entry.propertyType,
        entry.eventType || "N/A",
        format(new Date(entry.dateRange.from), "dd/MM/yyyy"),
        format(new Date(entry.dateRange.to), "dd/MM/yyyy"),
        entry.checkInTime || "N/A",
        entry.itemsIssued.length,
        entry.status,
        entry.notes || "N/A"
      ]);

      // Combine headers and data
      const csvContent = [
        headers.join(","),
        ...csvData.map(row => row.join(","))
      ].join("\n");

      // Create a Blob and download link
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      
      link.setAttribute("href", url);
      link.setAttribute("download", `logbook_export_${format(new Date(), "dd-MM-yyyy")}.csv`);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error downloading CSV:", error);
      toast.error("Failed to download data");
    }
  };

  const sortedItems = useMemo(() => {
    const items = [...filteredData];
    
    if (!sortDescriptor.column) return items;

    return items.sort((a, b) => {
      let first = a[sortDescriptor.column];
      let second = b[sortDescriptor.column];

      // Handle special cases
      switch (sortDescriptor.column) {
        case "dateRange":
          first = new Date(a.dateRange.from);
          second = new Date(b.dateRange.from);
          break;
        case "itemsIssued":
          first = a.itemsIssued?.length || 0;
          second = b.itemsIssued?.length || 0;
          break;
        case "electricityReadings":
          first = a.electricityReadings?.length || 0;
          second = b.electricityReadings?.length || 0;
          break;
      }

      const cmp = first < second ? -1 : first > second ? 1 : 0;
      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [filteredData, sortDescriptor]);

  if (isLoading) {
    return <LogBookSkeleton />;
  }

  return (
    <div className="container mx-auto p-4 bg-white">
      {/* Metrics Cards */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 databoxmain">
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Total Items Issued Today</span>
              <div className="databoxback">
                <FaBoxOpen className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">{calculateMetrics.totalItemsIssued}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Total Item Charges</span>
              <div className="databoxback">
                <FaMoneyBillWave className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">₹{calculateMetrics.totalCharges.toLocaleString()}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Pending Items to Return</span>
              <div className="databoxback">
                <FaClock className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">{calculateMetrics.pendingItems}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <span className="text-sm font-medium">Damage Items Reported</span>
              <div className="databoxback">
                <FaExclamationTriangle className="h-4 w-4 text-white" />
              </div>
            </div>
            <div className="py-2">
              <div className="text-2xl font-bold">{calculateMetrics.damagedItems}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Working Sheet Logs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-hotel-primary-text font-semibold text-lg">Working sheet Logs</h2>
          
          <div className="flex gap-3">
            <Input
              isClearable
              classNames={{
                base: "w-full sm:max-w-[44%] date-btn",
                inputWrapper: "bg-hotel-secondary",
                input: "text-hotel-primary-text",
              }}
              placeholder="Search"
              startContent={<Search className="h-4 w-4 text-gray-500" />}
              value={filterValue}
              onClear={() => onClear()}
              onValueChange={onSearchChange}
            />

            {/* Add Status Filter here */}
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-[150px] bg-hotel-secondary">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Verified">Verified</SelectItem>
                <SelectItem value="Issued">Issued</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2">
              <DateRangePicker
                className="bg-white text-[#333] border-0 w-[280px]"
                label="Select Dates"
                onChange={(range) => {
                  if (!range || !range.start || !range.end) {
                    setDateRange({
                      from: new Date(),
                      to: addDays(new Date(), 1),
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

                  setDateRange({
                    from: startDate,
                    to: endDate,
                  });
                }}
                classNames={{
                  base: "bg-hotel-secondary rounded-lg h-[40px]",
                  trigger: "bg-hotel-secondary rounded-lg h-[40px]",
                  value: "text-hotel-primary-text text-sm",
                  content: "h-[40px]",
                  popover: "rounded-lg mt-1",
                  input: "h-[40px]",
                }}
              />
            </div>

            <Button
              className="min-w-[40px] bg-hotel-secondary text-hotel-primary-text"
              isIconOnly
              variant="flat"
              onPress={handleDownload}
            >
              <Download className="h-4 w-4" />
            </Button>

            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button 
                  className="min-w-20 bg-hotel-secondary text-hotel-primary-text"
                  isIconOnly
                >
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
                    {column.name}
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>

            {hasAddPermission && (
              <Link href="/dashboard/logBook/add-log">
                <Button
                  className="min-w-44 bg-hotel-primary text-hotel-primary-text"
                  endContent={<PlusIcon />}
                >
                  Add Item
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="flex justify-between items-center mb-4">
          <span className="text-default-400 text-small">
            Total {totalItems} items
          </span>
          <label className="flex items-center text-default-400 text-small">
            Rows per page:
            <select
              className="bg-transparent outline-none text-default-400 text-small"
              onChange={onRowsPerPageChange}
              value={rowsPerPage}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="15">15</option>
            </select>
          </label>
        </div>

        <Table
          aria-label="Inventory logs table"
          sortDescriptor={sortDescriptor}
          onSortChange={setSortDescriptor}
          bottomContent={
            <div className="py-2 px-2 flex justify-between items-center">
              <span className="w-[30%] text-small text-default-400">
                {`Showing ${(page - 1) * rowsPerPage + 1}-${Math.min(page * rowsPerPage, totalItems)} of ${totalItems}`}
              </span>
              <div className="hidden sm:flex w-[30%] justify-end gap-2">
                <div className="custom-pagination">
                  <Pagination
                    isCompact
                    showControls
                    showShadow
                    page={page}
                    total={totalPages}
                    onChange={setPage}
                    className="custom-pagination"
                  />
                </div>
              </div>
            </div>
          }
          bottomContentPlacement="inside"
          classNames={{
            wrapper: "min-h-[400px]",
          }}
        >
          <TableHeader>
            {headerColumns.map((column) => (
              <TableColumn 
                key={column.uid}
                align={column.uid === "actions" ? "center" : "start"}
                allowsSorting={column.sortable}
              >
                {column.name}
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody 
            items={sortedItems}
            loadingContent={<div>Loading...</div>}
            loadingState={isLoading ? "loading" : "idle"}
          >
            {(item) => (
              <TableRow key={item._id}>
                {headerColumns.map((column) => (
                  <TableCell key={column.uid}>
                    {column.uid === "actions" ? (
                      <div className="relative flex items-center justify-center gap-2">
                        <Tooltip content="View Details">
                          <Button 
                            isIconOnly 
                            variant="light" 
                            className="text-default-400 cursor-pointer active:opacity-50" 
                            onPress={() => handleViewDetails(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </Tooltip>
                        
                        {/* Only show edit button if status is not Verified and user has edit permission */}
                        {item.status !== 'Verified' && hasEditPermission && (
                          <Tooltip content="Edit">
                            <Link href={`/dashboard/logBook/edit-log/${item._id}`}>
                              <Button 
                                isIconOnly 
                                variant="light" 
                                className="text-default-400 cursor-pointer active:opacity-50"
                              >
                                <FileEdit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </Tooltip>
                        )}

                        {hasDeletePermission && (
                          <Tooltip content="Delete">
                            <Button 
                              isIconOnly 
                              variant="light" 
                              className="text-danger cursor-pointer active:opacity-50"
                              onPress={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </Tooltip>
                        )}
                      </div>
                    ) : (
                      renderCell(item, column)
                    )}
                  </TableCell>
                ))}
              </TableRow>
            )}
          </TableBody>
        </Table>

        <ConfirmationDialog
          isOpen={isDeleteDialogOpen}
          onClose={() => setIsDeleteDialogOpen(false)}
          onConfirm={handleDelete}
          title="Delete Item"
          description={`Are you sure you want to delete this log entry?`}
          confirmText="Delete"
        />
      </div>

      <ViewLogBookDetails isOpen={detailModalOpen} onClose={() => setDetailModalOpen(false)} logData={selectedLog} />
    </div>
  )
}
