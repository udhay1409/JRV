"use client";

import React from "react";
import BankPage from "@/Components/Bank/BankPage";
import BankEntryPage from "@/Components/Bank/BankEntryPage";
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { usePagePermission } from "@/hooks/usePagePermission";
import TableSkeleton from "@/Components/ui/TableSkeleton";

export default function Bank() {
  const hasPermission = usePagePermission("Financials/Bank", "view");
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
 

  if (hasPermission === null) {
    return <TableSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return <div>{tab === "entry" ? <BankEntryPage /> : <BankPage />}</div>;
}
