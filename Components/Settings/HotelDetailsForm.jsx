"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import General from "./General/General";
import EmailConfiguration from "./EmailConfiguration/EmailConfiguration";
import RoomSettings from "./Rooms/RoomSettings";
import InventoryForm from "./Inventory/Inventory";
import FinanceSettings from "./Finance/Finance";
import EmployeeManagement from "./EmployeeManagement/EmployeeManagement";
import Policy from "./Policy/Policy.jsx";
import axios from "axios";
import RazorPayConfig from "./PayementGateway/PayementGateway.jsx";
import CalendarSettings from "./Calendar/CalendarSettings.jsx";

export default function HotelManagementInterface() {
  const [selectedTab, setSelectedTab] = useState("general");

  const [hotelData, setHotelData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/hotelDetails`);
        if (response.data.success) {
          const hotelData = response.data.hotelData;
          setHotelData(hotelData);
        } else {
          setError(response.data.message || "Failed to fetch mahal data.");
        }
      } catch (err) {
        setError(err.message || "An error occurred.");
      } finally {
        setLoading(false);
      }
    };

    fetchHotelData();
  }, []);

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00529C]"></div>
      </div>
    );
  if (error) return <p className="text-red-500 p-4 text-center">{error}</p>;

  const tabs = [
    { key: "general", title: "General" },
    { key: "email", title: "Email Configuration" },
    { key: "property-management", title: "Property Management" },
    { key: "inventory", title: "Inventory" },
    { key: "finance", title: "Finance" },
    { key: "employee", title: "Employee Management" },
    { key: "payementGateway", title: "Payment Gateway" },
    { key: "policy", title: "Policy" },
    { key: "calendar", title: "Calendar" },
  ];

  return (
    <section
      aria-label="Hotel Management Settings"
      className="max-w-[1440px] mx-auto"
    >
      <nav
        aria-label="Settings Navigation"
        className="bg-hotel-primary rounded-lg overflow-x-auto shadow-sm mx-4 lg:mx-6"
      >
        <div className="min-w-max lg:max-w-[70rem] mx-auto">
          <div className="flex flex-nowrap">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSelectedTab(tab.key)}
                className={cn(
                  "px-4 lg:px-6 py-3 lg:py-4 text-sm font-medium transition-colors whitespace-nowrap",
                  selectedTab === tab.key
                    ? "bg-white text-hotel-primary font-[700] rounded-t-lg mt-3"
                    : "text-white hover:bg-hotel-primary"
                )}
              >
                {tab.title}
              </button>
            ))}
          </div>
        </div>
      </nav>

      <div
        className="w-full mx-auto px-4 lg:px-6 pt-1 pb-8"
        role="tabpanel"
        aria-label="Settings Content Panel"
        aria-labelledby={`${selectedTab}-tab`}
      >
        <div className="">
          {selectedTab === "general" && (
            <General initialHotelData={hotelData} />
          )}
          {selectedTab === "email" && <EmailConfiguration />}
          {selectedTab === "property-management" && <RoomSettings />}
          {selectedTab === "inventory" && <InventoryForm />}
          {selectedTab === "finance" && <FinanceSettings />}
          {selectedTab === "employee" && <EmployeeManagement />}
          {selectedTab === "payementGateway" && <RazorPayConfig />}
          {selectedTab === "policy" && <Policy />}
          {selectedTab === "calendar" && <CalendarSettings />}
        </div>
      </div>
    </section>
  );
}
