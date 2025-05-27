"use client";

import React from "react";
import { useRouter } from "next/navigation";
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader.js";
import AddRoom from "../../../../../Components/Rooms/AddRoom/AddRoom.jsx";
import { usePagePermission } from "../../../../../hooks/usePagePermission";
import AddRoomSkeleton from "../../../../../Components/Rooms/AddRoom/AddRoomSkeleton.jsx";

const Page = ({ params }) => {
  const hasPermission = usePagePermission("rooms", "edit");
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
      <AddRoom params={params} />
    </section>
  );
};

export default Page;
