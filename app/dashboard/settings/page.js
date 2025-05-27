'use client'

import React from "react"
import { useRouter } from "next/navigation"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader"
import Settings from "../../../Components/Settings/HotelDetailsForm"
import { usePagePermission } from "../../../hooks/usePagePermission"

const SettingsPage = () => {
  const hasPermission = usePagePermission('settings', 'view')
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
        <DashboardHeader headerName={"Settings"} />
      </div>
      <Settings />
    </section>
  )
}

export default SettingsPage
