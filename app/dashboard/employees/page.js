'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader"
import Employees from "../../../Components/Hotel/Employess/Employees.jsx"
import { usePagePermission } from "../../../hooks/usePagePermission"
import TableSkeleton from "../../../Components/ui/TableSkeleton.jsx";

const EmployeesPage = () => {
  const hasPermission = usePagePermission("Employees", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <TableSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Employees"} />
      </div>
      <Employees />
    </div>
  );
};

export default EmployeesPage;
