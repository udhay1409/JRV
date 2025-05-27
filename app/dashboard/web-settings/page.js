'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader"
import Settings from "../../../Components/web-settings/Settings"
import { usePagePermission } from "../../../hooks/usePagePermission"

const SettingsPage = () => {
  const hasPermission = usePagePermission('web-settings', 'view')
  const router = useRouter()

  if (hasPermission === null) {
    return <div>Loading...</div>
  }

  if (hasPermission === false) {
    router.push('/dashboard/unauthorized')
    return null
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Web Settings"} />
      </div>
      <Settings />
    </section>
  )
}

export default SettingsPage
