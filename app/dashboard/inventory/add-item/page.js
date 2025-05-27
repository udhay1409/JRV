"use client"

import React from 'react'
import { useRouter } from "next/navigation"
import { usePagePermission } from "../../../../hooks/usePagePermission"
import AddOrEditInventoryItem from '../../../../Components/inventory/AddOrEditInventoryItem'
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader"

const Page = () => {
  const hasPermission = usePagePermission("Inventory", "add");
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
        <DashboardHeader headerName={"Inventory"} />
      </div>
      <AddOrEditInventoryItem />
    </section>
  );
};

export default Page;
