'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "@/Components/dashboardHeader/DashboardHeader"
import AddProfile from "../../../../Components/Hotel/Employess/AddAndEditProfile.jsx"
import { usePagePermission } from "../../../../hooks/usePagePermission"

const AddEmployeePage = ({ params }) => {
  const hasPermission = usePagePermission("Employees", "add");
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
        <DashboardHeader headerName={"Employees"} />
      </div>
      <AddProfile params={params} />
    </div>
  );
};

export default AddEmployeePage;
