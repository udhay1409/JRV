'use client'

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import LogBook from "../../../Components/logBook/logBook";
import { usePagePermission } from "../../../hooks/usePagePermission";
import LogBookSkeleton from "../../../Components/logBook/LogBookSkeleton";

const LogBookPage = () => {
  const hasPermission = usePagePermission("LogBook", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <LogBookSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Log Book" />
      </div>
      <LogBook />
    </section>
  );
};

export default LogBookPage;