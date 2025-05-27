"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import {
  Row,
  Col,
  Form,
  Card,
  ProgressBar,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import { FaCalendarAlt, FaTimes, FaUpload } from "react-icons/fa";
import {
  addDays,
  setHours,
  setMinutes,
  format,
  differenceInDays,
} from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import ClientSelect from "./ClientSelect.js"; // Import the ClientSelect component
import AddBookingSkeleton from "./AddBookingSkeleton"; // Import the skeleton component
import { useSearchParams } from "next/navigation";

import { countries } from "countries-list";
import ConfirmationModal from "../../ui/BookingConfirmationModal.jsx";
import { Button } from "@heroui/button";
import Script from "next/script";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import debounce from "lodash.debounce";

import { validationRules, validateField } from "../../../utils/validationUtils";
import { DateRange } from "react-date-range";

export default function AddGuest() {
  const [loading, setLoading] = useState(true); // Add loading state
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [propertyType, setPropertyType] = useState("room"); // Add property type state

  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [rooms, setRooms] = useState([]);
  const [selectedRooms, setSelectedRooms] = useState([
    { type: "", number: "", price: "", mainImage: "" },
  ]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [verificationType, setVerificationType] = useState("");
  const [dateRange, setDateRange] = useState([
    {
      startDate: new Date(),
      endDate: addDays(new Date(), 1),
      key: "selection",
    },
  ]);

  const [checkInTime, setCheckInTime] = useState("14:00");
  const [checkOutTime, setCheckOutTime] = useState("12:00");
  const [showCalendar, setShowCalendar] = useState(false);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileNo: "",
    countryCode: "+91", // Changed: Added + prefix
    gender: "",
    dateOfBirth: "",
    email: "",
    nationality: "",
    address: "",
    clientRequest: "",
    notes: "",
    numberOfRooms: 1,
    aadharNumber: "",
    passportNumber: "",
  });
  const [countryOptions, setCountryOptions] = useState([]);
  const [totalAmount, setTotalAmount] = useState({
    roomCharge: 0,
    taxes: 0,
    additionalGuestCharge: 0,
    servicesCharge: 0,
    discount: 0,
    discountAmount: 0,
    total: 0,
  });
  const [roomSettings, setRoomSettings] = useState({
    specialOfferings: [],
  });

  const [priceBreakdown, setPriceBreakdown] = useState([]);
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [isAutofilling, setIsAutofilling] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add state variables for hall-specific details
  const [groomDetails, setGroomDetails] = useState({
    name: "",
    mobileNo: "",
    email: "",
    address: "",
    dob: "",
    gender: "",
    verificationId: "",
  });
  const [brideDetails, setBrideDetails] = useState({
    name: "",
    mobileNo: "",
    email: "",
    address: "",
    dob: "",
    gender: "",
    verificationId: "",
  });
  const [eventType, setEventType] = useState("");
  const [timeSlot, setTimeSlot] = useState({
    name: "",
    fromTime: "",
    toTime: "",
  });
  const [eventTypes, setEventTypes] = useState([]);
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);

  const router = useRouter();

  const handleSelectCountryChange = useCallback((selectedOption, { name }) => {
    if (name === "nationality") {
      setFormData((prev) => ({
        ...prev,
        nationality: selectedOption ? selectedOption.label : "",
      }));
    }
  }, []);

  // Create debounced search function outside useCallback
  const debouncedSearchFn = debounce(async (searchType, value) => {
    if (!value) return;

    try {
      setIsAutofilling(true);
      const response = await axios.get(
        `/api/guests/search?${searchType}=${value}`
      );

      if (response.data.success) {
        const guestData = response.data.guest;

        // Clean up mobile number that comes with country code
        let cleanMobileNo = guestData.mobileNo || "";
        let cleanCountryCode = "+91"; // Default country code

        // If mobile number starts with a country code pattern (+XX or +XXX)
        if (cleanMobileNo.startsWith("+")) {
          const matches = cleanMobileNo.match(/^\+(\d{1,3})/);
          if (matches) {
            cleanCountryCode = `+${matches[1]}`;
            // Remove the country code from the mobile number
            cleanMobileNo = cleanMobileNo.substring(
              cleanMobileNo.indexOf(matches[1]) + matches[1].length
            );
          }
        }

        // Remove any additional + symbols and duplicated country codes
        cleanMobileNo = cleanMobileNo.replace(/\+/g, "").replace(/^91/, "");

        // Update form data with cleaned values
        setFormData((prev) => ({
          ...prev,
          firstName: guestData.firstName || guestData.name?.split(" ")[0] || "",
          lastName:
            guestData.lastName ||
            guestData.name?.split(" ").slice(1).join(" ") ||
            "",
          email: guestData.email || prev.email,
          mobileNo: cleanMobileNo,
          countryCode: cleanCountryCode,
          gender: guestData.gender || "",
          dateOfBirth: guestData.dateOfBirth
            ? format(new Date(guestData.dateOfBirth), "yyyy-MM-dd")
            : "",
          nationality: guestData.nationality || "",
          address: guestData.address || "",
          aadharNumber:
            guestData.verificationType?.toLowerCase() === "aadhar"
              ? guestData.verificationId
              : "",
          passportNumber:
            guestData.verificationType?.toLowerCase() === "passport"
              ? guestData.verificationId
              : "",
        }));

        // Set verification type
        setVerificationType(guestData.verificationType?.toLowerCase() || "");

        // Handle file uploads
        if (guestData.uploadedFiles?.length > 0) {
          setUploadedFiles(
            guestData.uploadedFiles.map((file) => ({
              name: file.fileName,
              type: file.fileType,
              preview: file.fileUrl,
              file: null,
            }))
          );
        }
      }
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error("Error fetching guest data:", error);
      }
    } finally {
      setIsAutofilling(false);
    }
  }, 500);

  // Use the debounced function in useCallback
  const debouncedSearch = useCallback(
    (searchType, value) => {
      debouncedSearchFn(searchType, value);
    },
    [debouncedSearchFn]
  );

  useEffect(() => {
    const options = Object.entries(countries).map(([code, country]) => ({
      value: code,
      label: country.name,
      search: `${country.name} ${code} ${country.native}`.toLowerCase(),
    }));
    setCountryOptions(options);
  }, []);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);

        const [roomsResponse, settingsResponse] = await Promise.all([
          axios.get(`/api/rooms`),
          axios.get(`/api/settings/rooms`),
        ]);

        if (roomsResponse.data.success) {
          setRooms(roomsResponse.data.rooms);
        } else {
          console.error("Failed to fetch rooms");
        }

        const settingsData = settingsResponse.data.settings;
        const fullDayTimeSlot = settingsData.timeSlots?.find(
          (slot) => slot.name === "full day"
        );
        setCheckInTime(fullDayTimeSlot?.fromTime || "14:00");
        setCheckOutTime(fullDayTimeSlot?.toTime || "12:00");
        setRoomSettings({
          specialOfferings: settingsData.specialOfferings || [],
        });

        // Set hall-specific settings
        if (settingsData.eventTypes) {
          setEventTypes(settingsData.eventTypes);
        }

        if (settingsData.timeSlots) {
          setAvailableTimeSlots(settingsData.timeSlots);
        }

        // Set services with name and price
        if (settingsData.services && Array.isArray(settingsData.services)) {
          setServices(
            settingsData.services.map((service) => ({
              name: service.name,
              price: parseFloat(service.price) || 0,
            }))
          );
        }
      } catch (error) {
        console.error("Error fetching initial data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, []);

  const searchParams = useSearchParams();
  const hasSearched = useRef(false);

  // Email search effect - runs only once for initial email param
  useEffect(() => {
    const email = searchParams.get("email");

    if (email && !isAutofilling && !hasSearched.current) {
      hasSearched.current = true;
      debouncedSearch("email", email);
    }
  }, [searchParams, debouncedSearch, isAutofilling]);

  // Modify this useEffect to avoid continuous re-renders
  useEffect(() => {
    // Pre-fill form data from URL parameters if they exist
    const firstName = searchParams.get("firstName");
    const lastName = searchParams.get("lastName");
    const email = searchParams.get("email");
    const mobileno = searchParams.get("mobileno");
    const propertyType = searchParams.get("propertyType");
    const eventType = searchParams.get("eventType");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const notes = searchParams.get("notes");

    if (firstName || lastName || email || mobileno) {
      setFormData((prev) => ({
        ...prev,
        firstName: firstName || "",
        lastName: lastName || "",
        email: email || "",
        mobileNo: mobileno || "",
        clientRequest: notes || "",
      }));
    }

    if (propertyType) {
      setPropertyType(propertyType.toLowerCase());
    }

    if (eventType) {
      setEventType(eventType);
    }

    if (startDate && endDate) {
      setDateRange([
        {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          key: "selection",
        },
      ]);
    }
  }, [searchParams]);

  const isRoomAvailableForDateRange = useCallback(
    (roomNumber, startDate, endDate) => {
      // Check if room is in housekeeping (status is checkout or pending with null checkOut)
      const isInHousekeeping = roomNumber.bookeddates.some(
        (date) =>
          (date.status === "checkout" || date.status === "pending") &&
          date.checkOut === null
      );

      // If room is in housekeeping, it's not available
      if (isInHousekeeping) {
        return false;
      }

      // Check regular booking conflicts
      return !roomNumber.bookeddates.some((bookedDate) => {
        const bookedStart = bookedDate.checkIn
          ? new Date(bookedDate.checkIn)
          : null;
        const bookedEnd = bookedDate.checkOut
          ? new Date(bookedDate.checkOut)
          : null;

        if (bookedDate.status === "maintenance" && bookedStart) {
          return startDate >= bookedStart || endDate >= bookedStart;
        }

        return (
          (startDate >= bookedStart && startDate < bookedEnd) ||
          (endDate > bookedStart && endDate <= bookedEnd) ||
          (startDate <= bookedStart && endDate >= bookedEnd)
        );
      });
    },
    []
  );

  const filterAvailableRooms = useCallback(() => {
    if (
      !dateRange[0]?.startDate ||
      !dateRange[0]?.endDate ||
      rooms.length === 0
    ) {
      return;
    }

    const startDate = dateRange[0].startDate;
    const endDate = dateRange[0].endDate;

    const [checkInHours, checkInMinutes] = checkInTime.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime
      .split(":")
      .map(Number);

    const adjustedStartDate = setMinutes(
      setHours(startDate, checkInHours),
      checkInMinutes
    );
    const adjustedEndDate = setMinutes(
      setHours(endDate, checkOutHours),
      checkOutMinutes
    );

    const available = rooms.reduce((acc, room) => {
      // Skip if property type doesn't match selected type
      if (room.type !== propertyType) return acc;

      // Check room type and use appropriate property
      const roomNumbersArray =
        propertyType === "hall" ? room.hallNumbers : room.roomNumbers;

      // Skip if the property doesn't exist
      if (!roomNumbersArray) return acc;

      const availableRoomNumbers = roomNumbersArray.filter((rn) =>
        isRoomAvailableForDateRange(rn, adjustedStartDate, adjustedEndDate)
      );

      if (availableRoomNumbers.length > 0) {
        acc.push({
          ...room,
          roomNumbers: availableRoomNumbers,
        });
      }

      return acc;
    }, []);

    setAvailableRooms(available);
    setSelectedRooms(
      Array(numberOfRooms).fill({ type: "", number: "", price: "" })
    );
  }, [
    dateRange,
    rooms,
    checkInTime,
    checkOutTime,
    propertyType,
    numberOfRooms,
    isRoomAvailableForDateRange,
  ]);

  useEffect(() => {
    if (dateRange[0]?.startDate && dateRange[0]?.endDate && rooms.length > 0) {
      filterAvailableRooms();
    }
  }, [
    dateRange,
    rooms,
    checkInTime,
    checkOutTime,
    propertyType,
    filterAvailableRooms,
  ]);

  useEffect(() => {
    setNumberOfRooms(1);
    setSelectedRooms(Array(1).fill({ type: "", number: "", price: "" }));
  }, [propertyType]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    const error = validateField(name, value, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
    }

    if (name === "email" && value.includes("@")) {
      debouncedSearch("email", value);
    }
  };

  const handlePhoneChange = (value, data) => {
    const countryCode = `+${data.dialCode}`;
    const phoneNumber = value.slice(data.dialCode.length);

    setFormData((prev) => ({
      ...prev,
      countryCode: countryCode,
      mobileNo: phoneNumber,
    }));

    if (phoneNumber.length >= 10) {
      debouncedSearch("phone", phoneNumber);
    }

    if (errors.mobileNo) {
      setErrors((prev) => ({ ...prev, mobileNo: null }));
    }
  };

  const handleAdultIncrease = () => setAdults(adults + 1);
  const handleAdultDecrease = () => adults > 1 && setAdults(adults - 1);
  const handleChildrenIncrease = () => setChildren(children + 1);
  const handleChildrenDecrease = () =>
    children > 0 && setChildren(children - 1);

  const totalGuests = adults + children;

  const handleSelectChange = (e) => {
    setVerificationType(e.target.value);
  };

  const filterCountries = (inputValue) => {
    return countryOptions.filter((country) =>
      country.search.includes(inputValue.toLowerCase())
    );
  };

  const loadCountryOptions = (inputValue) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(filterCountries(inputValue));
      }, 300);
    });
  };

  const handleDateChange = (item) => {
    const startDate = new Date(item.selection.startDate);
    const endDate = new Date(item.selection.endDate);

    const [checkInHours, checkInMinutes] = checkInTime.split(":").map(Number);
    const [checkOutHours, checkOutMinutes] = checkOutTime
      .split(":")
      .map(Number);

    const adjustedStartDate = setMinutes(
      setHours(startDate, checkInHours),
      checkInMinutes
    );
    const adjustedEndDate = setMinutes(
      setHours(endDate, checkOutHours),
      checkOutMinutes
    );

    setDateRange([
      {
        startDate: adjustedStartDate,
        endDate:
          adjustedStartDate >= adjustedEndDate
            ? adjustedStartDate
            : adjustedEndDate,
        key: "selection",
      },
    ]);

    if (startDate && endDate && startDate.getTime() !== endDate.getTime()) {
      setShowCalendar(false);
    }
  };

  const toggleCalendar = () => setShowCalendar((prev) => !prev);

  const handleFileUpload = (event) => {
    const files = event.target.files || event.dataTransfer.files;
    if (files) {
      const newFiles = Array.from(files).map((file) => ({
        file,
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setUploadedFiles((prev) => [...prev, ...newFiles]);

      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(progress);
        if (progress >= 100) {
          clearInterval(interval);
          setUploadComplete(true);
          setTimeout(() => {
            setUploadProgress(0);
            setUploadComplete(false);
          }, 2000);
        }
      }, 200);

      if (event.target.value !== undefined) {
        event.target.value = null;
      }
    }
  };

  const removeFile = (fileName) => {
    setUploadedFiles((prev) => prev.filter((file) => file.name !== fileName));
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    handleFileUpload(event);
  };

  const calculateRoomPrice = useCallback(
    (room, date, roomSettings) => {
      if (!room || !room.price) return 0;

      let basePrice = parseFloat(room.price);

      // Check if it's a half-day booking
      if (timeSlot.name === "halfday") {
        basePrice = basePrice / 2; // Half the price for half-day bookings
      }

      // Check for any applicable special offerings for this date
      const applicableOffering = roomSettings.specialOfferings?.find(
        (offering) =>
          offering.propertyType === propertyType &&
          new Date(offering.startDate) <= date &&
          new Date(offering.endDate) >= date
      );

      // Apply special offering discount if applicable
      if (applicableOffering) {
        const discount =
          (basePrice * applicableOffering.discountPercentage) / 100;
        basePrice -= discount;
      }

      return basePrice;
    },
    [timeSlot, propertyType]
  );

  // Modify calculateTotalAmount to be more stable
  const calculateTotalAmount = useCallback(() => {
    // Return early if required data is not available
    if (
      selectedRooms.some((room) => !room.type || !room.number || !room.price)
    ) {
      return;
    }

    const checkInDate = dateRange[0]?.startDate;
    const checkOutDate = dateRange[0]?.endDate;

    if (!checkInDate || !checkOutDate) {
      return;
    }

    const nights = Math.ceil(
      (checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)
    );

    if (nights < 1) {
      return;
    }

    let priceBreakdownArray = [];
    let totalRoomCharge = 0;
    let totalTaxes = 0;
    let totalAdditionalCharge = 0;
    let totalServicesCharge = 0;

    // Calculate services charge for hall bookings
    if (propertyType === "hall" && selectedServices.length > 0) {
      totalServicesCharge = Math.round(
        selectedServices.reduce(
          (sum, service) => sum + (parseFloat(service.price) || 0),
          0
        )
      );
    }

    // Calculate additional guest charges for rooms only
    let totalExtraGuests = 0;
    let highestAdditionalGuestCost = 0;

    if (propertyType === "room") {
      const totalCapacity = selectedRooms.reduce(
        (sum, room) => sum + (room.maxGuests || 2),
        0
      );
      totalExtraGuests = Math.max(0, totalGuests - totalCapacity);
      highestAdditionalGuestCost = Math.max(
        ...selectedRooms.map((room) =>
          parseFloat(room.additionalGuestCosts || 0)
        )
      );
    }

    const additionalChargePerNight =
      propertyType === "room"
        ? totalExtraGuests * highestAdditionalGuestCost
        : 0;

    selectedRooms.forEach((room, roomIndex) => {
      let roomTotalAmount = 0;

      for (let i = 0; i < nights; i++) {
        const currentDate = addDays(checkInDate, i);
        const basePrice = Math.round(
          calculateRoomPrice(room, currentDate, roomSettings)
        );
        const igst = Math.round(basePrice * (parseFloat(room.igst) / 100));

        // Only apply additional charges for rooms and only to the first room
        const roomAdditionalCharge =
          propertyType === "room" && roomIndex === 0
            ? Math.round(additionalChargePerNight)
            : 0;

        totalRoomCharge += basePrice;
        totalTaxes += igst;

        roomTotalAmount += basePrice + igst + roomAdditionalCharge;

        priceBreakdownArray.push({
          date: currentDate,
          roomType: room.type,
          roomNumber: room.number,
          roomCharge: basePrice,
          taxes: igst,
          additionalCharge: roomAdditionalCharge,
          total: basePrice + igst + roomAdditionalCharge,
          // isWeekend: roomSettings.weekend.includes(format(currentDate, "EEE")),
        });
      }

      room.totalAmount = Math.round(roomTotalAmount);

      if (propertyType === "room" && roomIndex === 0) {
        totalAdditionalCharge += Math.round(additionalChargePerNight * nights);
      }
    });

    // Calculate discount
    const discountPercentage = totalAmount.discount || 0;
    const discountAmount = Math.round(
      (totalRoomCharge * discountPercentage) / 100
    );

    // Add discount to price breakdown array
    if (discountPercentage > 0) {
      priceBreakdownArray.push({
        date: null,
        roomType: "Discount",
        roomNumber: "",
        roomCharge: 0,
        taxes: 0,
        additionalCharge: 0,
        discount: discountAmount,
        discountPercentage: discountPercentage,
        total: -discountAmount, // Negative because it's a reduction
        // isWeekend: false,
      });
    }

    // Calculate final total
    const total = Math.round(
      totalRoomCharge +
        totalTaxes +
        totalAdditionalCharge +
        totalServicesCharge -
        discountAmount
    );

    setTotalAmount((prev) => ({
      roomCharge: totalRoomCharge,
      taxes: totalTaxes,
      additionalGuestCharge: totalAdditionalCharge,
      servicesCharge: totalServicesCharge,
      discount: prev.discount, // Keep the discount value from previous state
      discountAmount: discountAmount, // Add the actual discount amount
      total: total,
    }));

    setPriceBreakdown(priceBreakdownArray);
  }, [
    selectedRooms,
    dateRange,
    propertyType,
    selectedServices,
    totalGuests,
    roomSettings,
    totalAmount.discount,
    calculateRoomPrice,
    ,
  ]); // Add all dependencies that are used in the calculation

  useEffect(() => {
    if (
      selectedRooms.length > 0 &&
      dateRange[0]?.startDate &&
      dateRange[0]?.endDate &&
      !isNaN(totalAmount.total) // Add check to prevent unnecessary calculations
    ) {
      calculateTotalAmount();
    }
  }, [selectedRooms, dateRange, calculateTotalAmount, totalAmount.total]);

  const handleRoomChange = (index, field, value) => {
    const newSelectedRooms = [...selectedRooms];
    newSelectedRooms[index] = { ...newSelectedRooms[index], [field]: value };

    if (field === "type" || field === "number") {
      const selectedRoomType = availableRooms.find(
        (r) => r.name === newSelectedRooms[index].type
      );
      if (selectedRoomType) {
        const nights = Math.max(
          1,
          differenceInDays(dateRange[0].endDate, dateRange[0].startDate)
        );
        let totalRoomAmount = 0;

        for (let i = 0; i < nights; i++) {
          const currentDate = addDays(new Date(dateRange[0].startDate), i);
          const basePrice = Math.round(parseFloat(selectedRoomType.price) || 0);
          const igst = Math.round(
            basePrice * (parseFloat(selectedRoomType.igst) / 100) || 0
          );

          // For halls, we don't apply additional guest charges
          const additionalGuestCost =
            propertyType === "room" && index === 0
              ? Math.round(
                  Math.max(0, totalGuests - selectedRoomType.maxGuests) *
                    parseFloat(selectedRoomType.additionalGuestCosts || 0)
                )
              : 0;

          const dailyAmount = Math.round(
            calculateRoomPrice(selectedRoomType, currentDate, roomSettings) +
              igst +
              additionalGuestCost
          );
          totalRoomAmount += dailyAmount;
        }

        // Set the common properties
        const commonProps = {
          ...newSelectedRooms[index],
          price: parseFloat(selectedRoomType.price),
          _id: selectedRoomType._id,
          mainImage:
            selectedRoomType.mainImage || "/assets/img/rooms/rooms.png",
          igst: parseFloat(selectedRoomType.igst) || 0,
          nights: nights,
          totalAmount: totalRoomAmount,
        };

        // Add property type specific properties
        if (propertyType === "room") {
          newSelectedRooms[index] = {
            ...commonProps,
            additionalGuestCosts:
              parseFloat(selectedRoomType.additionalGuestCosts) || 0,
            maxGuests: parseInt(selectedRoomType.maxGuests) || 2,
          };
        } else {
          // For halls, set capacity instead of maxGuests
          newSelectedRooms[index] = {
            ...commonProps,
            capacity: parseInt(selectedRoomType.capacity) || 100,
          };
        }
      }
    }

    setSelectedRooms(newSelectedRooms);
    setTimeout(() => calculateTotalAmount(), 0);
  };

  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((field) => {
      if (validationRules[field]) {
        const error = validateField(field, formData[field], validationRules);
        if (error) newErrors[field] = error;
      }
    });

    if (!propertyType) {
      newErrors.propertyType = "Please select a property type";
    }

    if (!verificationType) {
      newErrors.verificationType = "Please select a verification type";
    }

    if (verificationType === "aadhar" && !formData.aadharNumber) {
      newErrors.aadharNumber = "Aadhar number is required";
    }

    if (verificationType === "passport" && !formData.passportNumber) {
      newErrors.passportNumber = "Passport number is required";
    }

    if (selectedRooms.some((room) => !room.type || !room.number)) {
      newErrors.rooms = `Please select all ${
        propertyType === "hall" ? "hall" : "room"
      } types and numbers`;
    }

    if (!dateRange[0].startDate || !dateRange[0].endDate) {
      newErrors.dateRange = "Please select check-in and check-out dates";
    }

    // Add validation for hall-specific fields
    if (propertyType === "hall") {
      if (!eventType) {
        newErrors.eventType = "Please select an event type";
      }

      if (!timeSlot.name) {
        newErrors.timeSlot = "Please select a time slot";
      }

      // Optional validation for groom/bride details if needed
      // These can be optional or required based on your business logic
      /*
      if (!groomDetails.name && !brideDetails.name) {
        newErrors.contactDetails = "Please provide at least one of groom or bride details";
      }
      */
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const verifyCurrentAvailability = async (
    selectedRooms,
    checkInDate,
    checkOutDate
  ) => {
    try {
      const response = await axios.get(`/api/rooms`);
      if (!response.data.success) {
        throw new Error("Failed to verify availability");
      }

      const currentRooms = response.data.rooms;
      const unavailableRooms = [];

      for (const selectedRoom of selectedRooms) {
        const roomType = currentRooms.find((r) => r._id === selectedRoom._id);
        if (!roomType) {
          throw new Error(
            `${propertyType === "hall" ? "Hall" : "Room"} type ${
              selectedRoom.type
            } no longer exists`
          );
        }

        // Use the correct property based on the property type
        const propertyArray =
          propertyType === "hall" ? roomType.hallNumbers : roomType.roomNumbers;

        if (!propertyArray) {
          throw new Error(
            `${
              propertyType === "hall" ? "Hall" : "Room"
            } numbers array not found for ${selectedRoom.type}`
          );
        }

        const roomNumber = propertyArray.find(
          (r) => r.number === selectedRoom.number
        );

        if (!roomNumber) {
          throw new Error(
            `${propertyType === "hall" ? "Hall" : "Room"} number ${
              selectedRoom.number
            } no longer exists`
          );
        }

        const isAvailable = isRoomAvailableForDateRange(
          roomNumber,
          checkInDate,
          checkOutDate
        );

        if (!isAvailable) {
          unavailableRooms.push(selectedRoom.number);
        }
      }

      if (unavailableRooms.length > 0) {
        throw new Error(
          `${
            propertyType === "hall" ? "Halls" : "Rooms"
          } ${unavailableRooms.join(
            ", "
          )} are no longer available. Please select different ${
            propertyType === "hall" ? "halls" : "rooms"
          }.`
        );
      }

      return true;
    } catch (error) {
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const checkInDate = new Date(dateRange[0].startDate);
      const checkOutDate = new Date(dateRange[0].endDate);

      await verifyCurrentAvailability(selectedRooms, checkInDate, checkOutDate);

      setIsConfirmationModalOpen(true);
    } catch (error) {
      toast.error(error.message || "Error checking availability");
    }
  };

  const handleConfirmBooking = async () => {
    try {
      setIsProcessing(true);
      const checkInDate = new Date(dateRange[0].startDate);
      const checkOutDate = new Date(dateRange[0].endDate);

      await verifyCurrentAvailability(selectedRooms, checkInDate, checkOutDate);

      // Prepare booking data for redirect
      const bookingData = prepareBookingData();

      // Encode the booking data to pass via URL
      const encodedBookingData = encodeURIComponent(
        JSON.stringify(bookingData)
      );

      // Close the confirmation modal
      setIsConfirmationModalOpen(false);

      // Redirect to the record-payment page with the booking data
      router.push(
        `/dashboard/financials/invoices/record-payement?bookingData=${encodedBookingData}`
      );
    } catch (error) {
      toast.error(error.message || "Error processing booking");
      setIsConfirmationModalOpen(false);
      return;
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to prepare booking data for redirect
  const prepareBookingData = () => {
    // Format check-in and check-out dates
    const checkInDateTime = new Date(dateRange[0].startDate);
    checkInDateTime.setHours(
      checkInTime.split(":")[0],
      checkInTime.split(":")[1],
      0,
      0
    );
    const formattedCheckInDate = checkInDateTime.toISOString();

    const checkOutDateTime = new Date(dateRange[0].endDate);
    checkOutDateTime.setHours(
      checkOutTime.split(":")[0],
      checkOutTime.split(":")[1],
      0,
      0
    );
    const formattedCheckOutDate = checkOutDateTime.toISOString();

    // Prepare guests data
    const guestsData = {
      adults: Number.isNaN(adults) ? 0 : adults,
      children: Number.isNaN(children) ? 0 : children,
    };

    // Prepare rooms data
    const roomsData = selectedRooms.map((room, index) => ({
      type: room.type,
      number: room.number,
      price: parseFloat(room.price) || 0,
      _id: room._id,
      mainImage: room.mainImage || "/assets/img/rooms/rooms.png",
      igst: parseFloat(room.igst) || 0,
      additionalGuestCharge:
        propertyType === "room" && index === 0
          ? totalAmount.additionalGuestCharge
          : 0,
      totalAmount: room.totalAmount,
      // Include property-specific fields
      ...(propertyType === "room"
        ? {
            maxGuests: room.maxGuests,
            additionalGuestCosts: room.additionalGuestCosts,
          }
        : { capacity: room.capacity }),
    }));

    // Prepare verification data
    let verificationId = "";
    if (verificationType === "aadhar") {
      verificationId = formData.aadharNumber;
    } else if (verificationType === "passport") {
      verificationId = formData.passportNumber;
    }

    // Prepare hall-specific data if applicable
    const hallSpecificData = {};
    if (propertyType === "hall") {
      // Groom details
      if (groomDetails.name) {
        hallSpecificData.groomDetails = {
          name: groomDetails.name,
          mobileNo: groomDetails.mobileNo,
          email: groomDetails.email,
          address: groomDetails.address,
          dob: groomDetails.dob,
          gender: groomDetails.gender,
          verificationId: groomDetails.verificationId,
        };
      }

      // Bride details
      if (brideDetails.name) {
        hallSpecificData.brideDetails = {
          name: brideDetails.name,
          mobileNo: brideDetails.mobileNo,
          email: brideDetails.email,
          address: brideDetails.address,
          dob: brideDetails.dob,
          gender: brideDetails.gender,
          verificationId: brideDetails.verificationId,
        };
      }

      // Event type
      hallSpecificData.eventType = eventType;

      // Time slot
      if (timeSlot.name) {
        hallSpecificData.timeSlot = {
          name: timeSlot.name,
          fromTime: timeSlot.fromTime,
          toTime: timeSlot.toTime,
        };
      }

      // Services
      if (selectedServices.length > 0) {
        hallSpecificData.services = selectedServices;
      }
    }

    // Combine all data
    const bookingData = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      mobileNo: `${formData.countryCode}${formData.mobileNo}`,
      gender: formData.gender,
      dateOfBirth: formData.dateOfBirth,
      nationality: formData.nationality,
      address: formData.address,
      propertyType: propertyType,
      verificationType: verificationType,
      verificationId: verificationId,
      checkInDate: formattedCheckInDate,
      checkOutDate: formattedCheckOutDate,
      numberOfRooms: numberOfRooms,
      guests: guestsData,
      rooms: roomsData,
      roomNumbers: selectedRooms.map((room) => room.number).join(","),
      clientRequests: formData.clientRequest,
      notes: formData.notes || "",
      totalAmount: totalAmount,
      // Default payment method - will be selected on payment page
      paymentMethod: "cod",
      // Include hall-specific data if applicable
      ...hallSpecificData,
    };

    return bookingData;
  };

  const resetForm = () => {
    setFormData({
      bookingNumber: "",
      firstName: "",
      lastName: "",
      mobileNo: "",
      gender: "",
      dateOfBirth: "",
      email: "",
      nationality: "",
      address: "",
      clientRequest: "",
      notes: "",
      numberOfRooms: 1,
    });
    setSelectedRooms([{ type: "", number: "", price: "" }]);
    setUploadedFiles([]);
    setAdults(1);
    setChildren(0);
    setDateRange([
      {
        startDate: new Date(),
        endDate: addDays(new Date(), 1),
        key: "selection",
      },
    ]);
    setVerificationType("");
    setAvailableRooms([]);

    // Reset hall-specific fields
    setGroomDetails({
      name: "",
      mobileNo: "",
      email: "",
      address: "",
      dob: "",
      gender: "",
      verificationId: "",
    });
    setBrideDetails({
      name: "",
      mobileNo: "",
      email: "",
      address: "",
      dob: "",
      gender: "",
      verificationId: "",
    });
    setEventType("");
    setTimeSlot({
      name: "",
      fromTime: "",
      toTime: "",
    });
    setSelectedServices([]);
  };

  if (loading) {
    return <AddBookingSkeleton />;
  }
  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />

      <section className="container-fluid py-5 bg-light addboookinggg">
        <Card className="shadow-sm">
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1 className="h2 mb-0">Add Guest</h1>
            </div>
            <Form onSubmit={handleSubmit}>
              {isAutofilling && (
                <div className="mb-3 text-blue-600">
                  <Spinner size="sm" className="mr-2" />
                  Searching for guest information...
                </div>
              )}
              <Row className="g-3">
                <Col md={12}>
                  <Form.Group controlId="propertyType">
                    <Form.Label>Property Type *</Form.Label>
                    <Form.Select
                      name="propertyType"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value)}
                      required
                    >
                      <option value="room">Room</option>
                      <option value="hall">Hall</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Label>First Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter first name"
                    isInvalid={!!errors.firstName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.firstName}
                  </Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Last Name</Form.Label>
                  <Form.Control
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter last name"
                    isInvalid={!!errors.lastName}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.lastName}
                  </Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Mobile No</Form.Label>
                  <div
                    className={`custom-input ${errors.mobileNo ? "error" : ""}`}
                  >
                    <div className="phone-input-container">
                      <PhoneInput
                        country={"in"}
                        value={formData.countryCode + formData.mobileNo}
                        onChange={handlePhoneChange}
                        inputProps={{
                          required: true,
                          placeholder: "Enter mobile number",
                          className: "form-control",
                        }}
                        onFocus={() => setIsCountryDropdownOpen(true)}
                        onBlur={() =>
                          setTimeout(() => setIsCountryDropdownOpen(false), 200)
                        }
                        containerStyle={{
                          width: "100%",
                        }}
                        inputStyle={{
                          width: "100%",
                          height: "38px",
                          fontSize: "1rem",
                          paddingLeft: "48px",
                        }}
                        dropdownStyle={{
                          width: "300px",
                          maxHeight: "200px",
                          overflow: "auto",
                          overflowX: "hidden",
                          zIndex: 999,
                        }}
                        enableSearch={true}
                        disableSearchIcon={true}
                        searchPlaceholder="Search country..."
                      />
                    </div>
                  </div>
                  {isCountryDropdownOpen && (
                    <div className="country-list-backdrop" />
                  )}
                  {errors.mobileNo && (
                    <Form.Control.Feedback
                      type="invalid"
                      style={{ display: "block" }}
                    >
                      {errors.mobileNo}
                    </Form.Control.Feedback>
                  )}
                </Col>
                <Col md={6}>
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    isInvalid={!!errors.gender}
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.gender}
                  </Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Date of Birth</Form.Label>
                  <div className="position-relative">
                    <Form.Control
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleInputChange}
                      className="pe-5"
                      isInvalid={!!errors.dateOfBirth}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateOfBirth}
                    </Form.Control.Feedback>
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter email address"
                    isInvalid={!!errors.email}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.email}
                  </Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Nationality</Form.Label>
                  <ClientSelect
                    inputId="nationality-select"
                    name="nationality"
                    value={countryOptions.find(
                      (country) => country.label === formData.nationality
                    )}
                    onChange={(selectedOption) =>
                      handleSelectCountryChange(selectedOption, {
                        name: "nationality",
                      })
                    }
                    options={countryOptions}
                    placeholder="Search and select country"
                    isClearable
                    isSearchable
                    loadOptions={loadCountryOptions}
                    noOptionsMessage={() => "No countries found"}
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nationality}
                  </Form.Control.Feedback>
                </Col>
                <Col md={6}>
                  <Form.Label>Verification Id</Form.Label>
                  <Form.Select
                    value={verificationType || ""}
                    onChange={handleSelectChange}
                    isInvalid={!!errors.verificationType}
                    required
                  >
                    <option value="">Select Verification ID</option>
                    <option value="aadhar">Aadhar Number</option>
                    <option value="passport">Passport Number</option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.verificationType}
                  </Form.Control.Feedback>
                </Col>
                {verificationType === "aadhar" && (
                  <Col md={6}>
                    <Form.Label>Enter Aadhar Number</Form.Label>
                    <Form.Control
                      type="number"
                      name="aadharNumber"
                      value={formData.aadharNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your Aadhar number"
                      isInvalid={!!errors.aadharNumber}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.aadharNumber}
                    </Form.Control.Feedback>
                  </Col>
                )}
                {verificationType === "passport" && (
                  <Col md={6}>
                    <Form.Label>Enter Passport Number</Form.Label>
                    <Form.Control
                      type="text"
                      name="passportNumber"
                      value={formData.passportNumber}
                      onChange={handleInputChange}
                      placeholder="Enter your Passport number"
                      isInvalid={!!errors.passportNumber}
                      required
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.passportNumber}
                    </Form.Control.Feedback>
                  </Col>
                )}
                <Col md={12}>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Enter full address"
                    isInvalid={!!errors.address}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.address}
                  </Form.Control.Feedback>
                </Col>
                {propertyType === "hall" && (
                  <>
                    <Row className="g-3">
                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Body>
                            <h5>Groom Details</h5>
                            <Form.Group className="mb-3">
                              <Form.Label>Full Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={groomDetails.name}
                                onChange={(e) =>
                                  setGroomDetails({
                                    ...groomDetails,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Enter groom's name"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>DOB</Form.Label>
                              <Form.Control
                                type="date"
                                value={groomDetails.dob || ""}
                                onChange={(e) =>
                                  setGroomDetails({
                                    ...groomDetails,
                                    dob: e.target.value,
                                  })
                                }
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Gender</Form.Label>
                              <Form.Select
                                value={groomDetails.gender || ""}
                                onChange={(e) =>
                                  setGroomDetails({
                                    ...groomDetails,
                                    gender: e.target.value,
                                  })
                                }
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Full Address</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={groomDetails.address || ""}
                                onChange={(e) =>
                                  setGroomDetails({
                                    ...groomDetails,
                                    address: e.target.value,
                                  })
                                }
                                placeholder="Enter address"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Verification Id</Form.Label>
                              <Form.Control
                                type="text"
                                value={groomDetails.verificationId || ""}
                                onChange={(e) =>
                                  setGroomDetails({
                                    ...groomDetails,
                                    verificationId: e.target.value,
                                  })
                                }
                                placeholder="Enter verification ID"
                              />
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Col>

                      <Col md={6}>
                        <Card className="mb-3">
                          <Card.Body>
                            <h5>Bride Details</h5>
                            <Form.Group className="mb-3">
                              <Form.Label>Full Name</Form.Label>
                              <Form.Control
                                type="text"
                                value={brideDetails.name}
                                onChange={(e) =>
                                  setBrideDetails({
                                    ...brideDetails,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="Enter bride's name"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>DOB</Form.Label>
                              <Form.Control
                                type="date"
                                value={brideDetails.dob || ""}
                                onChange={(e) =>
                                  setBrideDetails({
                                    ...brideDetails,
                                    dob: e.target.value,
                                  })
                                }
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Gender</Form.Label>
                              <Form.Select
                                value={brideDetails.gender || ""}
                                onChange={(e) =>
                                  setBrideDetails({
                                    ...brideDetails,
                                    gender: e.target.value,
                                  })
                                }
                              >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                              </Form.Select>
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Full Address</Form.Label>
                              <Form.Control
                                as="textarea"
                                rows={3}
                                value={brideDetails.address || ""}
                                onChange={(e) =>
                                  setBrideDetails({
                                    ...brideDetails,
                                    address: e.target.value,
                                  })
                                }
                                placeholder="Enter address"
                              />
                            </Form.Group>

                            <Form.Group className="mb-3">
                              <Form.Label>Verification Id</Form.Label>
                              <Form.Control
                                type="text"
                                value={brideDetails.verificationId || ""}
                                onChange={(e) =>
                                  setBrideDetails({
                                    ...brideDetails,
                                    verificationId: e.target.value,
                                  })
                                }
                                placeholder="Enter verification ID"
                              />
                            </Form.Group>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </>
                )}
                <Col md={6}>
                  <label className="text-lg font-semibold mb-2 block">
                    From Date
                  </label>
                  <div className="d-flex align-items-center">
                    <div
                      className="border rounded-lg py-3 px-4 cursor-pointer hover:shadow-lg transition-all flex-grow-1 me-2"
                      onClick={toggleCalendar}
                    >
                      {dateRange[0].startDate.toDateString()}{" "}
                      <FaCalendarAlt className="float-right text-muted" />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <label className="text-lg font-semibold mb-2 block">
                    To Date
                  </label>
                  <div className="d-flex align-items-center">
                    <div
                      className="border rounded-lg py-3 px-4 cursor-pointer hover:shadow-lg transition-all flex-grow-1 me-2"
                      onClick={toggleCalendar}
                    >
                      {dateRange[0].endDate.toDateString()}{" "}
                      <FaCalendarAlt className="float-right text-muted" />
                    </div>
                  </div>
                </Col>
                <Col md={6}>
                  <Form.Label>
                    No. of {propertyType === "hall" ? "Hall" : "Room"}
                  </Form.Label>
                  <Form.Select
                    value={formData.numberOfRooms}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setFormData((prev) => ({
                        ...prev,
                        numberOfRooms: value,
                      }));
                      setNumberOfRooms(value);
                    }}
                  >
                    {[
                      ...Array(
                        Math.min(
                          5,
                          availableRooms.reduce(
                            (sum, room) => sum + room.roomNumbers.length,
                            0
                          )
                        )
                      ),
                    ].map((_, idx) => (
                      <option key={idx + 1} value={idx + 1}>
                        {idx + 1}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
                {propertyType === "hall" && (
                  <>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Time Slot</Form.Label>
                        <Form.Select
                          value={timeSlot.name}
                          onChange={(e) => {
                            const selected = availableTimeSlots.find(
                              (slot) => slot.name === e.target.value
                            );
                            if (selected) {
                              setTimeSlot({
                                name: selected.name,
                                fromTime: selected.fromTime,
                                toTime: selected.toTime,
                              });
                              setCheckInTime(selected.fromTime);
                              setCheckOutTime(selected.toTime);
                            }
                          }}
                        >
                          <option value="">Select Time Slot</option>
                          {availableTimeSlots.map((slot, idx) => (
                            <option key={idx} value={slot.name}>
                              {slot.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>From Time</Form.Label>
                        <Form.Control
                          type="time"
                          value={timeSlot.fromTime || checkInTime}
                          readOnly
                        />
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>To Time</Form.Label>
                        <Form.Control
                          type="time"
                          value={timeSlot.toTime || checkOutTime}
                          readOnly
                        />
                      </Form.Group>
                    </Col>
                  </>
                )}
                {propertyType === "room" && (
                  <Col md={6}>
                    <Form.Label>Number of Guest</Form.Label>
                    <Dropdown>
                      <Dropdown.Toggle
                        variant="outline-secondary"
                        id="dropdown-basic"
                        className="w-100"
                      >
                        <span role="img" aria-label="guest-icon">
                          👩‍👩‍👦‍👦
                        </span>{" "}
                        {totalGuests} guests
                      </Dropdown.Toggle>
                      <Dropdown.Menu style={{ padding: "10px" }}>
                        <Row className="align-items-center mb-2">
                          <Col>Adults</Col>
                          <Col xs="auto">
                            <Button
                              variant="outline-secondary"
                              onClick={handleAdultDecrease}
                            >
                              -
                            </Button>
                          </Col>
                          <Col xs="auto">
                            <span>{adults}</span>
                          </Col>
                          <Col xs="auto">
                            <Button
                              variant="outline-secondary"
                              onClick={handleAdultIncrease}
                            >
                              +
                            </Button>
                          </Col>
                        </Row>
                        <Row className="align-items-center mb-2">
                          <Col>Children</Col>
                          <Col xs="auto">
                            <Button
                              variant="outline-secondary"
                              onClick={handleChildrenDecrease}
                            >
                              -
                            </Button>
                          </Col>
                          <Col xs="auto">
                            <span>{children}</span>
                          </Col>
                          <Col xs="auto">
                            <Button
                              variant="outline-secondary"
                              onClick={handleChildrenIncrease}
                            >
                              +
                            </Button>
                          </Col>
                        </Row>
                      </Dropdown.Menu>
                    </Dropdown>
                  </Col>
                )}
                {showCalendar && (
                  <div className="mt-6">
                    <DateRange
                      ranges={dateRange}
                      onChange={handleDateChange}
                      minDate={new Date()}
                      rangeColors={["#4F46E5"]}
                      className="w-full"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateRange}
                    </Form.Control.Feedback>
                  </div>
                )}
                {selectedRooms.map((room, index) => (
                  <Card key={index} className="mt-3 bg-light">
                    <Card.Body>
                      <Row className="g-3">
                        <Col md={4}>
                          <Form.Group controlId={`roomType${index}`}>
                            <Form.Label>
                              {propertyType === "hall"
                                ? "Hall Type"
                                : "Room Type"}{" "}
                              {index + 1}
                            </Form.Label>
                            <Form.Select
                              value={room.type}
                              onChange={(e) =>
                                handleRoomChange(index, "type", e.target.value)
                              }
                              isInvalid={!!errors.rooms}
                            >
                              <option value="">
                                Select{" "}
                                {propertyType === "hall" ? "hall" : "room"} type
                              </option>
                              {availableRooms.map((r) => (
                                <option key={r._id} value={r.name}>
                                  {r.name}
                                </option>
                              ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.rooms}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group controlId={`roomNo${index}`}>
                            <Form.Label>
                              {propertyType === "hall" ? "Hall No" : "Room No"}{" "}
                              {index + 1}
                            </Form.Label>
                            <Form.Select
                              value={room.number}
                              onChange={(e) =>
                                handleRoomChange(
                                  index,
                                  "number",
                                  e.target.value
                                )
                              }
                              isInvalid={!!errors.rooms}
                            >
                              <option value="">
                                Select{" "}
                                {propertyType === "hall" ? "hall" : "room"}{" "}
                                number
                              </option>
                              {availableRooms
                                .find((r) => r.name === room.type)
                                ?.roomNumbers.map((rn) => (
                                  <option key={rn.number} value={rn.number}>
                                    {rn.number}
                                  </option>
                                ))}
                            </Form.Select>
                            <Form.Control.Feedback type="invalid">
                              {errors.rooms}
                            </Form.Control.Feedback>
                          </Form.Group>
                        </Col>
                        <Col md={4}>
                          <Form.Group controlId={`price${index}`}>
                            <Form.Label>Price</Form.Label>
                            <div className="input-group">
                              <span className="input-group-text">₹</span>
                              <Form.Control
                                type="number"
                                placeholder="Enter price"
                                value={room.price}
                                onChange={(e) =>
                                  handleRoomChange(
                                    index,
                                    "price",
                                    e.target.value
                                  )
                                }
                                readOnly
                              />
                            </div>
                          </Form.Group>
                        </Col>
                      </Row>
                    </Card.Body>
                  </Card>
                ))}
                {propertyType === "hall" && (
                  <>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Event</Form.Label>
                        <Form.Select
                          value={eventType}
                          onChange={(e) => setEventType(e.target.value)}
                        >
                          <option value="">Select Event</option>
                          {eventTypes.map((type, idx) => (
                            <option key={idx} value={type.name}>
                              {type.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Services</Form.Label>
                        <div className="d-flex flex-wrap gap-4 mt-2">
                          {services.map((service, index) => (
                            <Form.Check
                              key={index}
                              type="checkbox"
                              id={`service-${service.name
                                .toLowerCase()
                                .replace(/\s+/g, "-")}`}
                              label={`${service.name} (₹${service.price})`}
                              checked={selectedServices.some(
                                (s) => s.name === service.name
                              )}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedServices([
                                    ...selectedServices,
                                    {
                                      name: service.name,
                                      price: service.price,
                                    },
                                  ]);
                                } else {
                                  setSelectedServices(
                                    selectedServices.filter(
                                      (s) => s.name !== service.name
                                    )
                                  );
                                }
                              }}
                            />
                          ))}
                          {services.length === 0 && (
                            <p className="text-muted">No services available</p>
                          )}
                        </div>
                      </Form.Group>
                    </Col>
                  </>
                )}
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Property Price</Form.Label>
                    <Form.Control
                      type="number"
                      value={selectedRooms[0]?.price || 0}
                      readOnly
                    />
                  </Form.Group>
                </Col>

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Property Discount</Form.Label>
                    <div className="input-group">
                      <Form.Control
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Enter discount percentage"
                        value={totalAmount.discount || 0}
                        onBlur={() => {
                          // Additional handler to ensure calculation happens on blur
                          calculateTotalAmount();
                        }}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value) || 0;
                          // Update the discount directly in the totalAmount state
                          const newTotalAmount = {
                            ...totalAmount,
                            discount: value,
                          };
                          setTotalAmount(newTotalAmount);

                          // Force a recalculation with the updated discount value
                          setTimeout(() => {
                            calculateTotalAmount();
                          }, 50);
                        }}
                      />
                      <span className="input-group-text">%</span>
                      <Button
                        onPress={() => {
                          // Explicitly recalculate with current discount value
                          calculateTotalAmount();
                        }}
                      >
                        Apply
                      </Button>
                    </div>

                    {/* Clear visual feedback */}
                    {totalAmount.discount > 0 && (
                      <div className="mt-2">
                        <div
                          className="alert alert-success py-1 px-2"
                          role="alert"
                          style={{ fontSize: "0.8rem" }}
                        >
                          <strong>Discount of {totalAmount.discount}%</strong>{" "}
                          will be applied
                        </div>
                      </div>
                    )}
                  </Form.Group>
                </Col>

                {propertyType === "hall" && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Services Price</Form.Label>
                      <Form.Control
                        type="number"
                        value={selectedServices.reduce(
                          (sum, service) =>
                            sum + (parseFloat(service.price) || 0),
                          0
                        )}
                        readOnly
                      />
                    </Form.Group>
                  </Col>
                )}

                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Total Amount</Form.Label>
                    <Form.Control
                      type="number"
                      value={totalAmount.total || 0}
                      readOnly
                    />
                  </Form.Group>
                </Col>
              </Row>

              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group controlId="clientRequest">
                    <Form.Label>Client Request</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="clientRequest"
                      value={formData.clientRequest}
                      onChange={handleInputChange}
                      placeholder="Enter client request"
                    />
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group controlId="notes">
                    <Form.Label>Notes</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="notes"
                      value={formData.notes || ""}
                      onChange={handleInputChange}
                      placeholder="Enter any additional remarks"
                    />
                  </Form.Group>
                </Col>
              </Row>
              <Row className="mt-3">
                <Col md={6}>
                  <Form.Group className="mt-3">
                    <Form.Label>Upload Files</Form.Label>
                    <div
                      className={`border-2 border-dashed p-3 text-center ${
                        isDragging ? "drag-over" : ""
                      }`}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Form.Control
                        type="file"
                        id="fileUpload"
                        className="d-none"
                        onChange={handleFileUpload}
                        multiple
                      />
                      <Form.Label
                        htmlFor="fileUpload"
                        className="mb-0 cursor-pointer"
                      >
                        <div className="uploadingcenter d-flex flex-column align-items-center justify-content-center">
                          <FaUpload className="display-4 text-muted mb-2" />
                          <p className="mb-0">
                            Click to upload or drag and drop
                          </p>
                          <p className="small text-muted">
                            Supported formats: JPEG, PNG, PDF, Word
                          </p>
                        </div>
                      </Form.Label>
                    </div>
                  </Form.Group>
                </Col>
                <Col md={6}>
                  <Form.Group className="mt-3">
                    <Form.Label>Uploaded Files</Form.Label>
                    {uploadedFiles.length > 0 ? (
                      <div className="list-group gap-3">
                        {uploadedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center "
                          >
                            <span>{file.name}</span>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeFile(file.name)}
                            >
                              <FaTimes />
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted">No files uploaded yet.</p>
                    )}
                  </Form.Group>
                  {uploadProgress > 0 && (
                    <Form.Group className="mt-3">
                      <Form.Label>Uploading</Form.Label>
                      <div className="bg-light p-2 rounded">
                        <div className="d-flex align-items-center">
                          <span className="flex-grow-1">
                            Uploading files...
                          </span>
                          <ProgressBar
                            now={uploadProgress}
                            style={{ width: "50%", height: "20px" }}
                          />
                        </div>
                      </div>
                    </Form.Group>
                  )}
                  {uploadComplete && (
                    <div className="mt-2 alert alert-success" role="alert">
                      Upload Complete!
                    </div>
                  )}
                </Col>
              </Row>
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="submit"
                  className="me-2 bg-hotel-primary text-white"
                >
                  Save Guest
                </Button>
                <Button
                  color="secondary"
                  type="button"
                  onPress={resetForm}
                  className="bg-hotel-secondary-grey text-white"
                >
                  Cancel
                </Button>
              </div>
            </Form>
          </Card.Body>
        </Card>
        <ConfirmationModal
          isOpen={isConfirmationModalOpen}
          onClose={() => setIsConfirmationModalOpen(false)}
          onConfirm={handleConfirmBooking}
          priceBreakdown={priceBreakdown}
          totalAmount={totalAmount}
          roomSettings={roomSettings}
          dateRange={dateRange}
          isProcessing={isProcessing}
        />
      </section>
    </>
  );
}
