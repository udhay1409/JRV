'use client'

import React from 'react'
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import Crm from "../../../Components/CRM/Crm.jsx";
import { usePagePermission } from "../../../hooks/usePagePermission"
import TableSkeleton from "../../../Components/ui/TableSkeleton";

const Page = () => {
  const hasPermission = usePagePermission("crm", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <TableSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"CRM"} />
      </div>
      <Crm />
    </section>
  )
}

export default Page
