"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import { Row, Col, Form, Card, ProgressBar } from "react-bootstrap";
import { Button } from "@heroui/button";

import { FaCalendarAlt, FaTimes, FaUpload } from "react-icons/fa";

import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { toast } from "react-toastify";
import { countries } from "countries-list";
import ClientSelect from "../addBooking/ClientSelect"; // Import the ClientSelect component
import AddBookingSkeleton from "../addBooking/AddBookingSkeleton.jsx"; // Import the skeleton component
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../addBooking/addbooking.css";
import { validationRules, validateField } from "../../../utils/validationUtils";

export default function EditGuestBooking({ params }) {
  // Add loading state at the top with other state declarations
  const [loading, setLoading] = useState(true);

  const { bookingNumber } = params;
  const router = useRouter();

  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  const [verificationType, setVerificationType] = useState("");

  const [formData, setFormData] = useState({
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
    aadharNumber: "",
    passportNumber: "",
    verificationId: "",
    countryCode: "+91",
  });
  const [countryOptions, setCountryOptions] = useState([]);
  const [modifiedFields, setModifiedFields] = useState({});
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const [propertyType, setPropertyType] = useState("room"); // Add property type state
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

  useEffect(() => {
    const options = Object.entries(countries).map(([code, country]) => ({
      value: code,
      label: country.name,
      search: `${country.name} ${code} ${country.native}`.toLowerCase(),
    }));
    setCountryOptions(options);
  }, []);

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBookingData()]);
      } catch (error) {
        console.error("Error loading booking data:", error);
        toast.error("Failed to load booking data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllData();
  }, [bookingNumber]);

  // Update fetchBookingData to include new fields
  const fetchBookingData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/bookings/${bookingNumber}`);
      if (response.data.success) {
        const bookingData = response.data.booking;

        // Set property type
        setPropertyType(bookingData.propertyType || "room");

        // Set hall-specific details if present
        if (bookingData.propertyType === "hall") {
          setGroomDetails(bookingData.groomDetails || {});
          setBrideDetails(bookingData.brideDetails || {});
          setEventType(bookingData.eventType || "");
          setTimeSlot(
            bookingData.timeSlot || { name: "", fromTime: "", toTime: "" }
          );
          setSelectedServices(bookingData.selectedServices || []);
        }

        const mobileNo = bookingData.mobileNo || "";

        // Extract country code and phone number
        let countryCode = "+91"; // default
        let phoneNumber = mobileNo;

        if (mobileNo.startsWith("+")) {
          const matches = mobileNo.match(/^\+(\d+)/);
          if (matches) {
            countryCode = `+${matches[1]}`;
            phoneNumber = mobileNo.slice(countryCode.length);
          }
        }

        // Store nationality directly without converting to country code
        setFormData({
          firstName: bookingData.firstName || "",
          lastName: bookingData.lastName || "",
          mobileNo: phoneNumber,
          countryCode: countryCode,
          gender: bookingData.gender || "",
          dateOfBirth: bookingData.dateOfBirth
            ? new Date(bookingData.dateOfBirth).toISOString().split("T")[0]
            : "",
          email: bookingData.email || "",
          nationality: bookingData.nationality || "", // Store the full nationality name
          address: bookingData.address || "",
          clientRequest: bookingData.clientRequests || "",
          notes: bookingData.notes || "",
          numberOfRooms: bookingData.numberOfRooms || 1,
          aadharNumber:
            bookingData.verificationType === "aadhar"
              ? bookingData.verificationId || ""
              : "",
          passportNumber:
            bookingData.verificationType === "passport"
              ? bookingData.verificationId || ""
              : "",
          verificationId: bookingData.verificationId || "",
        });

        setVerificationType(bookingData.verificationType);
        setUploadedFiles(
          bookingData.uploadedFiles.map((file) => ({
            name: file.fileName,
            preview: file.filePath,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching booking data:", error);
      toast.error("Failed to fetch booking data");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    setModifiedFields((prev) => ({ ...prev, [name]: true }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }

    // Validate field on change
    const error = validateField(name, value, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, [name]: error }));
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
    setModifiedFields((prev) => ({ ...prev, mobileNo: true }));

    // Clear error when user starts typing
    if (errors.mobileNo) {
      setErrors((prev) => ({ ...prev, mobileNo: null }));
    }

    // Validate phone number
    const error = validateField("mobileNo", phoneNumber, validationRules);
    if (error) {
      setErrors((prev) => ({ ...prev, mobileNo: error }));
    }
  };

  const handleSelectChange = (e) => {
    setVerificationType(e.target.value || "");
    // Don't clear verification values when changing type
    setFormData((prev) => ({
      ...prev,
      verificationType: e.target.value || "", // Add this line
      verificationId: prev.aadharNumber || prev.passportNumber || "", // Add this line
    }));
  };

  const handleSelectCountryChange = (selectedOption, {}) => {
    setFormData((prevData) => ({
      ...prevData,
      nationality: selectedOption ? selectedOption.label : "", // Store the country name, not the code
    }));
    setModifiedFields((prev) => ({ ...prev, nationality: true }));
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

  const validateForm = () => {
    const newErrors = {};

    // Validate all fields using validation rules
    Object.keys(formData).forEach((field) => {
      // Skip mobile number validation if it hasn't been modified
      if (field === "mobileNo" && !modifiedFields.mobileNo) {
        return;
      }

      if (validationRules[field]) {
        const error = validateField(field, formData[field], validationRules);
        if (error) newErrors[field] = error;
      }
    });

    // Additional custom validations
    if (!verificationType) {
      newErrors.verificationType = "Please select a verification type";
    }

    if (verificationType === "aadhar" && !formData.aadharNumber) {
      newErrors.aadharNumber = "Aadhar number is required";
    } else if (
      verificationType === "aadhar" &&
      !/^\d{12}$/.test(formData.aadharNumber)
    ) {
      newErrors.aadharNumber = "Aadhar number must be 12 digits";
    }

    if (verificationType === "passport" && !formData.passportNumber) {
      newErrors.passportNumber = "Passport number is required";
    } else if (
      verificationType === "passport" &&
      !/^[A-Z0-9]{8,}$/.test(formData.passportNumber)
    ) {
      newErrors.passportNumber = "Invalid passport number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    await updateBooking();
  };

  const updateBooking = async () => {
    const bookingFormData = new FormData();

    // Create a complete form data object with the phone number
    const completeFormData = {
      ...formData,
      // Only combine country code and mobile number if the field was modified
      mobileNo: modifiedFields.mobileNo
        ? `${formData.countryCode}${formData.mobileNo}`
        : formData.mobileNo, // Use existing number if not modified
      clientRequests: formData.clientRequest,
    };

    // Only append modified fields
    Object.keys(modifiedFields).forEach((key) => {
      if (
        completeFormData[key] !== null &&
        completeFormData[key] !== undefined
      ) {
        bookingFormData.append(key, completeFormData[key].toString());
      }
    });

    // Handle file uploads if any
    if (uploadedFiles.length > 0) {
      // Handle existing files
      const existingFiles = uploadedFiles.filter((file) => !file.file);
      if (existingFiles.length > 0) {
        bookingFormData.append(
          "existingFiles",
          JSON.stringify(
            existingFiles.map((file) => ({
              fileName: file.name,
              filePath: file.preview,
            }))
          )
        );
      }

      // Handle new files
      const newFiles = uploadedFiles.filter((file) => file.file);
      newFiles.forEach((fileObj) => {
        bookingFormData.append("newFiles", fileObj.file);
      });
    } // Add verification details to form data
    if (verificationType) {
      bookingFormData.append("verificationType", verificationType);
      if (verificationType === "aadhar") {
        bookingFormData.append("verificationId", formData.aadharNumber);
      } else if (verificationType === "passport") {
        bookingFormData.append("verificationId", formData.passportNumber);
      }
    }

    // Add hall-specific details if property type is hall
    if (propertyType === "hall") {
      if (groomDetails) {
        bookingFormData.append("groomDetails", JSON.stringify(groomDetails));
      }
      if (brideDetails) {
        bookingFormData.append("brideDetails", JSON.stringify(brideDetails));
      }
      if (eventType) {
        bookingFormData.append("eventType", eventType);
      }
      if (timeSlot) {
        bookingFormData.append("timeSlot", JSON.stringify(timeSlot));
      }
    }

    // Append existing uploaded files
    if (uploadedFiles.length > 0) {
      const existingFiles = uploadedFiles
        .filter((file) => !file.file) // Filter out new files
        .map((file) => ({
          fileName: file.name,
          filePath: file.preview,
        }));
      bookingFormData.append("existingFiles", JSON.stringify(existingFiles));
    }

    // Append new files
    uploadedFiles
      .filter((file) => file.file) // Only get new files
      .forEach((fileObj) => {
        bookingFormData.append("uploadedFiles", fileObj.file);
      });
    // Append groom and bride details if property type is hall

    try {
      const response = await axios.put(
        `/api/bookings/${bookingNumber}`,
        bookingFormData,
        { headers: { "Content-Type": "multipart/form-data" } }
      );

      const result = response.data;

      if (result.success) {
        toast.success(result.message);

        router.push(`/dashboard/bookings/${bookingNumber}`);
      } else {
        toast.error("Booking update failed: " + result.message);
      }
    } catch (error) {
      console.error("Error updating booking:", error);
      toast.error("An error occurred while updating the booking.");
    }
  };

  // Add loading check right after state declarations and before the main return
  if (loading) {
    return <AddBookingSkeleton />;
  }

  return (
    <section className="container-fluid py-5 bg-light addboookinggg">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h1 className="h2 mb-0">Edit Guest</h1>
          </div>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group controlId="firstName">
                  <Form.Label>First Name *</Form.Label>
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
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="lastName">
                  <Form.Label>Last Name *</Form.Label>
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
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="mobileNo">
                  <Form.Label>Mobile No *</Form.Label>
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
                      isInvalid={!!errors.mobileNo}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.mobileNo}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="gender">
                  <Form.Label>Gender *</Form.Label>
                  <Form.Select
                    name="gender"
                    value={formData.gender || ""} // Add fallback empty string
                    onChange={handleInputChange}
                    isInvalid={!!errors.gender}
                    required
                  >
                    <option value="" key="empty-gender">
                      Select gender
                    </option>
                    <option value="male" key="male">
                      Male
                    </option>
                    <option value="female" key="female">
                      Female
                    </option>
                    <option value="other" key="other">
                      Other
                    </option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.gender}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="dateOfBirth">
                  <Form.Label>Date of Birth *</Form.Label>
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
                    <FaCalendarAlt className="position-absolute top-50 end-0 translate-middle-y me-2 text-muted" />
                    <Form.Control.Feedback type="invalid">
                      {errors.dateOfBirth}
                    </Form.Control.Feedback>
                  </div>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="email">
                  <Form.Label>Email *</Form.Label>
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
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="nationality">
                  <Form.Label>Nationality *</Form.Label>
                  <ClientSelect
                    inputId="nationality-select"
                    name="nationality"
                    value={
                      formData.nationality
                        ? {
                            value: formData.nationality,
                            label: formData.nationality, // Use the full nationality name as both value and label
                          }
                        : null
                    }
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
                    isInvalid={!!errors.nationality}
                    required
                  />
                  <Form.Control.Feedback type="invalid">
                    {errors.nationality}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="verificationDetails">
                  <Form.Label>Verification ID *</Form.Label>
                  <Form.Select
                    value={verificationType || ""}
                    onChange={handleSelectChange}
                    isInvalid={!!errors.verificationType}
                    required
                  >
                    <option value="" key="empty">
                      Select Verification ID
                    </option>
                    <option value="aadhar" key="aadhar">
                      Aadhar Number
                    </option>
                    <option value="passport" key="passport">
                      Passport Number
                    </option>
                  </Form.Select>
                  <Form.Control.Feedback type="invalid">
                    {errors.verificationType}
                  </Form.Control.Feedback>
                </Form.Group>
              </Col>
              {verificationType === "aadhar" && (
                <Col md={6}>
                  <Form.Group controlId="aadharNumber">
                    <Form.Label>Enter Aadhar Number *</Form.Label>
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
                  </Form.Group>
                </Col>
              )}
              {verificationType === "passport" && (
                <Col md={6}>
                  <Form.Group controlId="passportNumber">
                    <Form.Label>Enter Passport Number *</Form.Label>
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
                  </Form.Group>
                </Col>
              )}
              <Col md={12}>
                <Form.Group controlId="address">
                  <Form.Label>Address *</Form.Label>
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
                </Form.Group>
              </Col>
              <hr className="h-px my-8 border-dashed border-gray-900 dark:border-gray-900" />
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
                    value={formData.notes}
                    onChange={handleInputChange}
                    placeholder="Enter additional notes"
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
                        <p className="mb-0">Click to upload or drag and drop</p>
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
                        <span className="flex-grow-1">Uploading files...</span>
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
                    Load Complete!
                  </div>
                )}
              </Col>
            </Row>
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
              <div className="d-flex justify-content-end mt-4">
                <Button
                  type="submit"
                  className="me-2 bg-hotel-primary text-white"
                >
                  Update Booking
                </Button>
                <Button
                  className="bg-hotel-secondary-grey text-white"
                  type="button"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
              </div>
            </Row>
          </Form>
        </Card.Body>
      </Card>
    </section>
  );
}
