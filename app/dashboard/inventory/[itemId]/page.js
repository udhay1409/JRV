"use client"

import React from 'react';
import { useRouter } from "next/navigation"
import { usePagePermission } from "../../../../hooks/usePagePermission"
import ViewInventoryItem from '../../../../Components/inventory/ViewInventoryItem';
import DashboardHeader from '../../../../Components/dashboardHeader/DashboardHeader';

const ViewItemPage = ({ params }) => {
  const hasPermission = usePagePermission("Inventory", "view");
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
        <DashboardHeader headerName="View Inventory Item" />
      </div>
      <ViewInventoryItem itemId={params.itemId} />
    </section>
  );
};

export default ViewItemPage;
