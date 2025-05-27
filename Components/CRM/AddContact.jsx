"use client";

import React, { useState } from "react";
import { Card } from "@heroui/card";
import { Input, Textarea } from "@heroui/input";
import { Button } from "@heroui/button";

import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "@/styles/phoneInput.css";
import axios from "axios";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

export default function AddContact() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobileno: "",
    countryCode: "91", // Default to India
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.mobileno.trim()) {
      newErrors.mobileno = "Mobile number is required";
    } else if (!/^\+?[\d\s-]{8,}$/.test(formData.mobileno)) {
      newErrors.mobileno = "Invalid mobile number";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    // Combine country code with mobile number
    const submissionData = {
      ...formData,
      mobileno: `+${formData.countryCode}${formData.mobileno}`,
    };

    try {
      setIsSubmitting(true);
      const response = await axios.post("/api/crm", submissionData);

      if (response.data.success) {
        toast.success("Contact added successfully!");
        router.push("/dashboard/crm");
      } else {
        toast.error(response.data.message || "Failed to add contact");
      }
    } catch (error) {
      console.error("Error adding contact:", error);
      toast.error("Failed to add contact");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mx-auto p-6 min-h-[700px] flex flex-col">
        <h1 className="text-2xl font-semibold mb-6">Add New Contact</h1>
        <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
          <div className="space-y-6 flex-grow">
            <div>
              <Input
                label="Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                errorMessage={errors.name}
                isInvalid={!!errors.name}
                isRequired
              />
            </div>
            <div>
              <Input
                label="Email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                errorMessage={errors.email}
                isInvalid={!!errors.email}
                isRequired
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Mobile Number</label>
              <div
                className={`custom-phone-input ${
                  errors.mobileno ? "error" : ""
                }`}
              >
                <PhoneInput
                  country={"in"}
                  value={formData.countryCode + formData.mobileno}
                  onChange={(value, data) => {
                    const countryCode = data.dialCode;
                    const phoneNumber = value.slice(data.dialCode.length);
                    setFormData((prev) => ({
                      ...prev,
                      countryCode: countryCode,
                      mobileno: phoneNumber,
                    }));
                    if (errors.mobileno) {
                      setErrors((prev) => ({ ...prev, mobileno: "" }));
                    }
                  }}
                  inputProps={{
                    required: true,
                    placeholder: "Enter mobile number",
                  }}
                  onFocus={() => setIsCountryDropdownOpen(true)}
                  onBlur={() =>
                    setTimeout(() => setIsCountryDropdownOpen(false), 200)
                  }
                  enableSearch={true}
                  disableSearchIcon={true}
                  searchPlaceholder="Search country..."
                />
              </div>
              {isCountryDropdownOpen && (
                <div className="country-list-backdrop" />
              )}
              {errors.mobileno && (
                <p className="text-red-500 text-xs mt-1">{errors.mobileno}</p>
              )}
            </div>
            <div>
              <Textarea
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Add any additional notes..."
                minRows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-6 mt-auto ">
            <Button
              color="danger"
              variant="flat"
              onClick={() => router.push("/dashboard/crm")}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-hotel-primary text-white"
              isLoading={isSubmitting}
            >
              Add Contact
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
