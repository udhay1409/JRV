"use client";
import React, { useState, useEffect } from "react";

import { usePathname } from "next/navigation";
import Navbar from "../navbar/Navbar";
import Footer from "../footer/Footer";
import RoomSkeleton from "../Rooms/RoomSkeleton"; // Add this import

export default function NavigationWrapper({ children }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith("/dashboard");
  const [hotelData, setHotelData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

  useEffect(() => {
    const fetchHotelData = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${baseUrl}/api/hotelDetails`);
        const data = await response.json();
        if (data.success) {
          setHotelData(data.hotelData);
        }
      } catch (error) {
        console.error("Error fetching hotel data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHotelData();
  }, [baseUrl]);

  // Only pass logoUrl if it's a valid string
  const logoUrl = hotelData?.logo || null;

  if (isLoading) {
    // Show RoomSkeleton only on room-related pages
    if (pathname === "/rooms" || pathname?.startsWith("/rooms/")) {
      return <RoomSkeleton />;
    }
    // Show simple loading spinner for other pages
    return null;
  }

  return (
    <>
      {!isDashboard && <Navbar logoUrl={logoUrl} />}
      {children}
      {!isDashboard && <Footer logoUrl={logoUrl} />}
    </>
  );
}
