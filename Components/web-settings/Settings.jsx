"use client";

import React, { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import General from "./general/General";
import Gallery from "./gallery/Gallery";
import Seo from "./seo/Seo";
import { usePagePermission } from "../../hooks/usePagePermission";

export default function HotelManagementInterface() {
  const [selectedTab, setSelectedTab] = useState("general");
  const hasAddPermission = usePagePermission("web-settings", "add");
  const hasEditPermission = usePagePermission("web-settings", "edit");
  const hasDeletePermission = usePagePermission("web-settings", "delete");

  const tabs = [
    { key: "general", title: "General Settings" },
    { key: "gallery", title: "Gallery" },
    { key: "seo", title: "SEO" },
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
            <General 
              hasAddPermission={hasAddPermission}
              hasEditPermission={hasEditPermission}
              hasDeletePermission={hasDeletePermission}
            />
          )}
          {/* {selectedTab === "email" && <EmailConfiguration />} */}
          {selectedTab === "gallery" && (
            <Gallery 
              hasAddPermission={hasAddPermission}
              hasEditPermission={hasEditPermission}
              hasDeletePermission={hasDeletePermission}
            />
          )}
          {selectedTab === "seo" && (
            <Seo 
              hasAddPermission={hasAddPermission}
              hasEditPermission={hasEditPermission}
            />
          )}
        </div>
      </div>
    </section>
  );
}
