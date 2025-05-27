"use client";

import { useState, useEffect } from "react";
import { Card, Form, Row, Col, Button, Spinner } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

import ClientSelect from "@/Components/Hotel/addBooking/ClientSelect";
import { FaUpload } from "react-icons/fa";
import axios from "axios";
import { countries } from "countries-list";

export default function AddGuest({ guestId }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileNo: "",
    countryCode: "+91",
    address: "",
    gender: "",
    dateOfBirth: "",
    nationality: "",
    verificationType: "",
    verificationId: "",
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const router = useRouter();

  const countryOptions = Object.entries(countries).map(([code, country]) => ({
    value: code,
    label: country.name,
  }));

  useEffect(() => {
    const fetchGuestData = async () => {
      if (!guestId) return;

      try {
        setIsEditMode(true);
        const response = await axios.get(`/api/guests/${guestId}`);

        if (response.data.success) {
          const guest = response.data.guest;
          const mobileNo = guest.mobileNo || "";
          const countryCode =
            mobileNo.substring(0, mobileNo.length - 10) || "+91";
          const number = mobileNo.substring(mobileNo.length - 10);

          setFormData({
            firstName: guest.firstName || "",
            lastName: guest.lastName || "",
            email: guest.email || "",
            mobileNo: number,
            countryCode: countryCode,
            address: guest.address || "",
            gender: guest.gender || "",
            dateOfBirth: guest.dateOfBirth
              ? guest.dateOfBirth.split("T")[0]
              : "",
            nationality: guest.nationality || "",
            verificationType: guest.verificationType || "",
            verificationId: guest.verificationId || "",
          });

          if (guest.uploadedFiles) {
            setUploadedFiles(
              guest.uploadedFiles.map((file) => ({
                name: file.fileName,
                preview: file.fileUrl,
                isExisting: true,
              }))
            );
          }
        }
      } catch (error) {
        console.error("Error fetching guest data:", error);
        toast.error("Failed to load guest data");
      }
    };

    fetchGuestData();
  }, [guestId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const formDataToSend = new FormData();
      const dataToUpdate = {
        ...formData,
        name: `${formData.firstName} ${formData.lastName}`,
        mobileNo: formData.countryCode + formData.mobileNo,
      };

      Object.entries(dataToUpdate).forEach(([key, value]) => {
        formDataToSend.append(key, value);
      });

      uploadedFiles
        .filter((fileObj) => !fileObj.isExisting)
        .forEach((fileObj) => {
          formDataToSend.append("files", fileObj.file);
        });

      const url = isEditMode
        ? `/api/guests/${guestId}`
        : "/api/guests/add-guest";
      const method = isEditMode ? "PUT" : "POST";

      const response = await axios({
        method,
        url,
        data: isEditMode ? dataToUpdate : formDataToSend,
        headers: {
          "Content-Type": isEditMode
            ? "application/json"
            : "multipart/form-data",
        },
      });

      if (response.data.success) {
        toast.success(response.data.message || "Guest saved successfully");
        router.push("/dashboard/contacts/guest");
      } else {
        throw new Error(
          response.data.error ||
            `Failed to ${isEditMode ? "update" : "add"} guest`
        );
      }
    } catch (error) {
      console.error(
        `Error ${isEditMode ? "updating" : "adding"} guest:`,
        error
      );
      toast.error(
        error.response?.data?.error ||
          `Error ${isEditMode ? "updating" : "adding"} guest`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      file,
      name: file.name,
      preview: URL.createObjectURL(file),
      isExisting: false,
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleRemoveFile = async (index, isExisting) => {
    if (isExisting && guestId) {
      try {
        const fileToRemove = uploadedFiles[index];
        await axios.delete(`/api/guests/${guestId}`, {
          data: { fileName: fileToRemove.name },
        });
        toast.success("File removed successfully");
      } catch (error) {
        console.error("Error removing file:", error);
        toast.error("Failed to remove file");
        return;
      }
    }

    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container-fluid py-5">
      <Card className="shadow-sm">
        <Card.Body className="p-4">
          <h1 className="h3 mb-4">
            {isEditMode ? "Edit Guest" : "Add New Guest"}
          </h1>
          <Form onSubmit={handleSubmit}>
            <Row className="g-3">
              <Col md={6}>
                <Form.Group>
                  <Form.Label>First Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Last Name *</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Email *</Form.Label>
                  <Form.Control
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Mobile Number *</Form.Label>
                  <PhoneInput
                    country={"in"}
                    value={formData.countryCode + formData.mobileNo}
                    onChange={(value, data) => {
                      setFormData({
                        ...formData,
                        countryCode: `+${data.dialCode}`,
                        mobileNo: value.slice(data.dialCode.length),
                      });
                    }}
                    inputStyle={{ width: "100%" }}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Gender</Form.Label>
                  <Form.Select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Date of Birth</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) =>
                      setFormData({ ...formData, dateOfBirth: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Address</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Nationality</Form.Label>
                  <ClientSelect
                    options={countryOptions}
                    value={countryOptions.find(
                      (option) => option.label === formData.nationality
                    )}
                    onChange={(option) =>
                      setFormData({
                        ...formData,
                        nationality: option ? option.label : "",
                      })
                    }
                    placeholder="Select nationality"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Verification Type</Form.Label>
                  <Form.Select
                    value={formData.verificationType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationType: e.target.value,
                      })
                    }
                  >
                    <option value="">Select Type</option>
                    <option value="aadhar">Aadhar Card</option>
                    <option value="passport">Passport</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label>Verification ID</Form.Label>
                  <Form.Control
                    type="text"
                    value={formData.verificationId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        verificationId: e.target.value,
                      })
                    }
                  />
                </Form.Group>
              </Col>
              <Col md={12}>
                <Form.Group>
                  <Form.Label>Upload ID Proof</Form.Label>
                  <div className="border-2 border-dashed p-3 text-center">
                    <input
                      type="file"
                      id="fileUpload"
                      className="d-none"
                      onChange={handleFileUpload}
                      multiple
                      accept="image/*,.pdf"
                    />
                    <label htmlFor="fileUpload" className="mb-0 cursor-pointer">
                      <FaUpload className="display-4 text-muted mb-2" />
                      <p className="mb-0">Click to upload or drag and drop</p>
                      <p className="small text-muted">
                        Supported formats: JPEG, PNG, PDF
                      </p>
                    </label>
                  </div>
                  {uploadedFiles.length > 0 && (
                    <div className="mt-2">
                      <h6>Uploaded Files:</h6>
                      <ul className="list-unstyled">
                        {uploadedFiles.map((file, index) => (
                          <li
                            key={index}
                            className="d-flex justify-content-between align-items-center"
                          >
                            <span>{file.name}</span>
                            <Button
                              variant="link"
                              className="text-danger p-0"
                              onClick={() =>
                                handleRemoveFile(index, file.isExisting)
                              }
                            >
                              Remove
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Form.Group>
              </Col>
            </Row>
            <div className="d-flex justify-content-end mt-4">
              <Button
                type="submit"
                className="bg-hotel-primary text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    {isEditMode ? "Updating..." : "Saving..."}
                  </>
                ) : isEditMode ? (
                  "Update Guest"
                ) : (
                  "Save Guest"
                )}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
