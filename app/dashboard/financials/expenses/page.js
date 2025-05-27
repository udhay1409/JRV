'use client';

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader";
import Expenses from "../../../../Components/Expenses/Expenses.jsx";
import { usePagePermission } from "../../../../hooks/usePagePermission";
import TableSkeleton from "../../../../Components/ui/TableSkeleton";

const ExpensesPage = () => {
  const hasPermission = usePagePermission("Financials/Expenses", "view");
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
        <DashboardHeader headerName={"Expenses"} />
      </div>
      <Expenses />
    </>
  );
};

export default ExpensesPage;
