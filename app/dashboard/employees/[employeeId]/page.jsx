"use client";

import React from "react";
import { useRouter } from "next/navigation";
import AddAndEditProfile from "../../../../Components/Hotel/Employess/AddAndEditProfile.jsx";
import { usePagePermission } from "../../../../hooks/usePagePermission";

const EditEmployeePage = ({ params }) => {
  const hasPermission = usePagePermission("Employees", "edit");
  const router = useRouter();

  if (hasPermission === null) {
    return <div>Loading...</div>;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return <AddAndEditProfile params={params} />;
};

export default EditEmployeePage;
