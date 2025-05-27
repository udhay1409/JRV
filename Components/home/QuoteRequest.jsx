"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { DateRangePicker } from "@heroui/date-picker";
import { Select, SelectItem } from "@heroui/select";
import axios from "axios";

export default function QuoteRequest() {
  const [quoteFormData, setQuoteFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobileno: "",
    propertyType: "",
    eventType: "",
    eventStartDate: "",
    eventEndDate: "",
    notes: "",
  });
  const [isQuoteSubmitting, setIsQuoteSubmitting] = useState(false);
  const [quoteSubmitMessage, setQuoteSubmitMessage] = useState("");
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

  const handleQuoteChange = (e) => {
    const { name, value } = e.target;
    setQuoteFormData((prev) => ({
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
      setQuoteFormData((prev) => ({
        ...prev,
        eventStartDate: "",
        eventEndDate: "",
      }));
      setDateError("");
      return;
    }

    const startDate = new Date(range.start.year, range.start.month - 1, range.start.day);
    const endDate = new Date(range.end.year, range.end.month - 1, range.end.day);

    const error = validateDateRange(startDate, endDate);
    if (error) {
      setDateError(error);
      return;
    }

    setDateError("");
    setQuoteFormData((prev) => ({
      ...prev,
      eventStartDate: startDate.toISOString(),
      eventEndDate: endDate.toISOString(),
    }));
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    setIsQuoteSubmitting(true);
    setQuoteSubmitMessage("");

    const dateError = validateDateRange(quoteFormData.eventStartDate, quoteFormData.eventEndDate);
    if (dateError) {
      setQuoteSubmitMessage(dateError);
      setIsQuoteSubmitting(false);
      return;
    }

    try {
      const response = await axios.post("/api/crm", quoteFormData);

      if (response.data.success) {
        setQuoteSubmitMessage("Thank you for your message. We will contact you soon!");
        setQuoteFormData({
          firstName: "",
          lastName: "",
          email: "",
          mobileno: "",
          propertyType: "",
          eventType: "",
          eventStartDate: "",
          eventEndDate: "",
          notes: "",
        });
      } else {
        throw new Error(response.data.message || "Failed to send message");
      }
    } catch (error) {
      setQuoteSubmitMessage(error.message || "There was an error sending your message. Please try again.");
    } finally {
      setIsQuoteSubmitting(false);
    }
  };

  return (
    <motion.section
      className="p-12 sm:py-16 md:py-20 relative"
      initial={{ opacity: 0, y: 50 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 z-0">
        <Image
          src="/contact/1.jpg"
          alt="Background"
          fill
          style={{ objectFit: "cover" }}
          priority
        />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>
      <div className="max-w-7xl mx-auto relative z-10">        <div className="grid md:grid-cols-2 ">
          <div className="relative h-[300px] md:h-auto">
            <div className="absolute inset-0 bg-black/50 z-10"></div>
            <Image
              src="/contact/2.jpg"
              alt="Luxury Room"
              className=""
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              style={{ objectFit: "cover" }}
            />
          </div>
          <div className="p-5 bg-white/90 backdrop-blur-sm">
            <p className="text-hotel-primary uppercase tracking-wider mb-4">
              MAKE AN APPOINTMENT
            </p>
            <h2 className="text-4xl font-serif mb-8">Request A Free Quote</h2>
            {quoteSubmitMessage && (
              <div className={`p-4 mb-6 ${
                quoteSubmitMessage.includes("error")
                  ? "bg-red-100 text-red-800"
                  : "bg-green-100 text-green-800"
              }`}>
                {quoteSubmitMessage}
              </div>
            )}
            <form className="space-y-6" onSubmit={handleQuoteSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="text"
                  name="firstName"
                  value={quoteFormData.firstName}
                  onChange={handleQuoteChange}
                  placeholder="First Name"
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                />
                <input
                  type="text"
                  name="lastName"
                  value={quoteFormData.lastName}
                  onChange={handleQuoteChange}
                  placeholder="Last Name"
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <input
                  type="email"
                  name="email"
                  value={quoteFormData.email}
                  onChange={handleQuoteChange}
                  placeholder="Email Address"
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                />
                <input
                  type="tel"
                  name="mobileno"
                  value={quoteFormData.mobileno}
                  onChange={handleQuoteChange}
                  placeholder="Phone"
                  className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                  required
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Select
                  className="w-full   border-gray-200"
                  placeholder="Property Type"
                  name="propertyType"
                  value={quoteFormData.propertyType}
                  onChange={handleQuoteChange}
                >
                  {propertyTypes.map((type) => (
                    <SelectItem key={type.name.toLowerCase()} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </Select>
                <Select
                  className="w-full  border-gray-200"
                  placeholder="Event Type"
                  name="eventType"
                  value={quoteFormData.eventType}
                  onChange={handleQuoteChange}
                >
                  {eventTypes.map((type) => (
                    <SelectItem key={type.name.toLowerCase()} value={type.name.toLowerCase()}>
                      {type.name}
                    </SelectItem>
                  ))}
                </Select>
              </div>
              <DateRangePicker
                className="w-full  border-gray-200"
                label="Event Duration"
                onChange={handleDateRangeChange}
              />
              {dateError && (
                <div className="text-red-500 text-sm">{dateError}</div>
              )}
              <textarea
                name="notes"
                value={quoteFormData.notes}
                onChange={handleQuoteChange}
                placeholder="Type Your Message"
                rows={4}
                className="w-full border border-gray-200 p-4 focus:outline-none focus:border-hotel-primary"
                required
              ></textarea>
              <button
                type="submit"
                disabled={isQuoteSubmitting}
                className="bg-hotel-primary text-white px-8 py-4 hover:bg-hotel-primary/90 transition uppercase tracking-wider disabled:opacity-70"
              >
                {isQuoteSubmitting ? "Submitting..." : "Submit "}
              </button>
            </form>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
