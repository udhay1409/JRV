'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import RolesAndResponsibility from "../../../../Components/Hotel/RolesResponsiblity/RolesResponsiblity"
import { usePagePermission } from "../../../../hooks/usePagePermission"

const RolesAndResponsibilityPage = () => {
  const hasPermission = usePagePermission("Employees/roles-responsibility", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <div>Loading...</div>;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Roles & Responsibility"} />
      </div>
      <RolesAndResponsibility />
    </div>
  );
};

export default RolesAndResponsibilityPage;
