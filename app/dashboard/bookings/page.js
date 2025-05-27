'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import Reservation from "../../../Components/Hotel/Reservation/Reservation";
import { usePagePermission } from "../../../hooks/usePagePermission";

const BookingsPage = () => {
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
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader  headerName={"Bookings"} />
      </div>
      <Reservation />
    </div>
  );
};

export default BookingsPage;
