'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import CalendarView from "../../../Components/calendar-view/calendar-view"
import { usePagePermission } from "../../../hooks/usePagePermission";
import CalendarViewSkeleton from "../../../Components/calendar-view/CalendarViewSkeleton";

const CalendarViewPage = () => {
  const hasPermission = usePagePermission("calendar-view", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <CalendarViewSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Calendar View" />
      </div>
      <CalendarView />
    </section>
  );
};

export default CalendarViewPage;