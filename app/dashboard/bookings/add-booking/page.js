'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import AddBooking from "../../../../Components/Hotel/addBooking/AddBooking"
import { usePagePermission } from "../../../../hooks/usePagePermission"

const AddBookingPage = () => {
  const hasPermission = usePagePermission("Bookings", "add");
  const router = useRouter();

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Add Booking"} />
      </div>
      <AddBooking />
    </div>
  );
};

export default AddBookingPage;
