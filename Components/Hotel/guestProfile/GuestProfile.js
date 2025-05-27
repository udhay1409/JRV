"use client";

import GuestProfileSkeleton from "./GuestProfileSkeleton";
import React, { useState, useEffect } from "react";
import {
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaEllipsisH,
  FaCheckCircle,
  FaBed,
  FaUsers,
  FaDownload,
  FaEdit,
  FaTimes,
} from "react-icons/fa";
import "bootstrap/dist/css/bootstrap.min.css";
import { GiResize } from "react-icons/gi";
import axios from "axios";
import { toast } from "react-toastify";
import ConfirmationDialog from "../../ui/ConfirmationDialog";
import Image from "next/image";
import Link from "next/link";
import { usePagePermission } from "../../../hooks/usePagePermission";

export default function GuestProfile({ params }) {
  const hasViewPermission = usePagePermission("Bookings", "view");
  const hasEditPermission = usePagePermission("Bookings", "edit");
  const hasDeletePermission = usePagePermission("Bookings", "delete");

  const { bookingNumber } = params;
  const [isMobile, setIsMobile] = useState(false);
  const [booking, setBooking] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [totalPrice, setTotalPrice] = useState(0);
  const [confirmAction, setConfirmAction] = useState(null);
  const [dialogProps, setDialogProps] = useState({
    title: "",
    description: "",
    confirmText: "",
  });
  const [roomDetails, setRoomDetails] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  const updateBookingStatus = async (bookingNumber, newStatus) => {
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
        setBooking({ ...booking, status: newStatus });
      } else {
        toast.error(`Failed to update booking status to ${newStatus}`);
      }
    } catch (error) {
      console.error(`Error updating booking status to ${newStatus}:`, error);
      toast.error(`Error updating booking status to ${newStatus}`);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch booking and room details concurrently
        const [bookingResponse] = await Promise.all([
          axios.get(`/api/bookings/${bookingNumber}`),
        ]);

        const booking = bookingResponse.data.booking;
        setBooking(booking);
        calculateTotalPrice(booking);

        // Fetch all room details concurrently
        const roomDetailsPromises = booking.rooms.map((room) =>
          axios.get(`/api/rooms/${room._id}`)
        );

        const roomResponses = await Promise.all(roomDetailsPromises);

        const roomDetailsMap = {};
        roomResponses.forEach((response, index) => {
          if (response.data.room) {
            roomDetailsMap[booking.rooms[index]._id] = response.data.room;
          }
        });

        setRoomDetails(roomDetailsMap);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch booking details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => window.removeEventListener("resize", handleResize);
  }, [bookingNumber]);

  const calculateTotalPrice = (bookingData) => {
    if (bookingData && bookingData.rooms) {
      const total = bookingData.rooms.reduce(
        (sum, room) => sum + room.totalAmount,
        0
      );
      setTotalPrice(total);
    }
  };

  const handleDownload = async (filePath, fileName) => {
    if (!hasViewPermission) {
      toast.error("You don't have permission to download files");
      return;
    }

    try {
      const response = await axios.get(filePath, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.error("Failed to download file");
    }
  };

  const handleStatusChange = async (newStatus) => {
    // Check permissions based on action type
    if (
      (newStatus === "checkin" || newStatus === "checkout") &&
      !hasEditPermission
    ) {
      toast.error("You don't have permission to change booking status");
      return;
    }
    if (newStatus === "cancelled" && !hasDeletePermission) {
      toast.error("You don't have permission to cancel bookings");
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
    setConfirmAction(() => async () => {
      if (newStatus === "cancelled") {
        try {
          if (!bookingNumber) {
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
          if (bookingResponse?.data?.success) {
            const { rooms } = booking;

            // Clear unavailable dates for the rooms
            // Update room availability for each room in the booking
            for (const bookedRoom of rooms) {
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
            toast.success("Booking cancelled successfully");
            setBooking({ ...booking, status: newStatus });
          } else {
            toast.error("Failed to cancel booking");
          }
        } catch (error) {
          console.error("Error cancelling booking:", error);
          toast.error("Error cancelling booking");
        }
      } else {
        updateBookingStatus(bookingNumber, newStatus);
      }
    });
    setShowConfirmDialog(true);
  };

  if (!hasViewPermission) {
    return <div>You don&apos;t have permission to view booking details</div>;
  }

  if (isLoading) {
    return <GuestProfileSkeleton />;
  }

  if (!booking) {
    return <div>No booking found</div>;
  }

  // Add this helper function
  const calculateNights = (checkIn, checkOut) => {
    return Math.ceil(
      (new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24)
    );
  };

  return (
    <div className="min-h-screen p-4 font-sans">
      <div className="bookinginfoo">
        <div className="row">
          <div className="col-lg-3 col-md-3 col-sm-12">
            <div className="bg-white rounded-xl p-6 h-100 shadow-sm hover:shadow-md transition-shadow duration-300">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Guest Profile
                </h2>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      booking.status === "booked"
                        ? "bg-blue-100 text-blue-700"
                        : booking.status === "checkin"
                        ? "bg-green-100 text-green-700"
                        : booking.status === "checkout"
                        ? "bg-purple-100 text-purple-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {booking.status}
                  </span>
                </div>
              </div>

              <div className="flex flex-col items-center mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden ring-4 ring-gray-50">
                    <Image
                      src={`${
                        booking.gender === "male"
                          ? "https://i.pravatar.cc/150?u=a042581f4e29026024d"
                          : "https://i.pravatar.cc/150?u=a092581d4ef9026700d"
                      }`}
                      width={96}
                      height={96}
                      alt="Guest"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 rounded-full border-4 border-white"></span>
                </div>
                <h3 className="mt-4 text-xl font-semibold">{`${booking.firstName} ${booking.lastName}`}</h3>
                <p className="text-gray-500">{booking.bookingNumber}</p>
              </div>

              {/* Contact Information */}
              <div className="space-y-4 mb-6">
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FaPhone className="w-5 h-5 text-gray-400" />
                  <a
                    href={`tel:${booking.mobileNo}`}
                    className="ml-3 text-gray-600 hover:text-blue-600"
                  >
                    {booking.mobileNo}
                  </a>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FaEnvelope className="w-5 h-5 text-gray-400" />
                  <a
                    href={`mailto:${booking.email}`}
                    className="ml-3 text-gray-600 hover:text-blue-600"
                  >
                    {booking.email}
                  </a>
                </div>
                <div className="flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <FaMapMarkerAlt className="w-5 h-5 text-gray-400" />
                  <span className="ml-3 text-gray-600">
                    {booking.address || "Address not provided"}
                  </span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-[600] mb-2 text-hotel-primary-text">
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 gap-4 text-sm">
                  {/* Personal Details Section */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-8">
                      <div className="flex-1">
                        <p className="text-hotel-secondary-grey mb-1">
                          Date of Birth
                        </p>
                        <p className="text-hotel-primary-text font-[500] bg-gray-50 p-2 rounded">
                          {booking.dateOfBirth
                            ? new Date(booking.dateOfBirth).toLocaleDateString(
                                "en-US",
                                {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                }
                              )
                            : "Not provided"}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-hotel-secondary-grey mb-1">Gender</p>
                        <p className="text-hotel-primary-text font-[500] bg-gray-50 p-2 rounded">
                          {booking.gender || "Not specified"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-8">
                      <div className="flex-1">
                        <p className="text-hotel-secondary-grey mb-1">
                          Nationality
                        </p>
                        <p className="text-hotel-primary-text font-[500] bg-gray-50 p-2 rounded">
                          {booking.nationality || "Not specified"}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-hotel-secondary-grey mb-1">
                          {booking.verificationType || "ID Type"}
                        </p>
                        <p className="text-hotel-primary-text font-[500] bg-gray-50 p-2 rounded">
                          {booking.verificationId || "Not provided"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t pt-4 mt-4">
                <h4 className="text-hotel-primary-text font-semibold mb-2">
                  ID Proof Information
                </h4>
                <div className="flex flex-wrap gap-2">
                  {booking.uploadedFiles && booking.uploadedFiles.length > 0 ? (
                    booking.uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="border p-2 rounded flex items-center justify-between w-full"
                      >
                        <p className="text-xs">{file.fileName}</p>
                        {hasViewPermission && (
                          <FaDownload
                            className="text-gray-500 cursor-pointer"
                            onClick={() =>
                              handleDownload(file.filePath, file.fileName)
                            }
                          />
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No files uploaded</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-9 col-md-9 col-sm-12">
            <div className="bg-white rounded-lg p-6 md:col-span-2 h-100">
              <div className="mb-6">
                <div className="row">
                  <div className="col-lg-8 col-md-12 col-sm-12 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-hotel-primary-text text-xl font-semibold">
                        Booking Info
                      </h2>
                    </div>
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded inline-flex items-center mb-4">
                      <FaCheckCircle className="w-4 h-4 mr-1" />
                      {booking.status}
                    </div>

                    <h3 className="text-lg font-semibold mb-2">
                      Booking ID: {booking.bookingNumber}
                    </h3>

                    {/* Add Property Type indicator */}
                    <div className="mb-4">
                      <p className="text-sm text-hotel-secondary-grey font-[400]">
                        Property Type
                      </p>
                      <p className="text-hotel-primary-text font-medium capitalize">
                        {booking.propertyType}
                      </p>
                    </div>

                    {/* Add Hall-specific details */}
                    {booking.propertyType === "hall" && (
                      <div className="mb-6 bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-lg font-semibold mb-4">
                          Event Details
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-hotel-secondary-grey font-[400]">
                              Event Type
                            </p>
                            <p className="text-hotel-primary-text font-medium">
                              {booking.eventType || "Not specified"}
                            </p>
                          </div>

                          {booking.timeSlot && (
                            <div>
                              <p className="text-sm text-hotel-secondary-grey font-[400]">
                                Time Slot
                              </p>
                              <p className="text-hotel-primary-text font-medium">
                                {booking.timeSlot.name} (
                                {booking.timeSlot.fromTime} -{" "}
                                {booking.timeSlot.toTime})
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Bride and Groom Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                          {booking.groomDetails &&
                            Object.keys(booking.groomDetails).length > 0 && (
                              <div className="p-3 bg-white rounded shadow-sm">
                                <h5 className="font-semibold mb-3">
                                  Groom Details
                                </h5>
                                <div className="space-y-2">
                                  <p>
                                    <span className="text-gray-600">Name:</span>{" "}
                                    {booking.groomDetails.name || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Gender
                                    </span>{" "}
                                    {booking.groomDetails.gender || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Address:
                                    </span>{" "}
                                    {booking.groomDetails.address || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">DOB:</span>{" "}
                                    {booking.groomDetails.dob || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Verification ID:
                                    </span>{" "}
                                    {booking.groomDetails.verificationId ||
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            )}

                          {booking.brideDetails &&
                            Object.keys(booking.brideDetails).length > 0 && (
                              <div className="p-3 bg-white rounded shadow-sm">
                                <h5 className="font-semibold mb-3">
                                  Bride Details
                                </h5>
                                <div className="space-y-2">
                                  <p>
                                    <span className="text-gray-600">Name:</span>{" "}
                                    {booking.brideDetails.name || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Gender
                                    </span>{" "}
                                    {booking.brideDetails.gender || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Address:
                                    </span>{" "}
                                    {booking.brideDetails.address || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">DOB:</span>{" "}
                                    {booking.brideDetails.dob || "N/A"}
                                  </p>
                                  <p>
                                    <span className="text-gray-600">
                                      Verification ID:
                                    </span>{" "}
                                    {booking.brideDetails.verificationId ||
                                      "N/A"}
                                  </p>
                                </div>
                              </div>
                            )}
                        </div>

                        {/* Selected Services */}
                        {booking.selectedServices &&
                          booking.selectedServices.length > 0 && (
                            <div className="mt-4">
                              <h5 className="font-semibold mb-3">
                                Selected Services
                              </h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {booking.selectedServices.map(
                                  (service, index) => (
                                    <div
                                      key={index}
                                      className="flex justify-between p-2 bg-white rounded shadow-sm"
                                    >
                                      <span>{service.name}</span>
                                      <span>₹{service.price}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    )}

                    {/* Rest of the booking info remains the same */}
                    <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border">
                      <h4 className="text-lg font-semibold mb-4 text-hotel-primary-text">
                        Booking Timeline
                      </h4>
                      <div className="relative">
                        {booking.statusTimestamps &&
                          Object.entries(booking.statusTimestamps)
                            .filter(([_, timestamp]) => timestamp) // Filter out null timestamps
                            .sort((a, b) => new Date(a[1]) - new Date(b[1])) // Sort by timestamp
                            .map(([status, timestamp], index, array) => {
                              const isLast = index === array.length - 1;
                              const getStatusColor = (status) => {
                                switch (status) {
                                  case "booked":
                                    return "bg-blue-500";
                                  case "checkin":
                                    return "bg-green-500";
                                  case "checkout":
                                    return "bg-purple-500";
                                  case "cancelled":
                                    return "bg-red-500";
                                  default:
                                    return "bg-gray-500";
                                }
                              };

                              const getStatusIcon = (status) => {
                                switch (status) {
                                  case "booked":
                                    return "📝";
                                  case "checkin":
                                    return "🏨";
                                  case "checkout":
                                    return "🔑";
                                  case "cancelled":
                                    return "❌";
                                  default:
                                    return "⚪";
                                }
                              };

                              return (
                                <div
                                  key={status}
                                  className="flex flex-col md:flex-row items-start md:items-center mb-4 relative"
                                >
                                  {/* Timeline line */}
                                  {!isLast && (
                                    <div className="absolute left-[15px] top-[30px] w-[2px] h-[calc(100%+16px)] bg-gray-200 md:left-[19px]" />
                                  )}

                                  {/* Status dot and label */}
                                  <div className="flex items-center min-w-[150px]">
                                    <div
                                      className={`w-8 h-8 rounded-full ${getStatusColor(
                                        status
                                      )} flex items-center justify-center text-white shadow-md z-10`}
                                    >
                                      <span role="img" aria-label={status}>
                                        {getStatusIcon(status)}
                                      </span>
                                    </div>
                                    <span className="ml-3 font-medium capitalize text-hotel-primary-text">
                                      {status}
                                    </span>
                                  </div>

                                  {/* Timestamp and details */}
                                  <div className="ml-11 md:ml-6 mt-2 md:mt-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center text-sm">
                                      <span className="text-hotel-secondary-grey">
                                        {new Date(timestamp).toLocaleString(
                                          "en-US",
                                          {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          }
                                        )}
                                      </span>
                                      <span className="hidden sm:block mx-2 text-gray-400">
                                        •
                                      </span>
                                      <span className="text-hotel-secondary-grey">
                                        {new Date(timestamp).toLocaleString(
                                          "en-US",
                                          {
                                            hour: "numeric",
                                            minute: "2-digit",
                                            hour12: true,
                                          }
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Guest
                        </p>
                        <p className="text-hotel-primary-text font-medium">{`${booking.guests.adults} Adults, ${booking.guests.children} Children`}</p>
                      </div>
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Number of Rooms
                        </p>
                        <p className="text-hotel-primary-text font-medium">
                          {booking.numberOfRooms}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Check In
                        </p>
                        <p className="text-hotel-primary-text font-medium">
                          {new Date(booking.checkInDate).toLocaleString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Check Out
                        </p>
                        <p className="text-hotel-primary-text font-medium">
                          {new Date(booking.checkOutDate).toLocaleString(
                            "en-US",
                            {
                              month: "long",
                              day: "numeric",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            }
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Duration
                        </p>
                        <p className="text-hotel-primary-text font-medium">
                          {Math.ceil(
                            (new Date(booking.checkOutDate) -
                              new Date(booking.checkInDate)) /
                              (1000 * 60 * 60 * 24)
                          )}{" "}
                          Nights
                        </p>
                      </div>
                    </div>

                    <div className="gap-4 mb-4">
                      <div>
                        <p className="text-sm text-hotel-secondary-grey font-[400]">
                          Notes
                        </p>
                        <p className="text-hotel-primary-text font-medium">
                          {booking.notes || "No additional notes"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto flex gap-4 justify-content-end">
                      {hasEditPermission && (
                        <Link
                          href={`/dashboard/bookings/edit-booking/${booking.bookingNumber}`}
                        >
                          <button className="flex items-center gap-2 px-4 py-2 bg-hotel-primary text-white rounded hover:bg-hotel-primary transition">
                            <FaEdit /> Edit Booking
                          </button>
                        </Link>
                      )}

                      {hasEditPermission && booking.status === "booked" && (
                        <>
                          <button
                            onClick={() => handleStatusChange("checkin")}
                            className="flex items-center gap-2 px-4 py-2 bg-hotel-primary-darkgreen text-white rounded hover:bg-hotel-primary-darkgreen transition"
                          >
                            Check In
                          </button>
                          {hasDeletePermission && (
                            <button
                              onClick={() => handleStatusChange("cancelled")}
                              className="flex items-center gap-2 px-4 py-2 bg-hotel-primary-red text-white rounded hover:bg-hotel-primary-red transition"
                            >
                              <FaTimes /> Cancel Booking
                            </button>
                          )}
                        </>
                      )}
                      {hasEditPermission && booking.status === "checkin" && (
                        <button
                          onClick={() => handleStatusChange("checkout")}
                          className="flex items-center gap-2 px-4 py-2 bg-hotel-primary-darkred text-white rounded hover:hotel-primary-darkred transition"
                        >
                          Check Out
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="col-lg-4 col-md-12 col-sm-12">
                    <div className="bg-gray-100 rounded-lg shadow-md p-6 mt-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl  text-hotel-primary-text font-medium">
                          {booking.propertyType === "hall"
                            ? "Hall Info"
                            : "Room Info"}
                        </h2>
                        <Link href={`/dashboard/rooms`}>
                          <button className="text-blue-600 hover:underline text-sm">
                            View Detail
                          </button>
                        </Link>
                      </div>

                      <div className="bg-white rounded-lg p-2 flex mb-4">
                        <Image
                          src={
                            booking.rooms[0].mainImage ||
                            "/assets/img/rooms/rooms.png"
                          }
                          alt={`${booking.rooms[0].type} room image`}
                          width={300}
                          height={200}
                          layout="responsive"
                          objectFit="cover"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-6">
                        <div className="flex gap-2 text-justify items-center ">
                          <GiResize className="text-gray-600 " size={20} />
                          <p className="text-sm text-gray-600 mt-3">
                            {roomDetails[booking.rooms[0]._id]?.size || "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2 text-justify items-center">
                          <FaBed className="text-gray-600  " size={20} />
                          <p className="text-sm text-gray-600 mt-3">
                            {roomDetails[booking.rooms[0]._id]?.bedModel ||
                              "N/A"}
                          </p>
                        </div>
                        <div className="flex gap-2 text-justify items-center">
                          <FaUsers className="text-gray-600" size={20} />
                          <p className="text-sm text-gray-600 mt-3">
                            {roomDetails[booking.rooms[0]._id]?.maxGuests ||
                              "N/A"}{" "}
                            guests
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {booking.rooms.map((room, index) => {
                          const nights = calculateNights(
                            booking.checkInDate,
                            booking.checkOutDate
                          );
                          const basePrice = parseFloat(room.price) || 0;
                          const baseTotal = basePrice * nights;
                          const igstPercentage = parseFloat(room.igst) || 0; // This is now the direct percentage
                          const igstTotal = (baseTotal * igstPercentage) / 100; // Calculate IGST amount using percentage
                          const additionalCharge =
                            parseFloat(room.additionalGuestCharge) || 0;
                          const roomTotal =
                            room.totalAmount ||
                            baseTotal + igstTotal + additionalCharge;

                          return (
                            <div
                              key={index}
                              className="mb-4 p-3 border rounded"
                            >
                              <div className="flex justify-between font-medium">
                                <span>
                                  {room.type} (Room {room.number})
                                </span>
                                <span>₹{basePrice.toFixed(2)}/night</span>
                              </div>
                              <div className="mt-2 space-y-1 text-gray-600">
                                <div className="flex justify-between">
                                  <span>Base Price ({nights} nights)</span>
                                  <span>₹{baseTotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>IGST ({igstPercentage}%)</span>
                                  <span>₹{igstTotal.toFixed(2)}</span>
                                </div>
                                {additionalCharge > 0 && (
                                  <div className="flex justify-between text-blue-600">
                                    <span>Additional Guest Charge</span>
                                    <span>₹{additionalCharge.toFixed(2)}</span>
                                  </div>
                                )}
                                <div className="flex justify-between font-medium pt-2 border-t mt-2">
                                  <span>Room Total</span>
                                  <span>₹{roomTotal.toFixed(2)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {/* Single Consolidated Booking Summary */}
                        <div className="mt-6 p-6 bg-white rounded-xl shadow-sm border border-gray-100">
                          <h4 className="text-xl font-semibold mb-4">
                            Booking Summary
                          </h4>
                          <div className="space-y-6">
                            {/* Base Charges */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-500 mb-3">
                                Charges Breakdown
                              </h5>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">
                                    Base{" "}
                                    {booking.propertyType === "hall"
                                      ? "Hall"
                                      : "Room"}{" "}
                                    Charges
                                  </span>
                                  <span className="font-medium">
                                    ₹{booking.totalAmount.roomCharge.toFixed(2)}
                                  </span>
                                </div>

                                {booking.propertyType === "hall" &&
                                  booking.totalAmount.servicesCharge > 0 && (
                                    <div className="flex justify-between items-center text-blue-600">
                                      <span>Additional Services</span>
                                      <span>
                                        ₹
                                        {booking.totalAmount.servicesCharge.toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  )}

                                {booking.propertyType === "room" &&
                                  booking.totalAmount.additionalGuestCharge >
                                    0 && (
                                    <div className="flex justify-between items-center text-blue-600">
                                      <span>Additional Guest Charges</span>
                                      <span>
                                        ₹
                                        {booking.totalAmount.additionalGuestCharge.toFixed(
                                          2
                                        )}
                                      </span>
                                    </div>
                                  )}
                              </div>
                            </div>

                            {/* Taxes & Discounts */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <h5 className="text-sm font-medium text-gray-500 mb-3">
                                Taxes & Discounts
                              </h5>
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className="text-gray-600">IGST</span>
                                  <span>
                                    ₹{booking.totalAmount.taxes.toFixed(2)}
                                  </span>
                                </div>

                                {booking.totalAmount.discount > 0 && (
                                  <div className="flex justify-between items-center text-green-600">
                                    <span>
                                      Discount ({booking.totalAmount.discount}%)
                                    </span>
                                    <span>
                                      - ₹
                                      {booking.totalAmount.discountAmount.toFixed(
                                        2
                                      )}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Payment Information */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <div className="space-y-4">
                                <div className="flex justify-between items-center">
                                  <span className="font-semibold text-blue-900">
                                    Total Amount
                                  </span>
                                  <span className="text-2xl font-bold text-blue-900">
                                    ₹{booking.totalAmount.total.toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <p className="mt-4 text-xs text-gray-500">
                        {booking.clientRequests || "No special requests"}
                      </p>
                    </div>
                  </div>
                  {/* <div className="col-lg-12 col-md-12 col-sm-12 mt-6">
                    <div className="bg-gray-100 rounded-lg shadow-md p-6">
                      <h2 className="text-xl font-semibold mb-4">
                        Booked Rooms
                      </h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {(() => {
                          // Calculate total room capacity and distribute extra guests
                          const totalRoomCapacity = booking.rooms.reduce((sum, _, index) => {
                            const detailedRoom = roomDetails[booking.rooms[index]._id] || {};
                            return sum + (parseInt(detailedRoom.maxGuests) || 2);
                          }, 0);
                          
                          const totalGuests = booking.guests.adults + booking.guests.children;
                          const totalExtraGuests = Math.max(0, totalGuests - totalRoomCapacity);
                          
                          // Return the mapped rooms
                          return booking.rooms.map((room, index) => {
                            const detailedRoom = roomDetails[room._id] || {};
                            const nights = calculateNights(booking.checkInDate, booking.checkOutDate);
                            const basePrice = parseFloat(room.price) || 0;
                            const igstPercentage = parseFloat(room.igst) || 0;
                            const igstPerNight = (basePrice * igstPercentage / 100);
                            
                            // Calculate fair distribution of extra guests for this room
                            const maxGuests = parseInt(detailedRoom.maxGuests) || 2;
                            const roomShare = maxGuests / totalRoomCapacity;
                            const extraGuestsForThisRoom = Math.round(totalExtraGuests * roomShare);
                            const additionalGuestCost = parseFloat(detailedRoom.additionalGuestCosts) || 0;
                            const additionalChargePerNight = extraGuestsForThisRoom * additionalGuestCost;
                            
                            const perNightTotal = basePrice + igstPerNight + additionalChargePerNight;
                            const totalForAllNights = room.totalAmount;
                            
                            return (
                              <div key={index} className="bg-white rounded-lg p-4 shadow-sm">
                                <Image
                                  src={room.mainImage || "/assets/img/rooms/rooms.png"}
                                  alt={`${room.type} room image`}
                                  width={300}
                                  height={200}
                                  layout="responsive"
                                  objectFit="cover"
                                  className="rounded-lg mb-3"
                                />
                                <h3 className="text-lg font-semibold">{room.type}</h3>
                                <p className="text-sm text-gray-600">Room No: {room.number}</p>
                                
                                <div className="space-y-2 mt-3">
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>Base Price:</span>
                                    <span>₹{basePrice.toFixed(2)}/night</span>
                                  </div>
                                  <div className="flex justify-between text-sm text-gray-600">
                                    <span>IGST ({igstPercentage}%):</span>
                                    <span>₹{igstPerNight.toFixed(2)}/night</span>
                                  </div>
                                  
                                  {extraGuestsForThisRoom > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex justify-between text-sm text-blue-600">
                                        <span>Room Capacity:</span>
                                        <span>{maxGuests} guests</span>
                                      </div>
                                      <div className="flex justify-between text-sm text-blue-600">
                                        <span>Extra Guests (This Room):</span>
                                        <span>{extraGuestsForThisRoom} person(s)</span>
                                      </div>
                                      <div className="flex justify-between text-sm text-blue-600">
                                        <span>Additional Guest Rate:</span>
                                        <span>₹{additionalGuestCost.toFixed(2)}/person</span>
                                      </div>
                                      <div className="flex justify-between text-sm text-blue-600">
                                        <span>Additional Charges:</span>
                                        <span>₹{additionalChargePerNight.toFixed(2)}/night</span>
                                      </div>
                                    </div>
                                  )}
                                  
                                  <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                    <span>Per Night Total:</span>
                                    <span>₹{perNightTotal.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-sm font-medium text-gray-800">
                                    <span>Total for {nights} nights:</span>
                                    <span>₹{totalForAllNights.toFixed(2)}</span>
                                  </div>
                                  
                                  <div className="mt-3 pt-2 border-t text-xs text-gray-500">
                                    <p>Room Share of Total Capacity: {(roomShare * 100).toFixed(1)}%</p>
                                    <p>Total Guests: {totalGuests} ({booking.guests.adults} adults, {booking.guests.children} children)</p>
                                  </div>
                                </div>
                              </div>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
      <style jsx global>{`
        .timeline-dot::before {
          content: "";
          position: absolute;
          left: -33px;
          top: 50%;
          transform: translateY(-50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: currentColor;
        }

        .timeline-line::before {
          content: "";
          position: absolute;
          left: -27px;
          top: 50%;
          width: 2px;
          height: 100%;
          background-color: #e5e7eb;
        }
      `}</style>
    </div>
  );
}
