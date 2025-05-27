'use client';

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../../../Components/dashboardHeader/DashboardHeader";
import AddExpenses from "../../../../../../Components/Expenses/AddExpenses";
import { usePagePermission } from "../../../../../../hooks/usePagePermission";

const EditExpensePage = ({ params }) => {
  const hasPermission = usePagePermission("Financials/Expenses", "edit");
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
        <DashboardHeader headerName={"Expenses"} />
      </div>
      <AddExpenses params={params} />
    </>
  );
};

export default EditExpensePage;
