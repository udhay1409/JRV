"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Input, Textarea } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Button } from "@heroui/button";
import { DateRangePicker } from "@heroui/date-picker";

const ContactForm = () => {
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
  const [dateError, setDateError] = useState("");
  const [propertyTypes, setPropertyTypes] = useState([]);
  const [eventTypes, setEventTypes] = useState([]);

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

  const validateDateRange = (start, end) => {
    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);

      if (startDate.getTime() === endDate.getTime()) {
        return "Start date and end date cannot be the same";
      }
    }
    return "";
  };

  const handleDateRangeChange = (range) => {
    if (!range || !range.start || !range.end) {
      setFormData((prev) => ({
        ...prev,
        eventStartDate: "",
        eventEndDate: "",
      }));
      setDateError("");
      return;
    }

    const startDate = new Date(
      range.start.year,
      range.start.month - 1,
      range.start.day
    );
    const endDate = new Date(
      range.end.year,
      range.end.month - 1,
      range.end.day
    );

    const error = validateDateRange(startDate, endDate);
    if (error) {
      setDateError(error);
      setFormData((prev) => ({
        ...prev,
        eventStartDate: "",
        eventEndDate: "",
      }));
      return;
    }

    setDateError("");
    setFormData((prev) => ({
      ...prev,
      eventStartDate: startDate.toISOString(),
      eventEndDate: endDate.toISOString(),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const dateError = validateDateRange(
      formData.eventStartDate,
      formData.eventEndDate
    );
    if (dateError) {
      setMessage({ type: "error", text: dateError });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await axios.post("/api/crm", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        mobileno: formData.mobileno,
        propertyType: formData.propertyType,
        eventType: formData.eventType,
        eventStartDate: formData.eventStartDate,
        eventEndDate: formData.eventEndDate,
        notes: formData.notes,
      });

      const { data } = response;

      if (data.success) {
        setMessage({ type: "success", text: "Form submitted successfully!" });
        setFormData({
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
      } else {
        setMessage({
          type: "error",
          text: data.message || "Something went wrong",
        });
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to submit form",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#333333] text-white p-6 md:p-8 rounded-md">
      <h2 className="text-2xl font-semibold mb-2">Ready to Book Your Date?</h2>
      <p className="text-gray-300 mb-6">
        Let&apos;s plan your perfect day – together
      </p>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded ${
            message.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          {message.text}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <div>
          <Input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            placeholder="First Name"
            className="bg-[#fff] text-[#333] border-0"
            required
          />
        </div>
        <div>
          <Input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            placeholder="Last Name"
            className="bg-[#fff] text-[#333] border-0"
            required
          />
        </div>
        <div>
          <Input
            type="tel"
            name="mobileno"
            value={formData.mobileno}
            onChange={handleChange}
            placeholder="Phone Number"
            className="bg-[#fff] text-[#333] border-0"
            required
          />
        </div>
        <div>
          <Input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email ID"
            className="bg-[#fff] text-[#333] border-0"
            required
          />
        </div>
        <div>
          <Select
            className="bg-[#fff] text-[#333] border-0 w-full"
            placeholder="Property Type"
            label="Property Type"
            name="propertyType"
            value={formData.propertyType}
            onChange={handleChange}
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
        </div>
        <div>
          <Select
            className="bg-[#fff] text-[#333] border-0 w-full"
            placeholder="Event"
            label="Event Type"
            name="eventType"
            value={formData.eventType}
            onChange={handleChange}
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
        </div>
        <div className="md:col-span-2">
          <DateRangePicker
            calendarProps={{
              classNames: {
                base: "bg-background",
                headerWrapper: "pt-4 bg-background",
                prevButton: "border-1 border-default-200 rounded-small",
                nextButton: "border-1 border-default-200 rounded-small",
                gridHeader:
                  "bg-background shadow-none border-b-1 border-default-100",
                cellButton: [
                  "data-[today=true]:bg-default-100 data-[selected=true]:bg-transparent rounded-small",
                  "data-[range-start=true]:before:rounded-l-small",
                  "data-[selection-start=true]:before:rounded-l-small",
                  "data-[range-end=true]:before:rounded-r-small",
                  "data-[selection-end=true]:before:rounded-r-small",
                  "data-[selected=true]:data-[selection-start=true]:data-[range-selection=true]:rounded-small",
                  "data-[selected=true]:data-[selection-end=true]:data-[range-selection=true]:rounded-small",
                ],
              },
            }}
            className="bg-[#fff] text-[#333] border-0 w-full"
            label="Event Duration"
            onChange={handleDateRangeChange}
          />
          {dateError && (
            <div className="text-red-500 text-sm mt-1">{dateError}</div>
          )}
        </div>
        <div className="md:col-span-2">
          <Textarea
            placeholder="Notes"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className=" text-[#333] border-0 resize-none min-h-[120px]" 
          />
        </div>
        <div className="md:col-span-2">
          <Button
            type="submit"
            disabled={loading}
            className="bg-hotel-primary hover:bg-hotel-primary/90 text-[#404040] font-medium px-8 py-2 h-auto"
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ContactForm;
