import React, { useState, useEffect } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { Modal, ModalContent, ModalHeader, ModalBody } from "@heroui/modal";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Divider } from "@heroui/divider";
import {
  format,
  differenceInDays,
  setHours,
  setMinutes,
  addDays,
  parse,
} from "date-fns";
import axios from "axios";
import { toast } from "react-toastify";
import Script from "next/script";

const initialGuestInfo = {
  firstName: "",
  lastName: "",
  email: "",
  mobileNo: "",
  adults: 1,
  children: 0,
  countryCode: "91", // Default to India
};

export default function BookingModal({
  isOpen,
  onClose,
  room,
  dateRange,
  hotelInfo,
  numberOfRooms,
  roomSettings,
  onBookingSuccess,
}) {
  const [guestInfo, setGuestInfo] = useState(initialGuestInfo);

  const [totalAmount, setTotalAmount] = useState({
    roomCharge: 0,
    taxes: 0,
    additionalGuestCharge: 0,
    total: 0,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("online");
  const [validationErrors, setValidationErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const validateForm = React.useCallback(() => {
    const errors = {};
    if (!guestInfo.firstName.trim())
      errors.firstName = "First name is required";
    if (!guestInfo.lastName.trim()) errors.lastName = "Last name is required";
    if (!guestInfo.email.trim()) {
      errors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(guestInfo.email)) {
      errors.email = "Please enter a valid email";
    }
    if (!guestInfo.mobileNo.trim()) {
      errors.mobileNo = "Mobile number is required";
    }
    return errors;
  }, [guestInfo]);

  const handleNextStep = React.useCallback(() => {
    const errors = validateForm();
    if (Object.keys(errors).length === 0) {
      setCurrentStep(2);
      setValidationErrors({});
    } else {
      setValidationErrors(errors);
    }
  }, [validateForm]);

  const handleInputChange = React.useCallback((name, value) => {
    setGuestInfo((prev) => ({ ...prev, [name]: value }));
    setValidationErrors((prev) => {
      if (prev[name]) {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    if (room && dateRange.from && dateRange.to) {
      calculateTotalAmount();
    }
  }, [room, dateRange, numberOfRooms, guestInfo.adults, guestInfo.children]);

  const calculateRoomPrice = (room, date) => {
    const dayOfWeek = format(date, "EEE");
    const isWeekendDay = roomSettings.weekend.includes(dayOfWeek);
    if (isWeekendDay) {
      const hikePercentage = 1 + roomSettings.weekendPriceHike / 100;
      return room.price * hikePercentage;
    }
    return room.price;
  };

  const calculateTotalAmount = () => {
    if (!room || !dateRange.from || !dateRange.to) return;

    const checkInDate = new Date(dateRange.from);
    const checkOutDate = new Date(dateRange.to);
    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) return;

    let totalRoomCharge = 0;
    let totalTaxes = 0;
    let totalAdditionalCharge = 0;

    const totalCapacity = room.maxGuests * numberOfRooms;
    const totalGuests =
      parseInt(guestInfo.adults) + parseInt(guestInfo.children);
    const totalExtraGuests = Math.max(0, totalGuests - totalCapacity);
    const additionalChargePerNight =
      totalExtraGuests * parseFloat(room.additionalGuestCosts || 0);

    for (let i = 0; i < nights; i++) {
      const currentDate = addDays(checkInDate, i);
      const basePrice =
        calculateRoomPrice(room, currentDate, roomSettings) * numberOfRooms;
      const igst = basePrice * (parseFloat(room.igst) / 100);

      totalRoomCharge += basePrice;
      totalTaxes += igst;
      totalAdditionalCharge += additionalChargePerNight;
    }

    setTotalAmount({
      roomCharge: totalRoomCharge,
      taxes: totalTaxes,
      additionalGuestCharge: totalAdditionalCharge,
      total: totalRoomCharge + totalTaxes + totalAdditionalCharge,
    });
  };

  const getRandomAvailableRooms = (availableRooms, count) => {
    const shuffled = [...availableRooms].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const isRoomAvailableForDateRange = (
    roomNumber,
    startDate,
    endDate,
    checkInTime,
    checkOutTime
  ) => {
    if (!roomNumber?.bookeddates || !Array.isArray(roomNumber.bookeddates))
      return true;

    const [checkInHours, checkInMinutes] = checkInTime.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime
      .split(":")
      .map(Number);

    const requestedCheckIn = setMinutes(
      setHours(new Date(startDate), checkInHours),
      checkInMinutes
    );
    const requestedCheckOut = setMinutes(
      setHours(new Date(endDate), checkOutHours),
      checkOutMinutes
    );

    return !roomNumber.bookeddates.some((bookedDate) => {
      // Check for housekeeping status (checkout without checkOut date or pending)
      if (
        (bookedDate.status === "checkout" && !bookedDate.checkOut) ||
        (bookedDate.status === "pending" && !bookedDate.checkOut)
      ) {
        return true; // Room is unavailable due to housekeeping
      }

      // First check maintenance status
      if (bookedDate.status === "maintenance") {
        if (bookedDate.checkIn) {
          const maintenanceStart = new Date(bookedDate.checkIn);
          return (
            requestedCheckIn >= maintenanceStart ||
            requestedCheckOut >= maintenanceStart
          );
        }
        return true;
      }

      // Check for both checkin and booked status
      if (!["checkin", "booked"].includes(bookedDate.status)) return false;

      const bookedStart = new Date(bookedDate.checkIn);
      const bookedEnd = new Date(bookedDate.checkOut);

      // The key check: if the checkout time of the existing booking is the same day
      // as the checkin time of the new booking, check the actual hours
      if (bookedEnd.toDateString() === requestedCheckIn.toDateString()) {
        // Allow booking if the new check-in time is after the existing check-out time
        return requestedCheckIn.getTime() < bookedEnd.getTime();
      }

      // Standard overlap check
      return requestedCheckIn < bookedEnd && requestedCheckOut > bookedStart;
    });
  };

  function formatTo12HourUsingDateFns(time) {
    const parsedTime = parse(time, "HH:mm", new Date());
    return format(parsedTime, "hh:mm a");
  }

  function getNights(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    // Set both dates to midnight for accurate day calculation
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    const timeDiff = end.getTime() - start.getTime();
    return Math.round(timeDiff / (1000 * 60 * 60 * 24));
  }

  // Add new function to verify room availability
  const verifyRoomAvailability = async (
    selectedRoomNumbers,
    checkInDate,
    checkOutDate
  ) => {
    try {
      // Fetch fresh room data from API
      const response = await axios.get(`/api/rooms`);
      if (!response.data.success) {
        throw new Error("Failed to verify room availability");
      }

      const currentRooms = response.data.rooms;
      const currentRoom = currentRooms.find((r) => r._id === room._id);

      if (!currentRoom) {
        throw new Error("Selected room type is no longer available");
      }

      // Verify each selected room number
      for (const roomNum of selectedRoomNumbers) {
        const roomNumber = currentRoom.roomNumbers.find(
          (r) => r.number === roomNum.number
        );
        if (!roomNumber) {
          throw new Error(`Room ${roomNum.number} is no longer available`);
        }

        // Check if any booking exists with 'checkin', 'booked', or 'maintenance' status
        const hasConflictingBooking = roomNumber.bookeddates?.some(
          (booking) => {
            // Check maintenance first
            if (booking.status === "maintenance") {
              if (booking.checkIn) {
                const maintenanceStart = new Date(booking.checkIn);
                return (
                  checkInDate >= maintenanceStart ||
                  checkOutDate >= maintenanceStart
                );
              }
              return true;
            }

            // Then check booked or checkin status
            if (["checkin", "booked"].includes(booking.status)) {
              const bookedStart = new Date(booking.checkIn);
              const bookedEnd = new Date(booking.checkOut);

              // The key check: if the checkout time of the existing booking is the same day
              // as the checkin time of the new booking, check the actual hours
              if (bookedEnd.toDateString() === checkInDate.toDateString()) {
                // Allow booking if the new check-in time is after the existing check-out time
                return checkInDate.getTime() < bookedEnd.getTime();
              }

              // Standard overlap check
              return checkInDate < bookedEnd && checkOutDate > bookedStart;
            }

            return false;
          }
        );

        if (hasConflictingBooking) {
          throw new Error(
            `Room ${roomNum.number} is not available for the selected dates`
          );
        }
      }
      return true;
    } catch (error) {
      throw error;
    }
  };

  // Modify handleSubmit function
  const handleSubmit = React.useCallback(
    async (e) => {
      e.preventDefault();
      const errors = validateForm();
      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error("Please fill all required fields correctly");
        return;
      }
      setIsProcessing(true);

      try {
        const checkInDate = new Date(dateRange.from);
        checkInDate.setHours(
          roomSettings.checkIn.split(":")[0],
          roomSettings.checkIn.split(":")[1],
          0,
          0
        );

        const checkOutDate = new Date(dateRange.to);
        checkOutDate.setHours(
          roomSettings.checkOut.split(":")[0],
          roomSettings.checkOut.split(":")[1],
          0,
          0
        );

        const availableRoomNumbers = room.roomNumbers.filter((roomNum) =>
          isRoomAvailableForDateRange(
            roomNum,
            checkInDate,
            checkOutDate,
            roomSettings.checkIn,
            roomSettings.checkOut
          )
        );

        // Add additional check for minimum required rooms
        if (availableRoomNumbers.length < numberOfRooms) {
          toast.error(
            `Only ${availableRoomNumbers.length} rooms available for the selected dates.`
          );
          setIsProcessing(false);
          return;
        }

        const selectedRoomNumbers = getRandomAvailableRooms(
          availableRoomNumbers,
          numberOfRooms
        );

        if (selectedRoomNumbers.length < numberOfRooms) {
          toast.error("Not enough available rooms for the selected dates.");
          setIsProcessing(false);
          return;
        }

        // Verify current availability before proceeding
        await verifyRoomAvailability(
          selectedRoomNumbers,
          checkInDate,
          checkOutDate
        );

        // Continue with existing booking process...
        const nights = getNights(dateRange.from, dateRange.to);

        // Format the complete phone number with + prefix
        const completePhoneNumber = `+${guestInfo.countryCode}${guestInfo.mobileNo}`;

        // Create a new form data object with the complete phone number
        const bookingFormData = new FormData();
        Object.entries({
          ...guestInfo,
          mobileNo: completePhoneNumber, // Override the mobileNo with complete number
        }).forEach(([key, value]) => {
          bookingFormData.append(key, value.toString());
        });

        bookingFormData.append("numberOfRooms", numberOfRooms.toString());

        const roomsData = selectedRoomNumbers.map((roomNum, index) => {
          let totalRoomAmount = 0;

          for (let i = 0; i < nights; i++) {
            const currentDate = addDays(new Date(dateRange.from), i);
            const basePrice = calculateRoomPrice(
              room,
              currentDate,
              roomSettings
            );
            const igst = basePrice * (parseFloat(room.igst) / 100);

            const additionalCharge =
              index === 0 ? totalAmount.additionalGuestCharge / nights : 0;

            const dailyTotal = basePrice + igst + additionalCharge;
            totalRoomAmount += dailyTotal;
          }

          return {
            type: room.name,
            number: roomNum.number,
            _id: room._id,
            price: parseFloat(room.price),
            igst: parseFloat(room.igst),
            additionalGuestCharge:
              index === 0 ? totalAmount.additionalGuestCharge : 0,
            totalAmount: totalRoomAmount,
            mainImage: room.mainImage,
            nights: nights,
          };
        });

        bookingFormData.append("rooms", JSON.stringify(roomsData));
        bookingFormData.append("totalAmount", JSON.stringify(totalAmount));

        bookingFormData.append("checkInDate", checkInDate.toISOString());
        bookingFormData.append("checkOutDate", checkOutDate.toISOString());

        const guestsData = {
          adults: parseInt(guestInfo.adults),
          children: parseInt(guestInfo.children),
        };
        bookingFormData.append("guests", JSON.stringify(guestsData));

        bookingFormData.append(
          "roomNumbers",
          selectedRoomNumbers.map((room) => room.number).join(",")
        );
        bookingFormData.append("paymentMethod", paymentMethod);

        try {
          if (paymentMethod === "online") {
            const orderResponse = await axios.post(
              `/api/bookings/create-razorpay-order`,
              {
                amount: totalAmount.total,
                currency: "INR",
              }
            );

            const { orderId, apiKey } = orderResponse.data;

            const options = {
              key: apiKey,
              amount: totalAmount.total * 100,
              currency: "INR",
              name: hotelInfo.hotelName,
              description: `Booking for ${room.name}`,
              order_id: orderId,
              handler: async (response) => {
                try {
                  const verificationResponse = await axios.post(
                    `/api/bookings/verify-razorpay-payment`,
                    {
                      razorpay_order_id: response.razorpay_order_id,
                      razorpay_payment_id: response.razorpay_payment_id,
                      razorpay_signature: response.razorpay_signature,
                    }
                  );

                  if (verificationResponse.data.success) {
                    bookingFormData.append(
                      "razorpayOrderId",
                      response.razorpay_order_id
                    );
                    bookingFormData.append(
                      "razorpayPaymentId",
                      response.razorpay_payment_id
                    );
                    bookingFormData.append(
                      "razorpaySignature",
                      response.razorpay_signature
                    );
                    bookingFormData.append(
                      "razorpayAmount",
                      totalAmount.total.toString()
                    );
                    bookingFormData.append("razorpayCurrency", "INR");
                    bookingFormData.append("paymentStatus", "completed");

                    const bookingResponse = await axios.post(
                      `/api/bookings/addbooking`,
                      bookingFormData,
                      { headers: { "Content-Type": "multipart/form-data" } }
                    );

                    if (bookingResponse.data.success) {
                      setGuestInfo(initialGuestInfo);
                      toast.success("Booking created successfully!");
                      onClose();
                      onBookingSuccess();
                    } else {
                      toast.error(
                        "Failed to create booking: " +
                          bookingResponse.data.message
                      );
                    }
                  } else {
                    toast.error("Payment verification failed.");
                  }
                } catch (error) {
                  console.error(
                    "Error verifying payment or creating booking:",
                    error
                  );
                  toast.error(
                    "An error occurred while verifying the payment or creating the booking."
                  );
                }
              },
              prefill: {
                name: `${guestInfo.firstName} ${guestInfo.lastName}`,
                email: guestInfo.email,
                contact: guestInfo.mobileNo,
              },
              theme: {
                color: "#3399cc",
              },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
          }
        } catch (error) {
          console.error("Error creating Razorpay order:", error);
          toast.error("An error occurred while processing the payment.");
        } finally {
          setIsProcessing(false);
        }
      } catch (error) {
        toast.error(error.message || "Error checking room availability");
        setIsProcessing(false);
      }
    },
    [validateForm, guestInfo, totalAmount, dateRange, room, numberOfRooms]
  );

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <Modal
        size="3xl"
        isOpen={isOpen}
        onClose={onClose}
        className="sm:mx-4 md:mx-auto"
        motionProps={{
          variants: {
            enter: {
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.3,
                ease: "easeOut",
              },
            },
            exit: {
              y: 20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: "easeIn",
              },
            },
          },
        }}
        classNames={{
          wrapper: "items-center",
          base: "m-0 h-[100dvh] sm:h-auto sm:m-auto",
        }}
      >
        <ModalContent className="relative flex justify-center h-[100dvh] sm:h-auto">
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-bold text-hotel-primary">
              {currentStep === 1 ? "Guest Information" : "Booking Summary"}
            </h2>
            <div className="flex justify-center space-x-2 text-sm">
              <span
                className={`${
                  currentStep === 1
                    ? "text-hotel-primary font-bold"
                    : "text-gray-400"
                }`}
              >
                Guest Details
              </span>
              <span>→</span>
              <span
                className={`${
                  currentStep === 2
                    ? "text-hotel-primary font-bold"
                    : "text-gray-400"
                }`}
              >
                Review & Pay
              </span>
            </div>
          </ModalHeader>

          <ModalBody>
            <form onSubmit={handleSubmit} className="w-full">
              {currentStep === 1 ? (
                <div className="space-y-4 p-4">
                  <Input
                    label="First Name"
                    placeholder="Enter first name"
                    value={guestInfo.firstName}
                    onChange={(e) =>
                      handleInputChange("firstName", e.target.value)
                    }
                    isInvalid={!!validationErrors.firstName}
                    errorMessage={validationErrors.firstName}
                    className="w-full"
                    required
                  />
                  <Input
                    label="Last Name"
                    placeholder="Enter last name"
                    value={guestInfo.lastName}
                    onChange={(e) =>
                      handleInputChange("lastName", e.target.value)
                    }
                    isInvalid={!!validationErrors.lastName}
                    errorMessage={validationErrors.lastName}
                    className="w-full"
                    required
                  />
                  <Input
                    type="email"
                    label="Email"
                    placeholder="Enter email address"
                    value={guestInfo.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    isInvalid={!!validationErrors.email}
                    errorMessage={validationErrors.email}
                    className="w-full"
                    required
                  />
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Mobile Number</label>
                    <div
                      className={`custom-phone-input ${
                        validationErrors.mobileNo ? "error" : ""
                      }`}
                    >
                      <PhoneInput
                        country={"in"}
                        value={guestInfo.countryCode + guestInfo.mobileNo}
                        onChange={(value, data) => {
                          const countryCode = data.dialCode;
                          const phoneNumber = value.slice(data.dialCode.length);
                          handleInputChange("countryCode", countryCode);
                          handleInputChange("mobileNo", phoneNumber);
                        }}
                        inputProps={{
                          required: true,
                          placeholder: "Enter mobile number",
                        }}
                        onFocus={() => setIsCountryDropdownOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setIsCountryDropdownOpen(false), 200)
                        }
                        searchStyle={{
                          width: "100%",
                          height: "40px",
                          padding: "8px 12px",
                          borderRadius: "8px",
                          border: "2px solid #e5e7eb",
                        }}
                        enableSearch={true}
                        disableSearchIcon={true}
                        searchPlaceholder="Search country..."
                      />
                    </div>
                    {isCountryDropdownOpen && (
                      <div className="country-list-backdrop" />
                    )}
                    {validationErrors.mobileNo && (
                      <p className="text-red-500 text-xs mt-1">
                        {validationErrors.mobileNo}
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      type="number"
                      label="Adults"
                      placeholder="Number of adults"
                      value={guestInfo.adults}
                      onChange={(e) =>
                        handleInputChange("adults", e.target.value)
                      }
                      min="1"
                      required
                    />
                    <Input
                      type="number"
                      label="Children"
                      placeholder="Number of children"
                      value={guestInfo.children}
                      onChange={(e) =>
                        handleInputChange("children", e.target.value)
                      }
                      min="0"
                    />
                  </div>
                  <div className="flex justify-end gap-4 mt-6">
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-hotel-primary text-white"
                      onPress={handleNextStep}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2 mb-4">
                        <p className="font-semibold">{hotelInfo?.hotelName}</p>
                        <p className="text-sm text-gray-600">
                          {hotelInfo?.address}
                        </p>
                        <p className="text-sm text-gray-600">
                          Phone no: {hotelInfo?.mobileNo}
                        </p>
                        <p className="text-sm text-gray-600">
                          Email Id: {hotelInfo?.emailId}
                        </p>
                      </div>

                      <Divider className="my-4" />

                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Check-in</span>
                          <span>
                            {format(new Date(dateRange.from), "dd/MM/yyyy")} (
                            {formatTo12HourUsingDateFns(roomSettings.checkIn)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Check-Out</span>
                          <span>
                            {format(new Date(dateRange.to), "dd/MM/yyyy")} (
                            {formatTo12HourUsingDateFns(roomSettings.checkOut)})
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>
                            {getNights(dateRange.from, dateRange.to)} Night(s)
                            Stay
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Number of Rooms</span>
                          <span>{numberOfRooms}</span>
                        </div>
                      </div>

                      <Divider className="my-4" />

                      <div className="space-y-4">
                        <p className="font-semibold">
                          Rooms & Rates (Price for{" "}
                          {differenceInDays(dateRange.to, dateRange.from)}{" "}
                          Night(s))
                        </p>
                        {Array.from({ length: numberOfRooms }).map(
                          (_, index) => (
                            <div key={index} className="space-y-2">
                              <p>
                                Room {index + 1}: {room?.name || "Deluxe Room"}
                              </p>
                            </div>
                          )
                        )}
                        <p>
                          Total Guests:{" "}
                          {parseInt(guestInfo.adults) +
                            parseInt(guestInfo.children)}{" "}
                          (Adults: {guestInfo.adults}, Children:{" "}
                          {guestInfo.children})
                        </p>
                      </div>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>
                            Room Charges (
                            {differenceInDays(dateRange.to, dateRange.from)}{" "}
                            nights, {numberOfRooms}{" "}
                            {numberOfRooms > 1 ? "rooms" : "room"})
                          </span>
                          <span>Rs. {totalAmount.roomCharge.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IGST ({room?.igst}%)</span>
                          <span>Rs. {totalAmount.taxes}</span>
                        </div>
                        {totalAmount.additionalGuestCharge > 0 && (
                          <div className="flex justify-between">
                            <span>Additional Guest Charges</span>
                            <span>
                              Rs. {totalAmount.additionalGuestCharge.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>

                      <Divider className="my-4" />

                      <div className="flex justify-between font-semibold">
                        <span>Total Inc. of Taxes</span>
                        <span>Rs. {totalAmount.total.toFixed(2)}</span>
                      </div>

                      <div className="mt-4 text-sm text-gray-600">
                        <p>Pay at Hotel</p>
                        <p className="font-semibold">
                          Rs. {totalAmount.total.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row justify-end gap-4">
                    <Button
                      color="default"
                      variant="light"
                      onPress={() => setCurrentStep(1)}
                    >
                      Back
                    </Button>
                    <Button color="danger" variant="light" onPress={onClose}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isProcessing}
                      className="w-full sm:w-auto bg-hotel-primary text-white"
                    >
                      {isProcessing ? (
                        <div className="flex items-center gap-2">
                          <span className="loading loading-spinner"></span>
                          Processing...
                        </div>
                      ) : (
                        "Confirm Booking"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}
