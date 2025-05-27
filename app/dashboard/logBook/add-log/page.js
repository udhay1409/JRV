"use client"

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"
import AddLogForm from "../../../../Components/logBook/AddLogForm"
import { usePagePermission } from "../../../../hooks/usePagePermission"
import EditLogFormSkeleton from "../../../../Components/logBook/EditLogFormSkeleton"

const AddLogPage = () => {
  const hasPermission = usePagePermission("LogBook", "add")
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
        <DashboardHeader headerName="Add Log Entry" />
      </div>
      <AddLogForm />
    </section>
  )
}

export default AddLogPage