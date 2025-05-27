"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../Components/dashboardHeader/DashboardHeader";
import { usePagePermission } from "../../../hooks/usePagePermission";
import RoomList from "../../../Components/Rooms/RoomList";
import RoomListSkeleton from "../../../Components/Rooms/RoomSkeleton.jsx";

const Page = () => {
  const hasPermission = usePagePermission("Rooms", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <RoomListSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName="Property Management" />
      </div>
      <RoomList />
    </section>
  );
};

export default Page;
