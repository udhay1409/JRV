"use client";

import React from "react";
import { useRouter } from "next/navigation";
import GuestProfile from "../../../../../Components/Contacts/Guests/GuestsDetails.jsx";
import DashboardHeader from "../../../../../Components/dashboardHeader/DashboardHeader";
import { usePagePermission } from "../../../../../hooks/usePagePermission";

const Page = ({ params }) => {
  const hasPermission = usePagePermission("contacts/guest", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <div>Loading...</div>;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <section>
      <div className="bgclrrr pt-3">
        <DashboardHeader headerName={"Guest"} />
      </div>
      <GuestProfile guestId={params.guestId} />
    </section>
  );
};

export default Page;
