"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../Components/dashboardHeader/DashboardHeader";
import AddRoom from "../../../../Components/Rooms/AddRoom/AddRoom.jsx";
import { usePagePermission } from "../../../../hooks/usePagePermission";
import AddRoomSkeleton from "../../../../Components/Rooms/AddRoom/AddRoomSkeleton.jsx";

const AddRoomPage = () => {
  const hasPermission = usePagePermission("rooms", "add");
  const router = useRouter();

  if (hasPermission === null) {
    return <AddRoomSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Property Management"} />
      </div>
      <AddRoom />
    </section>
  );
};

export default AddRoomPage;
