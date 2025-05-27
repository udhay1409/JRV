'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader"
import EditBooking from "../../../../../Components/Hotel/EditBooking/Editbooking"
import { usePagePermission } from "../../../../../hooks/usePagePermission"

const Page = ({ params }) => {
  const hasPermission = usePagePermission("Bookings", "edit");
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
        <DashboardHeader headerName={"Edit Booking"} />
      </div>
      <EditBooking params={params} />
    </div>
  );
};

export default Page;
