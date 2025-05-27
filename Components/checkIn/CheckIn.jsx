"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import { RiCloseLargeFill } from "react-icons/ri";
import axios from "axios";
import Link from "next/link";
import {
  FaCalendarPlus,
  FaSignInAlt,
  FaSignOutAlt,
  FaMoneyBillWave,
} from "react-icons/fa";
import { BiTrendingUp, BiTrendingDown } from "react-icons/bi";
import { PiFadersHorizontal } from "react-icons/pi";

import { toast } from "react-toastify";
import "./checkout.css";
import { usePagePermission } from "../../hooks/usePagePermission";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/dropdown";
import { Input } from "@heroui/input";
import { Chip } from "@heroui/chip";
import { User } from "@heroui/user";

import { Pagination } from "@heroui/pagination";
import { PlusIcon } from "../ui/Table/PlusIcon.jsx";
import { SearchIcon } from "../ui/Table/SearchIcon.jsx";
import { capitalize } from "../ui/Table/utils";
import ConfirmationDialog from "../ui/ConfirmationDialog";
import ReservationSkeleton from "./ReservationSkeleton.jsx";
import Invoices from "../Invoice/Invoices";
import { fr } from "date-fns/locale";

const statusColorMap = {
  booked: "warning",
  checkin: "success",
  checkout: "default",
  cancelled: "danger",
};

const INITIAL_VISIBLE_COLUMNS = [
  "guest",
  "room",
  "mobileNo",
  "duration",
  "check-in-check-out",
  "status",
  "actions",
];

