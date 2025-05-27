"use client"

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader"
import AddLogForm from "../../../../../Components/logBook/AddLogForm"
import { usePagePermission } from "../../../../../hooks/usePagePermission"
import EditLogFormSkeleton from "../../../../../Components/logBook/EditLogFormSkeleton"

const EditLogPage = ({ params }) => {
  const hasPermission = usePagePermission("LogBook", "edit")
  const router = useRouter()

  if (hasPermission === null) {
    return <EditLogFormSkeleton />
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized")
    return null
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Edit Log Entry" />
      </div>
      <AddLogForm logId={params.logid} />
    </section>
  )
}

export default EditLogPage