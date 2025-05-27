'use client'

import React from "react"
import { useRouter } from "next/navigation"
import { usePagePermission } from "../../../hooks/usePagePermission"
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader"
import Inventory from '../../../Components/inventory/Inventory'
import TableSkeleton from '../../../Components/ui/TableSkeleton.jsx';

const InventoryPage = () => {
    const hasPermission = usePagePermission("Inventory", "view");
    const router = useRouter();

    if (hasPermission === null) {
        return <TableSkeleton />;
    }

    if (hasPermission === false) {
        router.push("/dashboard/unauthorized");
        return null;
    }

    return (
        <>
            <div className="bgclrrr pt-3">
                <DashboardHeader headerName="Inventory" />
            </div>
            <Inventory />
        </>
    );
};

export default InventoryPage;
