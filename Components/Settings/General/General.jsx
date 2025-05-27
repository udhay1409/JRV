"use client";

import React, { useState, useEffect, useRef } from "react";
import { Select, SelectItem } from "@heroui/select";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import axios from "axios";
import { toast } from "react-toastify";
import Image from "next/image";

const General = ({ initialHotelData }) => {
  const [hotelData, setHotelData] = useState(initialHotelData);
  const [color, setColor] = useState(initialHotelData.color || "#00569B");
  const [colorInput, setColorInput] = useState(
    initialHotelData.color || "#00569B"
  );
  const [isLoading, setIsLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(initialHotelData.logo);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const colorInputRef = useRef(null);

  useEffect(() => {
    setHotelData(initialHotelData);
    fetchColor(); // Fetch color when component mounts
  }, [initialHotelData]);

  const fetchColor = async () => {
    try {
      const response = await axios.get("/api/hotelColor");
      if (response.data.success) {
        setColor(response.data.color);
        setColorInput(response.data.color); // Also update the input field
      }
    } catch (error) {
      console.error("Error fetching color:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    if (name === "hotelName") {
      handleHotelNameChange(value);
      return;
    }

    setHotelData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleHotelNameChange = (value) => {
    const prefix = value.slice(0, 3).toLowerCase();
    const newHotelDb = `${prefix}-${hotelData.preferenceId}`.toLowerCase();

    setHotelData((prevData) => ({
      ...prevData,
      hotelName: value,
      hotelDb: newHotelDb,
    }));
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        // 5MB limit
        toast.error("File size should be less than 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      setIsImageLoading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = reader.result;
        setHotelData((prev) => ({
          ...prev,
          newLogo: base64Data, // Store as newLogo to differentiate from existing logo
        }));
        setLogoPreview(base64Data);
        setIsImageLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleColorChange = (e) => {
    const newColor = e.target.value;
    setColorInput(newColor);
    if (isValidHexColor(newColor)) {
      setColor(newColor);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // First update the color if it's valid
      if (
        isValidHexColor(colorInput) &&
        colorInput !== initialHotelData.color
      ) {
        const colorResponse = await axios.put("/api/hotelColor", {
          color: colorInput,
        });
        if (!colorResponse.data.success) {
          throw new Error("Failed to update color");
        }
      }

      // Then update other hotel details
      const { newLogo, ...updateData } = hotelData;
      if (newLogo) {
        updateData.logo = newLogo;
      }

      const response = await axios.put(`/api/hotelDetails`, updateData);

      if (response.data.success) {
        setHotelData((prev) => ({
          ...prev,
          ...response.data.hotelData,
          newLogo: null,
        }));
        toast.success("Hotel details updated successfully!");
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update hotel details"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const isValidHexColor = (color) => {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  };

  const triggerColorPicker = () => {
    colorInputRef.current?.click();
  };

  const LogoPreview = () => (
    <div className="flex flex-col items-center space-y-4">
      {logoPreview && (
        <div className="relative w-48 h-48 border rounded-lg overflow-hidden flex items-center justify-center bg-gray-50">
          {isImageLoading ? (
            <div className="animate-pulse bg-gray-200 w-full h-full" />
          ) : (
            <Image
              src={logoPreview}
              alt="Hotel Logo"
              width={192}
              height={192}
              className="object-contain"
              onError={() => {
                toast.error("Error loading image");
                setLogoPreview(null);
              }}
            />
          )}
        </div>
      )}
      <div className="flex items-center space-x-2">
        <Input
          id="logo-upload"
          type="file"
          className="w-64"
          placeholder="Upload Logo"
          accept="image/*"
          onChange={handleFileChange}
        />
        {logoPreview && (
          <Button
            color="danger"
            variant="light"
            onClick={() => {
              setLogoPreview(null);
              setHotelData((prev) => ({ ...prev, newLogo: null }));
            }}
          >
            Remove
          </Button>
        )}
      </div>
      <small className="text-gray-500">
        Recommended: Square image, max 5MB (PNG, JPG)
      </small>
    </div>
  );

  return (
    <section
      aria-label="General Mahal Settings"
      className=" mx-auto space-y-8 bg-white rounded-lg p-8 shadow-sm"
    >
      <h2 className="text-2xl font-bold mb-6">Mahal Details</h2>
      <form
        aria-label="Mahal Details Form"
        className="space-y-6"
        onSubmit={handleSubmit}
      >
        <div
          aria-label="Logo Upload Section"
          className="flex flex-col items-center mb-8"
        >
          <LogoPreview />
        </div>
        <div aria-label="Hotel Information" className="flex space-x-4">
          <div className="w-1/2">
            {" "}
            <label htmlFor="hotelName" className="block mb-2">
              Mahal Name
            </label>
            <Input
              id="hotelName"
              name="hotelName"
              placeholder="Mahal name"
              value={hotelData.hotelName}
              onChange={handleInputChange}
            />
          </div>
          <div className="w-1/2">
            <label htmlFor="gstNo" className="block mb-2">
              GST No
            </label>
            <Input
              id="gstNo"
              name="gstNo"
              placeholder="GST No"
              value={hotelData.gstNo}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div aria-label="Contact Information" className="flex space-x-4">
          <div className="w-1/2">
            <label htmlFor="firstName" className="block mb-2">
              Contact Person
            </label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="First Name"
              value={hotelData.firstName}
              onChange={handleInputChange}
            />
          </div>
          <div className="w-1/2">
            <label htmlFor="lastName" className="block mb-2">
              &nbsp;
            </label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Last Name"
              value={hotelData.lastName}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div aria-label="Contact Numbers and Email" className="flex space-x-4">
          <div className="w-1/3">
            <label htmlFor="mobileNo" className="block mb-2">
              Mobile No
            </label>
            <Input
              id="mobileNo"
              name="mobileNo"
              placeholder="Mobile No"
              value={hotelData.mobileNo}
              onChange={handleInputChange}
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="landlineNo" className="block mb-2">
              Landline No
            </label>
            <Input
              id="landlineNo"
              name="landlineNo"
              placeholder="Landline No"
              value={hotelData.landlineNo}
              onChange={handleInputChange}
            />
          </div>
          <div className="w-1/3">
            <label htmlFor="emailId" className="block mb-2">
              Email ID
            </label>
            <Input
              id="emailId"
              name="emailId"
              type="email"
              placeholder="Email ID"
              value={hotelData.emailId}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div aria-label="Address Information">
          <label className="block mb-2">Address</label>
          <div aria-label="Street Address" className="flex space-x-4 mb-4">
            <Input
              placeholder="Door No."
              className="w-1/2"
              name="doorNo"
              value={hotelData.doorNo}
              onChange={handleInputChange}
            />
            <Input
              placeholder="Street Name"
              className="w-1/2"
              name="streetName"
              value={hotelData.streetName}
              onChange={handleInputChange}
            />
          </div>
          <div aria-label="Location Details" className="flex space-x-4 mb-4">
            <Input
              placeholder="Pin code"
              className="w-1/2"
              name="pincode"
              value={hotelData.pincode}
              onChange={handleInputChange}
            />
            <Input
              placeholder="District"
              className="w-1/2"
              name="district"
              value={hotelData.district}
              onChange={handleInputChange}
            />
          </div>
          <div aria-label="Region Information" className="flex space-x-4">
            <Input
              placeholder="State"
              className="w-1/2"
              name="state"
              value={hotelData.state}
              onChange={handleInputChange}
            />
            <Input
              placeholder="Country"
              className="w-1/2"
              name="country"
              value={hotelData.country}
              onChange={handleInputChange}
            />
          </div>
        </div>

        <div className="relative">
          <label
            htmlFor="color"
            className="block text-sm font-medium text-gray-700"
          >
            Brand Color
          </label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <Input
              type="text"
              id="color"
              name="color"
              placeholder="#00569B"
              value={colorInput}
              onChange={handleColorChange}
              className={`flex-grow rounded-l-md ${
                !isValidHexColor(colorInput) ? "border-red-500" : ""
              }`}
            />
            <div
              className="inline-flex items-center px-3 border rounded-r-md border-l-0 border-gray-300 cursor-pointer"
              style={{
                backgroundColor: isValidHexColor(colorInput)
                  ? colorInput
                  : color,
              }}
              onClick={triggerColorPicker}
            />
            <input
              type="color"
              ref={colorInputRef}
              value={color}
              onChange={handleColorChange}
              className="hidden"
            />
          </div>
          {!isValidHexColor(colorInput) && (
            <small className="text-red-500">
              Please enter a valid hex color code (e.g., #00569B)
            </small>
          )}
        </div>

        <div aria-label="Form Actions" className="flex justify-end">
          <Button
            radius="full"
            className=" bg-hotel-primary text-white  w-1/6"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </section>
  );
};

export default General;
