"use client";

import { Skeleton } from "@heroui/skeleton";
// ...existing imports...

const DashboardHeaderSkeleton = () => {
  return (
    <header className="flex flex-col md:flex-row justify-between items-center mb-8 space-y-4 md:space-y-0">
      {/* Hotel Name Skeleton */}
      <Skeleton className="w-48 h-8 md:h-10 rounded-lg" />

      <div className="flex items-center space-x-4">
        {/* Bell Icon Skeleton */}
        <Skeleton className="w-10 h-10 rounded-full" />

        {/* Avatar Skeleton */}
        <Skeleton className="w-8 h-8 md:w-10 md:h-10 rounded-full" />
      </div>
    </header>
  );
};
export default DashboardHeaderSkeleton;
