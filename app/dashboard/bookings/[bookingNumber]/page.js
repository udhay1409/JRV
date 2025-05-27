'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import GuestProfile from "../../../../Components/Hotel/guestProfile/GuestProfile"
import { usePagePermission } from "../../../../hooks/usePagePermission"

const ViewBookingPage = ({ params }) => {
  const hasPermission = usePagePermission("Bookings", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return null;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Guest Profile" />
      </div>
      <div className="flex">
        <main className="flex-1 p-6">
          <GuestProfile params={params} />
        </main>
      </div>
    </>
  );
};

export default ViewBookingPage;
