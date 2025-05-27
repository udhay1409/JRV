"use client";

import React, { useRef, useState } from "react";
import Image from "next/image";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import "./print.css";
import { format, differenceInDays } from "date-fns";

const PaidStamp = () => (
  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rotate-[-30deg] z-10">
    <div className="relative">
      <div className="border-[4px] border-emerald-500 rounded-2xl px-10 py-6 backdrop-blur-sm">
        <div
          className="text-emerald-500 text-6xl font-black tracking-wider flex items-center gap-2"
          style={{ fontFamily: "Inter, sans-serif" }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
          PAID
        </div>
      </div>
      <div className="absolute inset-0 bg-emerald-500 opacity-5 rounded-2xl blur-sm"></div>
    </div>
  </div>
);

const InvoiceContent = React.forwardRef(({ ...props }, ref) => {
  // Calculate daily rates and totals for each room
  const calculateDailyRates = (room, checkIn, checkOut, roomSettings) => {
    const dates = [];
    const currentDate = new Date(checkIn);
    const endDate = new Date(checkOut);

    while (currentDate < endDate) {
      const baseRate = Number.parseFloat(room.ratePerNight) || 0;

      // Find any special offering that applies to this date
      const applicableOffering = roomSettings?.specialOfferings?.find(
        (offering) =>
          offering.propertyType === "room" &&
          new Date(offering.startDate) <= currentDate &&
          new Date(offering.endDate) >= currentDate
      );

      // Calculate rate with special offering discount
      const priceMultiplier = applicableOffering
        ? 1 - (applicableOffering.discountPercentage || 0) / 100
        : 1;
      const dailyRate = baseRate * priceMultiplier;

      dates.push({
        date: new Date(currentDate),
        originalRate: baseRate,
        baseRate: dailyRate,
        discountAmount: applicableOffering ? baseRate - dailyRate : 0,
        specialOffering: applicableOffering
          ? {
              name: applicableOffering.name,
              discountPercentage: applicableOffering.discountPercentage,
              dates: {
                start: applicableOffering.startDate,
                end: applicableOffering.endDate,
              },
            }
          : null,
        additionalCharge: Number.parseFloat(room.additionalGuestCharge) || 0,
        taxes: {
          cgst: dailyRate * (Number.parseFloat(room.taxes?.cgst || 0) / 100),
          sgst: dailyRate * (Number.parseFloat(room.taxes?.sgst || 0) / 100),
          igst: dailyRate * (Number.parseFloat(room.taxes?.igst || 0) / 100),
        },
        total: dailyRate + (Number.parseFloat(room.additionalGuestCharge) || 0),
      });

      currentDate.setDate(currentDate.getDate() + 1);
    }
    return dates;
  };

  // Transform rooms data for the invoice table
  const invoiceItems = props.rooms?.map((room) => {
    const dailyRates = calculateDailyRates(
      room,
      props.stayDetails?.checkIn,
      props.stayDetails?.checkOut,
      props.roomSettings
    );

    const subtotal = dailyRates.reduce((sum, day) => sum + day.originalRate, 0);
    const totalDiscounts = dailyRates.reduce(
      (sum, day) => sum + (day.discountAmount || 0),
      0
    );
    const totalAfterDiscount = dailyRates.reduce(
      (sum, day) => sum + day.baseRate,
      0
    );
    const totalTaxes = dailyRates.reduce(
      (sum, day) => sum + day.taxes.cgst + day.taxes.sgst + day.taxes.igst,
      0
    );

    return {
      description: `${room.roomType} - Room ${room.roomNumber}`,
      dailyRates,
      subtotal,
      totalDiscounts,
      discountedSubtotal: totalAfterDiscount,
      additionalGuestCharge: Number.parseFloat(room.additionalGuestCharge) || 0,
      taxes: totalTaxes,
      total:
        totalAfterDiscount +
        (Number.parseFloat(room.additionalGuestCharge) || 0) +
        totalTaxes,
    };
  });

  const RoomDetails = () => (
    <div className="mb-6 lg:mb-10 bg-white rounded-xl shadow-sm overflow-hidden">
      {" "}
      <h2
        className="text-lg lg:text-xl font-semibold p-4 lg:p-6 border-b border-gray-100"
        style={{ color: "var(--invoice-color)" }}
      >
        Room Details
      </h2>
      <div className="p-4 lg:p-6 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500 mb-1">Check In</p>
            <p className="font-semibold text-gray-800 text-sm lg:text-base break-words">
              {props.stayDetails?.checkIn
                ? format(new Date(props.stayDetails.checkIn), "PPpp")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Check Out</p>
            <p className="font-semibold text-gray-800 text-sm lg:text-base break-words">
              {props.stayDetails?.checkOut
                ? format(new Date(props.stayDetails.checkOut), "PPpp")
                : "N/A"}
            </p>
          </div>
          <div>
            {" "}
            <p className="text-sm text-gray-500 mb-1">Number of Nights</p>
            <p className="font-semibold text-gray-800">
              {props.stayDetails?.checkIn && props.stayDetails?.checkOut
                ? differenceInDays(
                    new Date(props.stayDetails.checkOut),
                    new Date(props.stayDetails.checkIn)
                  )
                : 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Number of Rooms</p>
            <p className="font-semibold text-gray-800">
              {props.stayDetails?.numberOfRooms || 0}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Number of Guests</p>
            <p className="font-semibold text-gray-800">
              Adults: {props.stayDetails?.numberOfGuests?.adults || 0},
              Children: {props.stayDetails?.numberOfGuests?.children || 0}
            </p>
          </div>
        </div>
      </div>
      {props.rooms && props.rooms.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Room Number
                </th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Room Type
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Original Rate
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Special Offer
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Rate/Night
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Additional Charges
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {props.rooms.map((room, index) => {
                const dailyRates = calculateDailyRates(
                  room,
                  props.stayDetails?.checkIn,
                  props.stayDetails?.checkOut,
                  props.roomSettings
                );

                // Get offer info for first day (assuming same offer applies throughout stay)
                const firstDay = dailyRates[0];
                const hasOffer = firstDay?.specialOffering !== null;

                return (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-3 px-4">{room.roomNumber}</td>
                    <td className="py-3 px-4">{room.roomType}</td>
                    <td
                      className={`py-3 px-4 text-right ${
                        hasOffer ? "text-gray-400 line-through" : ""
                      }`}
                    >
                      ₹{firstDay?.originalRate?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {hasOffer ? (
                        <div>
                          <span className="text-green-600 font-medium">
                            {firstDay.specialOffering.name}
                          </span>
                          <br />
                          <span className="text-sm text-green-600">
                            {firstDay.specialOffering.discountPercentage}% off
                          </span>
                        </div>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ₹{firstDay?.baseRate?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      ₹{room.additionalGuestCharge?.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-right font-semibold">
                      ₹
                      {(
                        firstDay?.baseRate + (room.additionalGuestCharge || 0)
                      )?.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const HallDetails = () => (
    <div className="mb-6 lg:mb-10 bg-white rounded-xl shadow-sm overflow-hidden">
      {" "}
      <h2
        className="text-lg lg:text-xl font-semibold p-4 lg:p-6 border-b border-gray-100"
        style={{ color: "var(--invoice-color)" }}
      >
        Hall Details
      </h2>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6">
          <div>
            <p className="text-sm text-gray-500 mb-1">Event Type</p>
            <p className="font-semibold text-gray-800">
              {props.hallDetails?.eventType || "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Check In</p>
            <p className="font-semibold text-gray-800">
              {props.stayDetails?.checkIn
                ? format(new Date(props.stayDetails.checkIn), "PPpp")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">Check Out</p>
            <p className="font-semibold text-gray-800">
              {props.stayDetails?.checkOut
                ? format(new Date(props.stayDetails.checkOut), "PPpp")
                : "N/A"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500 mb-1">No of Halls</p>
            <p className="font-semibold text-gray-800">
              {props.stayDetails?.numberOfHalls ||
                props.stayDetails?.numberOfRooms ||
                "N/A"}
            </p>
          </div>
        </div>

        {props.hallDetails?.timeSlot && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-lg font-semibold mb-4 text-gray-800">
              Time Slot
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Name</p>
                <p className="font-semibold text-gray-800">
                  {props.hallDetails.timeSlot.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">From</p>
                <p className="font-semibold text-gray-800">
                  {props.hallDetails.timeSlot.fromTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">To</p>
                <p className="font-semibold text-gray-800">
                  {props.hallDetails.timeSlot.toTime}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const ServiceDetails = () =>
    props.selectedServices?.length > 0 && (
      <div className="mb-10 bg-white rounded-xl shadow-sm overflow-hidden">
        <h2
          className="text-xl font-semibold p-6 border-b border-gray-100"
          style={{ color: "var(--invoice-color)" }}
        >
          Additional Services
        </h2>
        <div className="p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Service
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Price
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Quantity
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {props.selectedServices.map((service, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="py-3 px-4">{service.name}</td>
                  <td className="py-3 px-4 text-right">
                    ₹{service.price?.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">{service.quantity}</td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ₹{service.totalAmount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );

  const PaymentTransactions = () =>
    props.transactions?.payments?.length > 0 && (
      <div className="mb-10 bg-white rounded-xl shadow-sm overflow-hidden">
        <h2
          className="text-xl font-semibold p-6 border-b border-gray-100"
          style={{ color: "var(--invoice-color)" }}
        >
          Payment History
        </h2>
        <div className="p-6">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Date
                </th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Method
                </th>
                <th className="py-3 px-4 text-left text-gray-600 font-semibold">
                  Status
                </th>
                <th className="py-3 px-4 text-right text-gray-600 font-semibold">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {props.transactions.payments.map((payment, index) => (
                <tr key={index} className="border-t border-gray-100">
                  <td className="py-3 px-4">
                    {payment.paymentDate
                      ? format(new Date(payment.paymentDate), "PP")
                      : "N/A"}
                  </td>
                  <td className="py-3 px-4">{payment.paymentMethod}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        payment.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : payment.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {payment.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-semibold">
                    ₹{payment.amount?.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex justify-end">
            <div className="text-right">
              <p className="text-sm text-gray-500">Total Paid</p>
              <p
                className="text-lg font-bold"
                style={{ color: "var(--invoice-color)" }}
              >
                ₹{props.transactions.totalPaid?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </div>
    );

  const getColorWithOpacity = (opacity) => {
    const color = props.style?.color || "#4F46E5";
    if (color.startsWith("#")) {
      const r = parseInt(color.slice(1, 3), 16);
      const g = parseInt(color.slice(3, 5), 16);
      const b = parseInt(color.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return color;
  };

  const SavingsSummary = () => {
    const totalOriginal =
      invoiceItems?.reduce((sum, item) => sum + item.subtotal, 0) || 0;
    const totalAfterDiscounts =
      invoiceItems?.reduce((sum, item) => sum + item.discountedSubtotal, 0) ||
      0;
    const totalSavings = totalOriginal - totalAfterDiscounts;
    const savingsPercentage = ((totalSavings / totalOriginal) * 100).toFixed(1);

    if (totalSavings <= 0) return null;

    return (
      <div className="mb-6 bg-green-50 rounded-xl p-4 border border-green-200">
        <h3 className="text-lg font-semibold text-green-700 mb-2">
          Your Savings Summary
        </h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-green-600">
            <span>Original Price:</span>
            <span className="line-through">₹{totalOriginal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-green-700">
            <span>Price After Special Offers:</span>
            <span className="font-medium">
              ₹{totalAfterDiscounts.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-center text-green-800 font-semibold border-t border-green-200 pt-2 mt-2">
            <span>Total Savings ({savingsPercentage}%):</span>
            <span>₹{totalSavings.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-4 text-sm text-green-600">
          <p className="font-medium mb-1">Applied Special Offers:</p>
          <ul className="list-disc list-inside space-y-1">
            {invoiceItems
              ?.map((item, index) => {
                const firstDay = item.dailyRates[0];
                if (firstDay?.specialOffering) {
                  return (
                    <li key={index}>
                      {firstDay.specialOffering.name} -{" "}
                      {firstDay.specialOffering.discountPercentage}% off
                      <span className="text-green-500 ml-2">
                        (saved ₹{item.totalDiscounts.toFixed(2)})
                      </span>
                    </li>
                  );
                }
                return null;
              })
              .filter(Boolean)}
          </ul>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={ref}
      id="invoice-content"
      className="bg-gradient-to-br from-white to-gray-50 shadow-2xl rounded-2xl overflow-hidden print:bg-white print:shadow-none print:m-0 print:p-0 relative w-full max-w-[100vw] print:max-w-full mx-auto print:break-inside-avoid print:break-after-auto"
      style={{
        "--invoice-color": props.style?.color || "#4F46E5",
        "--invoice-color-light": getColorWithOpacity(0.6),
        "--invoice-color-hover": getColorWithOpacity(0.8),
        minHeight: "fit-content",
        WebkitPrintColorAdjust: "exact",
        printColorAdjust: "exact",
      }}
    >
      {props.paymentDetails?.status === "completed" && <PaidStamp />}

      <div className="p-4 md:p-8 print:p-2 print:text-sm">
        {/* Invoice Header */}
        <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-4 mb-6 md:mb-8 border-b border-gray-200 pb-6">
          <div className="text-center sm:text-left">
            <h1
              className="text-2xl md:text-4xl font-bold mb-2"
              style={{
                color: "var(--invoice-color)",
                WebkitPrintColorAdjust: "exact",
                printColorAdjust: "exact",
              }}
            >
              Invoice
            </h1>
            <p className="text-sm text-gray-500">
              {format(props.createdAt, "MMMM dd, yyyy")}
            </p>
          </div>
          <div className="w-32 md:w-40 h-16 md:h-20 print:w-24 print:h-12 flex items-center justify-center bg-white rounded-lg shadow-sm p-4 print:shadow-none">
            {props.style?.logo?.url ? (
              <Image
                src={props.style.logo.url || "/placeholder.svg"}
                alt="Company Logo"
                width={160}
                height={80}
                objectFit="contain"
                className="w-full h-full print:w-24 print:h-12"
              />
            ) : (
              <div
                className="text-2xl md:text-3xl font-bold print:text-xl"
                style={{ color: "var(--invoice-color)" }}
              >
                JRV
              </div>
            )}
          </div>
        </div>

        {/* Invoice Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print:gap-2 mb-6">
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Invoice No.</p>
                <p className="font-semibold text-gray-800">
                  {props.invoiceNumber || "INV32458"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Booking ID</p>
                <p className="font-semibold text-gray-800">
                  {props.bookingNumber || "BO-05213"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Customer ID</p>
                <p className="font-semibold text-gray-800">
                  {props.customerDetails?.guestId || "CUS23461"}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Date</p>
                <p className="font-semibold text-gray-800">
                  {props.createdAt
                    ? format(new Date(props.createdAt), "MMMM dd, yyyy")
                    : "April 28, 2025"}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-1">Remarks</p>
                <p className="font-semibold text-gray-800">
                  {props.transactions?.isFullyPaid &&
                    "Full Payment is Completed"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bride and Groom Details */}
        {props.stayDetails?.propertyType === "hall" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-8 mb-6 lg:mb-10">
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
              <h2
                className="text-lg lg:text-xl font-semibold mb-6"
                style={{ color: "var(--invoice-color)" }}
              >
                Groom Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.groomDetails?.name || "Anand M"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">DOB</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.groomDetails?.dob || "June 15, 1997"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gender</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.groomDetails?.gender || "Male"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Address</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.groomDetails?.address ||
                      "55 St.Peters, Velachery 600087"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Verification Id</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.groomDetails?.verificationId ||
                      "2234543429"}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 lg:p-6 shadow-sm">
              <h2
                className="text-lg lg:text-xl font-semibold mb-6"
                style={{ color: "var(--invoice-color)" }}
              >
                Bride Details
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Name</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.brideDetails?.name ||
                      "Priyardarshini R"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">DOB</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.brideDetails?.dob || "June 15, 2000"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Gender</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.brideDetails?.gender || "Female"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Full Address</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.brideDetails?.address ||
                      "123 Main Street, Velachery 600087"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Verification Id</p>
                  <p className="font-semibold text-gray-800">
                    {props.hallDetails?.brideDetails?.verificationId ||
                      "2234512367"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Room or Hall Details */}
        {props.stayDetails?.propertyType === "hall" ? (
          <>
            <div className="print:break-inside-avoid">
              <HallDetails />
            </div>
          </>
        ) : (
          <div className="print:break-inside-avoid">
            <RoomDetails />
          </div>
        )}

        {/* Savings Summary */}
        <div className="print:break-inside-avoid">
          <SavingsSummary />
        </div>

        {/* Additional Services */}
        <div className="print:break-inside-avoid">
          <ServiceDetails />
        </div>

        {/* Property Details Table */}
        <div className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden print:shadow-none print:break-inside-avoid">
          <div className="overflow-x-auto print:overflow-visible">
            <table className="w-full border-collapse min-w-[600px] print:min-w-full">
              <thead>
                <tr
                  style={{
                    background: " var(--invoice-color)",
                  }}
                >
                  <th className="py-4 px-6 text-left text-white font-semibold">
                    Property Type
                  </th>
                  <th className="py-4 px-6 text-left text-white font-semibold">
                    Event
                  </th>
                  <th className="py-4 px-6 text-right text-white font-semibold">
                    Price
                  </th>
                  <th className="py-4 px-6 text-right text-white font-semibold">
                    GST
                  </th>
                  <th className="py-4 px-6 text-right text-white font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    {props.stayDetails?.propertyType === "hall"
                      ? "Hall"
                      : "Room"}
                  </td>
                  <td className="py-4 px-6">
                    {props.hallDetails?.eventType || "Wedding"}
                  </td>
                  <td className="py-4 px-6 text-right">
                    ₹{(props.amounts?.subtotal || 65000).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    ₹{(props.amounts?.totalTax || 11700).toFixed(2)}
                  </td>
                  <td className="py-4 px-6 text-right font-semibold">
                    ₹{(props.amounts?.totalAmount || 76700).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="flex flex-col sm:flex-row sm:justify-end mb-6 print:break-inside-avoid">
          <div className="w-full sm:w-1/2 bg-white rounded-xl p-4 shadow-sm print:shadow-none">
            <div className="space-y-4">
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Sub Total</span>
                <span className="text-gray-800 font-semibold">
                  ₹{(props.amounts?.subtotal || 65000).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">GST </span>
                <span className="text-gray-800 font-semibold">
                  ₹{(props.amounts?.totalTax || 11700).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-600">Discount</span>
                <span className="text-gray-800 font-semibold">
                  ₹{(props.amounts?.discountAmount || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between py-3 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-800">
                  Total(₹)
                </span>
                <span
                  className="text-lg font-bold"
                  style={{ color: "var(--invoice-color)" }}
                >
                  ₹{(props.amounts?.totalAmount || 76700).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Transactions */}
        <div className="print:break-inside-avoid">
          <PaymentTransactions />
        </div>

        {/* Payment Details */}

        {/* Computer Generated Invoice */}
        <div className="text-center text-sm text-gray-500 mt-6 italic print:mt-4 print:text-xs">
          This is a computer generated invoice
        </div>
      </div>
    </div>
  );
});

InvoiceContent.displayName = "InvoiceContent";

export default function Invoice(props) {
  const invoiceRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const invoiceColor = props.style?.color || "#4F46E5";
  const buttonStyles = {
    backgroundColor: invoiceColor,
    transition: "all 0.2s",
  };
  const buttonHoverStyles = {
    backgroundColor: invoiceColor,
    filter: "brightness(0.9)",
  };

  const generatePDF = async () => {
    if (!invoiceRef.current || isGenerating) return;

    try {
      setIsGenerating(true);
      const element = invoiceRef.current;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        width: element.offsetWidth,
        height: element.offsetHeight,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const content = clonedDoc.getElementById("invoice-content");
          if (content) {
            content.style.transform = "scale(0.95)";
            content.style.transformOrigin = "top center";
            content.style.margin = "0";
            content.style.padding = "0.3cm";
            content.style.width = "100%";
            content.style.height = "auto"; // Add this line
            content.style.breakAfter = "auto"; // Add this line
          }
        },
      });

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
        compress: true,
        hotfixes: ["px_scaling"],
        putOnlyUsedFonts: true, // Add this line
        precision: 16, // Add this line
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const imgData = canvas.toDataURL("image/jpeg", 1.0); // Increased quality

      // Only use the exact height needed
      pdf.addImage(
        imgData,
        "JPEG",
        0,
        0,
        imgWidth,
        Math.min(imgHeight, pageHeight),
        undefined,
        "FAST"
      );
      return pdf;
    } catch (error) {
      console.error("PDF generation failed:", error);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    try {
      const pdf = await generatePDF();
      const pdfBlob = pdf.output("blob");
      window.open(URL.createObjectURL(pdfBlob));
    } catch (error) {
      alert("Failed to generate PDF. Please try again.");
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const pdf = await generatePDF();
      pdf.save(`invoice-${props.invoiceNumber}.pdf`);
    } catch (error) {
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 lg:px-0">
      <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4 print:hidden">
        <button
          onClick={handlePrint}
          disabled={isGenerating}
          className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-2.5 text-white rounded-lg disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
          style={buttonStyles}
          onMouseOver={(e) =>
            Object.assign(e.currentTarget.style, buttonHoverStyles)
          }
          onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonStyles)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 5a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2-2h8v4H6V3zm9 7a1 1 0 00-1 1v4H6v-4a1 1 0 10-2 0v4a2 2 0 002 2h8a2 2 0 002-2v-4a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          {isGenerating ? "Generating..." : "Open PDF"}
        </button>
        <button
          onClick={handleDownloadPDF}
          disabled={isGenerating}
          className="w-full sm:w-auto px-4 lg:px-6 py-2 lg:py-2.5 text-white rounded-lg disabled:opacity-50 transition-all duration-200 shadow-sm hover:shadow flex items-center justify-center gap-2"
          style={buttonStyles}
          onMouseOver={(e) =>
            Object.assign(e.currentTarget.style, buttonHoverStyles)
          }
          onMouseOut={(e) => Object.assign(e.currentTarget.style, buttonStyles)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
          {isGenerating ? "Generating..." : "Download PDF"}
        </button>
      </div>
      <InvoiceContent ref={invoiceRef} {...props} />
    </div>
  );
}
