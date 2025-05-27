"use client";

import { useRouter } from "next/navigation";
import { usePagePermission } from "@/hooks/usePagePermission";
import LedgerBookPage from "@/Components/LedgerBook/LedgerBookPage";
import TableSkeleton from "@/Components/ui/TableSkeleton";

export default function LedgerBook() {
  const hasPermission = usePagePermission("Financials/LedgerBook", "view");
  const router = useRouter();

  if (hasPermission === null) {
    return <TableSkeleton />;
  }

  if (hasPermission === false) {
    router.push("/dashboard/unauthorized");
    return null;
  }

  return (
    <div>
      <LedgerBookPage />
    </div>
  );
}