export default function Reservation() {
  const hasViewPermission = usePagePermission("Bookings", "view");
  const hasEditPermission = usePagePermission("Bookings", "edit");

  const [bookings, setBookings] = useState([]);
  const [columns, setColumns] = useState([]);
  const [filterValue, setFilterValue] = useState("");
  const [selectedKeys, setSelectedKeys] = useState(new Set([]));
  const [visibleColumns, setVisibleColumns] = useState(
    new Set(INITIAL_VISIBLE_COLUMNS)
  );
  const [rowsPerPage, setRowsPerPage] = useState(4);
  const [sortDescriptor, setSortDescriptor] = useState({
    column: "checkInDate",
    direction: "ascending",
  });
  const [page, setPage] = useState(1);
  const [activeCard, setActiveCard] = useState("checkin");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    description: "",
    confirmText: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);

      const response = await axios.get(`/api/bookings`);
      if (response.data.success) {
        setBookings(response.data.bookings);
        generateColumns(response.data.bookings[0]);
      } else {
        console.error("Failed to fetch bookings");
      }
    } catch (error) {
      console.error("Error fetching bookings:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const calculateStats = () => {
    if (!bookings || bookings.length === 0) {
      return {
        newBookings: 0,
        checkIn: 0,
        checkOut: 0,
        totalRevenue: 0,
      };
    }

    const newBookings = bookings.filter((b) => b.status === "booked").length;
    const checkIn = bookings.filter((b) => b.status === "checkin").length;
    const checkOut = bookings.filter((b) => b.status === "checkout").length;
    const totalRevenue = bookings
      .filter((b) => b.status === "checkout")
      .reduce((sum, b) => sum + (b.totalAmount?.total || 0), 0);

    return { newBookings, checkIn, checkOut, totalRevenue };
  };

  const stats = calculateStats();

  const generateColumns = (sampleBooking) => {
    if (!sampleBooking) {
      setColumns([]);
      return;
    }

    const newColumns = [
      {
        key: "guest",
        name: "Guest",
        uid: "guest",
        sortable: true,
      },
      {
        key: "room",
        name: "Room Category",
        uid: "room",
        sortable: true,
      },
      {
        key: "mobileNo",
        name: "Mobile No",
        uid: "mobileNo",
        sortable: true,
      },
      {
        key: "duration",
        name: "Duration",
        uid: "duration",
        sortable: true,
      },
      {
        key: "check-in-check-out",
        name: "Check-In & Check-Out",
        uid: "check-in-check-out",
        sortable: true,
      },
      {
        key: "clientRequests",
        name: "Client Requests",
        uid: "clientRequests",
        sortable: true,
      },
      {
        key: "status",
        name: "Status",
        uid: "status",
        sortable: true,
      },
      {
        key: "actions",
        name: "Actions",
        uid: "actions",
      },
    ];

    setColumns(newColumns);
  };

  const updateBookingStatus = useCallback(
    async (bookingNumber, newStatus) => {
      try {
        const response = await axios.put(
          `/api/bookings/${bookingNumber}`,
          { status: newStatus },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );
        if (response.data.success) {
          toast.success(`Booking ${newStatus} successfully`);
          fetchBookings();
        } else {
          toast.error(`Failed to update booking status to ${newStatus}`);
        }
      } catch (error) {
        console.error(`Error updating booking status to ${newStatus}:`, error);
        toast.error(`Error updating booking status to ${newStatus}`);
      }
    },
    [fetchBookings]
  );

  const cancelledBooking = useCallback(
    async (bookingNumber) => {
      try {
        const bookingToCancel = bookings.find(
          (b) => b.bookingNumber === bookingNumber
        );
        if (!bookingToCancel) {
          toast.error("Booking not found");
          return;
        }

        // Update booking status to cancelled
        const bookingResponse = await axios.put(
          `/api/bookings/${bookingNumber}`,
          { status: "cancelled" },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (bookingResponse.data.success) {
          // Update room availability for each room in the booking
          for (const bookedRoom of bookingToCancel.rooms) {
            await axios.put(
              `/api/rooms/${bookedRoom._id}`,
              {
                roomNumber: bookedRoom.number,
                action: "clear",
                bookingNumber: bookingNumber,
              },
              {
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                },
              }
            );
          }

          toast.success("Booking cancelled and room availability updated");
          fetchBookings(); // Refresh the bookings list
        } else {
          toast.error("Failed to cancel booking");
        }
      } catch (error) {
        console.error("Error cancelling booking:", error);
        toast.error("Error cancelling booking");
      }
    },
    [bookings, fetchBookings]
  );

  const handleStatusChange = useCallback(
    (bookingNumber, newStatus) => {
      if (!hasEditPermission) {
        toast.error("You don't have permission to perform this action");
        return;
      }

      let title, description, confirmText;
      switch (newStatus) {
        case "checkin":
          title = "Confirm Check-In";
          description = "Are you sure you want to check in this guest?";
          confirmText = "Check In";
          break;
        case "checkout":
          title = "Confirm Check-Out";
          description = "Are you sure you want to check out this guest?";
          confirmText = "Check Out";
          break;
        case "cancelled":
          title = "Confirm Cancellation";
          description = "Are you sure you want to cancel this booking?";
          confirmText = "Cancel Booking";
          break;
      }
      setDialogProps({ title, description, confirmText });
      setConfirmAction(() => () => {
        if (newStatus === "cancelled") {
          cancelledBooking(bookingNumber);
        } else {
          updateBookingStatus(bookingNumber, newStatus);
        }
      });
      setShowConfirmDialog(true);
    },
    [cancelledBooking, updateBookingStatus, hasEditPermission]
  );

  const checkInBooking = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "checkin"),
    [handleStatusChange]
  );
  const checkOutBooking = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "checkout"),
    [handleStatusChange]
  );
  const cancelBookingWithConfirmation = useCallback(
    (bookingNumber) => handleStatusChange(bookingNumber, "cancelled"),
    [handleStatusChange]
  );

  const hasSearchFilter = Boolean(filterValue);

  const headerColumns = useMemo(() => {
    if (visibleColumns === "all") return columns;

    return columns.filter((column) =>
      Array.from(visibleColumns).includes(column.uid)
    );
  }, [visibleColumns, columns]);

  const filteredItems = useMemo(() => {
    let filteredBookings = [...bookings];

    if (hasSearchFilter) {
      filteredBookings = filteredBookings.filter((booking) =>
        `${booking.firstName} ${booking.lastName}`
          .toLowerCase()
          .includes(filterValue.toLowerCase())
      );
    }

    // Filter based on the active card
    if (activeCard === "checkin") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status === "checkin"
      );
    } else if (activeCard === "checkout") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status === "checkout"
      );
    } else if (activeCard === "newBookings") {
      filteredBookings = filteredBookings.filter(
        (booking) => booking.status === "booked"
      );
    }

    return filteredBookings;
  }, [bookings, filterValue, activeCard, hasSearchFilter]);

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
      const cmp = first < second ? -1 : first > second ? 1 : 0;

      return sortDescriptor.direction === "descending" ? -cmp : cmp;
    });
  }, [sortDescriptor, items]);

  const renderCell = useCallback(
    (booking, columnKey) => {
      const cellValue = booking[columnKey];

      switch (columnKey) {
        case "guest":
          return (
            <User
              avatarProps={{
                radius: "lg",
                src: `${
                  booking.gender === "male"
                    ? "https://i.pravatar.cc/150?u=a042581f4e29026024d"
                    : "https://i.pravatar.cc/150?u=a092581d4ef9026700d"
                }`,
              }}
              description={booking.bookingNumber}
              name={`${booking.firstName} ${booking.lastName}`}
            >
              {booking.email}
            </User>
          );
        case "room":
          return booking.rooms && booking.rooms[0]
            ? booking.rooms[0].type
            : "N/A";
        case "request":
          return booking.mobileNo || "N/A";
        case "duration":
          const checkIn = new Date(booking.checkInDate);
          const checkOut = new Date(booking.checkOutDate);
          const duration = Math.ceil(
            (checkOut - checkIn) / (1000 * 60 * 60 * 24)
          );
          return `${duration} ${duration === 1 ? "day" : "days"}`;
        case "check-in-check-out":
          return (
            <div className="flex flex-row justify-start">
              <div className="flex justify-evenly">
                <span>
                  {new Date(booking.checkInDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="mx-2"> - </span>
                <span>
                  {new Date(booking.checkOutDate).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        case "status":
          return (
            <Chip
              className="capitalize"
              color={statusColorMap[booking.status] || "default"}
              size="sm"
              variant="flat"
            >
              {booking.status || "N/A"}
            </Chip>
          );
        case "actions":
          return (
            <div className="relative flex justify-center items-center gap-2">
              {hasViewPermission && (
                <Link href={`/dashboard/bookings/${booking.bookingNumber}`}>
                  <Button
                    variant="flat"
                    className="min-w-15 bg-hotel-primary text-white"
                  >
                    View
                  </Button>
                </Link>
              )}
              {hasEditPermission && booking.status === "booked" && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary-darkgreen text-white"
                  onClick={() => checkInBooking(booking.bookingNumber)}
                >
                  Check In
                </Button>
              )}
              {hasEditPermission && booking.status === "checkin" && (
                <Button
                  variant="flat"
                  className="min-w-15 bg-hotel-primary-darkred text-white"
                  onClick={() => checkOutBooking(booking.bookingNumber)}
                >
                  Check Out
                </Button>
              )}
              {hasEditPermission && booking.status === "booked" && (
                <Button
                  variant="flat"
                  className="min-w-10 bg-hotel-primary-red text-white"
                  isIconOnly
                  aria-label="delete"
                  onClick={() =>
                    cancelBookingWithConfirmation(booking.bookingNumber)
                  }
                >
                  <RiCloseLargeFill />
                </Button>
              )}
              {booking.status === "checkin" && (
                <Button
                  variant="flat"
                  className="min-w-10 bg-gray-300 text-white"
                  isIconOnly
                  aria-label="delete"
                  disabled
                >
                  <RiCloseLargeFill />
                </Button>
              )}
              {booking.status === "checkout" && (
                <Button
                  variant="flat"
                  className="min-w-10 bg-gray-300 text-white"
                  isIconOnly
                  aria-label="delete"
                  disabled
                >
                  <RiCloseLargeFill />
                </Button>
              )}
            </div>
          );
        default:
          return cellValue;
      }
    },
    [
      checkInBooking,
      checkOutBooking,
      cancelBookingWithConfirmation,
      hasViewPermission,
      hasEditPermission,
    ]
  );

  const onRowsPerPageChange = useCallback((e) => {
    setRowsPerPage(Number(e.target.value));
    setPage(1);
  }, []);

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

  const topContent = useMemo(() => {
    return (
      <>
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 databoxmain">
            <div
              className={`p-4 rounded-lg shadow ${
                activeCard === "newBookings"
                  ? "bg-hotel-primary text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveCard("newBookings")}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium">New Bookings</span>
                <div
                  className={`${
                    activeCard === "newBookings"
                      ? "databoxfront"
                      : "databoxback"
                  }`}
                >
                  <FaCalendarPlus
                    className={`h-4 w-4 ${
                      activeCard === "newBookings"
                        ? "fill-hotel-primary"
                        : "text-white"
                    }`}
                  />
                </div>
              </div>
              <div className="py-2">
                <div className="text-2xl font-bold">
                  {stats.newBookings || 0}
                </div>
                {/* <div className="mt-4">
                  <p className="text-xs text-white">
                    <span className="rateincrease">
                      <BiTrendingUp className="inline text-green-500" /> +8.70%
                    </span>{" "}
                    from last week
                  </p>
                </div> */}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                activeCard === "checkin"
                  ? "bg-hotel-primary text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveCard("checkin")}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium">Check-In</span>
                <div
                  className={`${
                    activeCard === "checkin" ? "databoxfront" : "databoxback"
                  }`}
                >
                  <FaSignInAlt
                    className={`h-4 w-4 ${
                      activeCard === "checkin"
                        ? "fill-hotel-primary"
                        : "text-white"
                    }`}
                  />
                </div>
              </div>
              <div className="py-2">
                <div className="text-2xl font-bold">{stats.checkIn || 0}</div>
                {/* <div className="mt-4">
                  <p className="text-xs text-white">
                    <span className="rateincrease">
                      <BiTrendingUp className="inline text-green-500" /> +3.56%
                    </span>{" "}
                    from last week
                  </p>
                </div> */}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                activeCard === "checkout"
                  ? "bg-hotel-primary text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveCard("checkout")}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium">Check-Out</span>
                <div
                  className={`${
                    activeCard === "checkout" ? "databoxfront" : "databoxback"
                  }`}
                >
                  <FaSignOutAlt
                    className={`h-4 w-4 ${
                      activeCard === "checkout"
                        ? "fill-hotel-primary"
                        : "text-white"
                    }`}
                  />
                </div>
              </div>
              <div className="py-2">
                <div className="text-2xl font-bold">{stats.checkOut || 0}</div>
                {/* <div className="mt-4">
                  <p className="text-xs text-white">
                    <span className="ratedecrease">
                      <BiTrendingDown className="inline text-red-500" /> -1.06%
                    </span>{" "}
                    from last week
                  </p>
                </div> */}
              </div>
            </div>

            <div
              className={`p-4 rounded-lg shadow ${
                activeCard === "invoices"
                  ? "bg-hotel-primary text-white"
                  : "bg-white"
              }`}
              onClick={() => setActiveCard("invoices")}
            >
              <div className="flex flex-row items-center justify-between pb-2">
                <span className="text-sm font-medium">Total Revenue</span>
                <div
                  className={`${
                    activeCard === "invoices" ? "databoxfront" : "databoxback"
                  }`}
                >
                  <FaMoneyBillWave
                    className={`h-4 w-4 ${
                      activeCard === "invoices"
                        ? "fill-hotel-primary"
                        : "text-white"
                    }`}
                  />
                </div>
              </div>
              <div className="py-2">
                <div className="text-2xl font-bold">
                  ₹ {stats.totalRevenue || 0}
                </div>
              </div>
            </div>
          </div>
        </section>

        {activeCard !== "invoices" && (
          <div className="flex flex-col gap-4">
            <div className="flex justify-between gap-2 items-end">
              <h2>{capitalize(activeCard)}</h2>
              <div className="flex gap-3">
                <Input
                  isClearable
                  classNames={{
                    base: "w-full sm:max-w-[44%] date-btn",
                    inputWrapper: "bg-hotel-secondary ",
                    input: "text-hotel-primary-text",
                  }}
                  placeholder="Search guest, status, etc"
                  startContent={<SearchIcon />}
                  value={filterValue}
                  onClear={() => onClear()}
                  onValueChange={onSearchChange}
                />
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

                {hasEditPermission && (
                  <Link href={`/dashboard/bookings/add-booking`}>
                    <Button
                      className="min-w-44 bg-hotel-primary-yellow text-hotel-primary-text"
                      endContent={<PlusIcon />}
                    >
                      Add Booking
                    </Button>
                  </Link>
                )}
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-default-400 text-small">
                Total {filteredItems.length} bookings
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
        )}
      </>
    );
  }, [
    filterValue,
    visibleColumns,
    onRowsPerPageChange,
    filteredItems.length,
    onSearchChange,
    columns,
    activeCard,
    onClear,
    rowsPerPage,
    stats.checkIn,
    stats.checkOut,
    stats.newBookings,
    stats.totalRevenue,
    hasEditPermission,
  ]);

  const bottomContent = useMemo(() => {
    return (
      <div className="py-2 px-2 flex justify-between items-center">
        <span className="w-[30%] text-small text-default-400">
          {selectedKeys === "all"
            ? "All items selected"
            : `${selectedKeys.size} of ${filteredItems.length} selected`}
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
              className="custom-pagination gap-0 m-0"
            />
          </div>
        </div>
      </div>
    );
  }, [selectedKeys, filteredItems.length, page, pages]);

  if (!hasViewPermission) {
    return (
      <div className="p-4 text-center">
        You don&apos;t have permission to view bookings
      </div>
    );
  }

  if (isLoading) {
    return <ReservationSkeleton />;
  }

  // Remove the early return for no bookings and show UI with empty state
  return (
    <>
      {/* Always show the data boxes */}
      {topContent}

      {/* Show message if no bookings */}
      {activeCard === "invoices" ? (
        <Invoices />
      ) : (
        <>
          {!bookings || bookings.length === 0 ? (
            <div className="p-4 text-center">
              No bookings found. Please add some bookings to get started.
            </div>
          ) : (
            <Table
              aria-label="Example table with custom cells, pagination and sorting"
              isHeaderSticky
              bottomContent={bottomContent}
              bottomContentPlacement="inside"
              classNames={{
                wrapper: "",
              }}
              sortDescriptor={sortDescriptor}
              topContent={null} // Remove topContent here since we're showing it above
              topContentPlacement="inside"
              onSelectionChange={setSelectedKeys}
              onSortChange={setSortDescriptor}
            >
              <TableHeader columns={headerColumns}>
                {(column) => (
                  <TableColumn
                    key={column.uid}
                    align={column.uid === "actions" ? "center" : "start"}
                    allowsSorting={column.sortable}
                  >
                    {column.name}
                  </TableColumn>
                )}
              </TableHeader>
              <TableBody items={sortedItems}>
                {(item) => (
                  <TableRow key={item._id}>
                    {(columnKey) => (
                      <TableCell>{renderCell(item, columnKey)}</TableCell>
                    )}
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </>
      )}
      <ConfirmationDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={() => {
          confirmAction();
          setShowConfirmDialog(false);
        }}
        title={dialogProps.title}
        description={dialogProps.description}
        confirmText={dialogProps.confirmText}
      />
    </>
  );
}
