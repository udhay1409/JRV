import React from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/modal";
import { Button } from "@heroui/button";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

import { format, parseISO, isValid, differenceInDays } from "date-fns";

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  priceBreakdown,
  totalAmount,
  roomSettings,
  dateRange,
  isProcessing,
}) => {
  // Helper function to safely format date
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date =
      typeof dateString === "string"
        ? parseISO(dateString)
        : new Date(dateString);
    return isValid(date) ? format(date, "dd MMM yyyy") : "Invalid Date";
  };

  // Add function to format time similar to BookingModal

  // Helper function to check if a date is a weekend

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const calculateNights = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Calculate nights by getting the difference in days between end and start dates
    // Use exact midnight-to-midnight days for accurate calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    return differenceInDays(end, start);
  };

  // Helper function to check for special offerings
  const getSpecialOffering = (date, propertyType) => {
    if (!roomSettings?.specialOfferings) return null;
    return roomSettings.specialOfferings.find(
      (offering) =>
        offering.propertyType === propertyType &&
        new Date(offering.startDate) <= new Date(date) &&
        new Date(offering.endDate) >= new Date(date)
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl" scrollBehavior="inside">
      <ModalContent>
        <ModalHeader>Booking Confirmation</ModalHeader>
        <ModalBody>
          {/* Stay Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <h3 className="text-lg font-semibold mb-3">Stay Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Check-in</p>
                <p className="font-semibold">
                  {formatDate(dateRange[0].startDate)} ({roomSettings.checkIn})
                </p>
              </div>
              <div>
                <p className="text-gray-600">Check-out</p>
                <p className="font-semibold">
                  {formatDate(dateRange[0].endDate)} ({roomSettings.checkOut})
                </p>
              </div>
              <div>
                <p className="text-gray-600">Duration</p>
                <p className="font-semibold">
                  {calculateNights(
                    dateRange[0].startDate,
                    dateRange[0].endDate
                  )}{" "}
                  nights
                </p>
              </div>
            </div>
          </div>

          {/* Price Breakdown Table */}
          <Table aria-label="Price breakdown">
            <TableHeader>
              <TableColumn>Date</TableColumn>
              <TableColumn>Room Details</TableColumn>
              <TableColumn className="text-right">Room Charges</TableColumn>
              <TableColumn className="text-right">IGST</TableColumn>
              <TableColumn className="text-right">
                Additional Charges
              </TableColumn>
              <TableColumn className="text-right">Daily Total</TableColumn>
            </TableHeader>
            <TableBody>
              {priceBreakdown
                .filter((day) => day.roomType !== "Discount")
                .map((day, index) => {
                  const specialOffering = getSpecialOffering(day.date, "room");
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        {format(new Date(day.date), "dd MMM yyyy")}
                        {day.isWeekend && (
                          <span className="ml-2 text-blue-600 text-sm">
                            (Weekend +{roomSettings.weekendPriceHike}%)
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {`${day.roomType} - ${day.roomNumber}`}
                        {specialOffering && (
                          <span className="ml-2 text-sm text-green-600">
                            ({specialOffering.name}:{" "}
                            {specialOffering.discountPercentage}% off)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.roomCharge)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.taxes)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(day.additionalCharge)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(day.total)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              {/* Display discount row if it exists */}
              {priceBreakdown.find((day) => day.roomType === "Discount") && (
                <TableRow className="text-green-600">
                  <TableCell>Discount</TableCell>
                  <TableCell>{`${
                    priceBreakdown.find((day) => day.roomType === "Discount")
                      .discountPercentage
                  }% Off`}</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right">-</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(
                      priceBreakdown.find((day) => day.roomType === "Discount")
                        .total
                    )}
                  </TableCell>
                </TableRow>
              )}
              <TableRow>
                <TableCell>
                  {format(new Date(dateRange[0].endDate), "dd MMM yyyy")}{" "}
                  (Check-out)
                </TableCell>
                <TableCell>Check-out</TableCell>
                <TableCell className="text-right">₹0.00</TableCell>
                <TableCell className="text-right">₹0.00</TableCell>
                <TableCell className="text-right">₹0.00</TableCell>
                <TableCell className="text-right">₹0.00</TableCell>
              </TableRow>

              {/* Special Offerings Summary */}
              {roomSettings?.specialOfferings?.some(
                (offering) =>
                  offering.propertyType === "room" &&
                  new Date(offering.startDate) <= new Date(dateRange.endDate) &&
                  new Date(offering.endDate) >= new Date(dateRange.startDate)
              ) && (
                <TableRow>
                  <TableCell colSpan={4}>
                    <div className="text-sm text-green-600 mt-2">
                      <p className="font-semibold">Special Offers Applied:</p>
                      {roomSettings.specialOfferings
                        .filter(
                          (offering) =>
                            offering.propertyType === "room" &&
                            new Date(offering.startDate) <=
                              new Date(dateRange.endDate) &&
                            new Date(offering.endDate) >= new Date(
                              dateRange.startDate
                            )
                        )
                        .map((offering, index) => (
                          <p key={index}>
                            {offering.name}: {offering.discountPercentage}% off (
                            {formatDate(offering.startDate)} -{" "}
                            {formatDate(offering.endDate)})
                          </p>
                        ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          {/* Totals Section */}
          <div className="mt-6 space-y-2 border-t pt-4">
            <div className="flex justify-between">
              <span>Total Room Charges</span>
              <span>{formatCurrency(totalAmount.roomCharge)}</span>
            </div>
            <div className="flex justify-between">
              <span>Total IGST</span>
              <span>{formatCurrency(totalAmount.taxes)}</span>
            </div>
            {totalAmount.additionalGuestCharge > 0 && (
              <div className="flex justify-between">
                <span>Total Additional Guest Charges</span>
                <span>{formatCurrency(totalAmount.additionalGuestCharge)}</span>
              </div>
            )}
            {totalAmount.servicesCharge > 0 && (
              <div className="flex justify-between">
                <span>Services Charges</span>
                <span>{formatCurrency(totalAmount.servicesCharge)}</span>
              </div>
            )}
            {totalAmount.discount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount ({totalAmount.discount}%)</span>
                <span>
                  -{" "}
                  {formatCurrency(
                    totalAmount.discountAmount ||
                      (totalAmount.roomCharge * totalAmount.discount) / 100
                  )}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(totalAmount.total)}</span>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button
            color="danger"
            variant="light"
            onPress={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            className="bg-hotel-primary text-white"
            onPress={onConfirm}
            isLoading={isProcessing}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Confirm Booking"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ConfirmationModal;
