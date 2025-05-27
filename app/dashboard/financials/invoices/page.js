'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import Invoices from "../../../../Components/Invoice/Invoices"
import { usePagePermission } from "../../../../hooks/usePagePermission"
import TableSkeleton from "../../../../Components/ui/TableSkeleton.jsx";

const InvoicesPage = () => {
  const hasPermission = usePagePermission("Financials/Invoices", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <TableSkeleton />;
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
      <Invoices />
    </>
  );
};

export default InvoicesPage;
