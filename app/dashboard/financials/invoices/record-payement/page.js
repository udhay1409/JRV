"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader";
import RecordPayement from "../../../../../Components/Invoice/RecordPayement.jsx";
import { usePagePermission } from "../../../../../hooks/usePagePermission";

const InvoicesPage = () => {
  const hasFinancialsPermission = usePagePermission('Financials/Invoices/record-payement', 'view');
  const hasBookingsAddPermission = usePagePermission('bookings', 'add');
  const router = useRouter();

  // Check if user has either permission
  const hasPermission = hasFinancialsPermission || hasBookingsAddPermission;

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
        <DashboardHeader headerName="Invoices" />
      </div>
      <RecordPayement />
    </>
  );
};

export default InvoicesPage;
