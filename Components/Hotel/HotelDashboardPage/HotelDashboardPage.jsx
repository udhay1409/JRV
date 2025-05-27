"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import DashboardHeader from "../../dashboardHeader/DashboardHeader";
// import ReservationList from "../../checkIn/CheckIn.jsx";
import { usePagePermission } from "../../../hooks/usePagePermission";
import Charts from "../../../Components/chart/Charts";
import RecentEnquiries from "@/Components/dashboardContents/RecentEnquiries"
import PendingPayments from "@/Components/dashboardContents/PendingPayments"
import DashboardCards from "@/Components/dashboardContents/DashboardCards"

const HotelDashboardPage = ({ params }) => {
  const router = useRouter();
  const hasPermission = usePagePermission("Dashboard", "view");
  const { status } = useSession();

  useEffect(() => {
    if (hasPermission === false) {
      router.push("/dashboard/unauthorized");
    }
  }, [hasPermission, router]);

  if (status === "loading" || hasPermission === null) {
    return <div>Loading...</div>; // Add a proper loading component here
  }

  if (hasPermission === false) {
    return null;
  }

  return (
    <>
      <div className="bgclrrr pt-3">
        <DashboardHeader params={params} />
      </div>
      <div className="flex">
        <main className="flex-1 p-6">
          <div>
            <div>
              {/* <ReservationList /> */}
              <DashboardCards />
              <Charts />
              <RecentEnquiries />
              <PendingPayments />
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default HotelDashboardPage;
