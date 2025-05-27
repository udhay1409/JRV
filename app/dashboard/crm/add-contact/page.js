'use client'

import React from 'react'
import { useRouter } from "next/navigation"
import AddContact from '../../../../Components/CRM/AddContact.jsx'
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader";
import { usePagePermission } from "../../../../hooks/usePagePermission"

const Page = () => {
  const hasPermission = usePagePermission("crm/add-contact", "add");
  const router = useRouter();

  if (hasPermission === null) {
    return null;
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
      <AddContact />
    </section>
  )
}

export default Page
