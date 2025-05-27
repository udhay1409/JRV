"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";
import { motion, AnimatePresence } from "framer-motion";

export default function BookingModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    mobileno: "",
    email: "",
    propertyType: "",
    eventType: "",
    eventStartDate: "",
    eventEndDate: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get("/api/settings/rooms");
        if (response.data.success) {
          const settings = response.data.settings;
          setPropertyTypes(settings.propertyTypes || []);
          setEventTypes(settings.eventTypes || []);
        }
      } catch (error) {
        console.error("Error fetching settings:", error);
      }
    };

    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";
    if (!formData.mobileno) newErrors.mobileno = "Phone number is required";
    else if (!/^\d{10}$/.test(formData.mobileno))
      newErrors.mobileno = "Invalid phone format";
    if (!formData.propertyType)
      newErrors.propertyType = "Property type is required";
    if (!formData.eventType) newErrors.eventType = "Event type is required";
    if (!formData.eventStartDate)
      newErrors.eventDate = "Event date is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await axios.post("/api/crm", formData);
      if (response.data.success) {
        setMessage({
          type: "success",
          text: "Booking request submitted successfully!",
        });
        setTimeout(onClose, 2000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg overflow-hidden w-full max-w-[1000px] relative"
          >
            <div className="grid md:grid-cols-2 h-full">
              <div className="relative hidden md:block">
                <img
                  src="/contact/2.jpg"
                  alt="Wedding ceremony"
                  className="object-cover w-full h-full"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
              </div>
              <div className="flex flex-col h-full">
                <div className="p-4 border-b">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-serif">Ready to Book Your Date?</h2>
                    <button
                      onClick={onClose}
                      className="p-2 hover:bg-gray-100 rounded-full"
                    >
                      <span className="text-xl">&times;</span>
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    Let&apos;s plan your perfect day – together
                  </p>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                  {message.text && (
                    <div
                      className={`mb-4 p-3 rounded ${
                        message.type === "success" ? "bg-green-500" : "bg-red-500"
                      } text-white`}
                    >
                      {message.text}
                    </div>
                  )}
                  <form id="bookingForm" onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          name="firstName"
                          type="text"
                          placeholder="First Name"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.firstName ? "border-red-500" : ""
                          }`}
                        />
                        {errors.firstName && (
                          <span className="text-red-500 text-xs">
                            {errors.firstName}
                          </span>
                        )}
                      </div>
                      <div>
                        <Input
                          name="lastName"
                          type="text"
                          placeholder="Last Name"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.lastName ? "border-red-500" : ""
                          }`}
                        />
                        {errors.lastName && (
                          <span className="text-red-500 text-xs">
                            {errors.lastName}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          name="email"
                          type="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.email ? "border-red-500" : ""
                          }`}
                        />
                        {errors.email && (
                          <span className="text-red-500 text-xs">
                            {errors.email}
                          </span>
                        )}
                      </div>
                      <div>
                        <Input
                          name="mobileno"
                          type="tel"
                          placeholder="Phone Number"
                          value={formData.mobileno}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.mobileno ? "border-red-500" : ""
                          }`}
                        />
                        {errors.mobileno && (
                          <span className="text-red-500 text-xs">
                            {errors.mobileno}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Select
                          name="propertyType"
                          value={formData.propertyType}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.propertyType ? "border-red-500" : ""
                          }`}
                          placeholder="Property Type"
                        >
                          {propertyTypes.map((type) => (
                            <SelectItem
                              key={type.name.toLowerCase()}
                              value={type.name.toLowerCase()}
                            >
                              {type.name}
                            </SelectItem>
                          ))}
                        </Select>
                        {errors.propertyType && (
                          <span className="text-red-500 text-xs">
                            {errors.propertyType}
                          </span>
                        )}
                      </div>
                      <div>
                        <Select
                          name="eventType"
                          value={formData.eventType}
                          onChange={handleChange}
                          className={`bg-[#fff] text-[#333] border-0 ${
                            errors.eventType ? "border-red-500" : ""
                          }`}
                          placeholder="Event Type"
                        >
                          {eventTypes.map((type) => (
                            <SelectItem
                              key={type.name.toLowerCase()}
                              value={type.name.toLowerCase()}
                            >
                              {type.name}
                            </SelectItem>
                          ))}
                        </Select>
                        {errors.eventType && (
                          <span className="text-red-500 text-xs">
                            {errors.eventType}
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <DateRangePicker
                        className={`bg-[#fff] text-[#333] border-0 ${
                          errors.eventDate ? "border-red-500" : ""
                        }`}
                        label="Event Duration"
                        onChange={(range) => {
                          if (range?.start && range?.end) {
                            setFormData((prev) => ({
                              ...prev,
                              eventStartDate: new Date(
                                range.start.year,
                                range.start.month - 1,
                                range.start.day
                              ).toISOString(),
                              eventEndDate: new Date(
                                range.end.year,
                                range.end.month - 1,
                                range.end.day
                              ).toISOString(),
                            }));
                          }
                        }}
                        calendarProps={{
                          classNames: {
                            base: "bg-background",
                            headerWrapper: "pt-4 bg-background",
                            prevButton:
                              "border-1 border-default-200 rounded-small",
                            nextButton:
                              "border-1 border-default-200 rounded-small",
                            gridHeader:
                              "bg-background shadow-none border-b-1 border-default-100",
                            cellButton: [
                              "data-[today=true]:bg-default-100",
                              "data-[selected=true]:bg-transparent rounded-small",
                            ],
                          },
                        }}
                      />
                      {errors.eventDate && (
                        <span className="text-red-500 text-xs">
                          {errors.eventDate}
                        </span>
                      )}
                    </div>
                    <div>
                      <Textarea
                        name="notes"
                        placeholder="Tell us about your vision for the perfect day..."
                        value={formData.notes}
                        onChange={handleChange}
                        className={`text-[#333] border-0 resize-none min-h-[120px] ${
                          errors.notes ? "border-red-500" : ""
                        }`}
                      />
                      {errors.notes && (
                        <span className="text-red-500 text-xs">
                          {errors.notes}
                        </span>
                      )}
                    </div>
                  </form>
                </div>
                <div className="border-t p-4 bg-white">
                  <Button
                    type="submit"
                    form="bookingForm"
                    disabled={loading}
                    className="w-full bg-hotel-primary text-white py-3 rounded-md text-lg font-medium hover:bg-hotel-primary/90 transition-colors"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      "Submit Booking Request"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
