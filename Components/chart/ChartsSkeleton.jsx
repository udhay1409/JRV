"use client";

import { Card, CardContent, CardHeader } from "@/Components/ui/card";
import { Skeleton } from "@heroui/skeleton";

export default function ChartsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-6" style={{ gridTemplateColumns: '2fr 3fr' }}>
        {/* Booking Status Card with Donut Chart Skeleton */}
        <Card className="p-8 bg-white rounded-xl shadow-sm">
          <div className="flex justify-between items-start mb-8">
            <div className="flex flex-col space-y-0.5">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-[130px] rounded-lg" />
              <Skeleton className="h-11 w-[180px] rounded-lg" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-6">
            {/* Donut Chart Skeleton */}
            <div className="flex items-center justify-center w-[220px] h-[220px] relative">
              <Skeleton className="w-full h-full rounded-full" />
              {/* Center stats */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Skeleton className="h-8 w-16 rounded-lg mb-1" />
                <Skeleton className="h-4 w-24 rounded-lg" />
              </div>
            </div>

            {/* Stats Skeleton */}
            <div className="space-y-6 px-4 min-w-[140px]">
              <div className="space-y-4">
                {[...Array(3)].map((_, index) => (
                  <div key={index} className="flex items-center gap-3 p-2.5">
                    <Skeleton className="w-2.5 h-2.5 rounded-full" />
                    <div>
                      <Skeleton className="h-6 w-16 rounded-lg mb-1" />
                      <Skeleton className="h-4 w-20 rounded-lg" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            </div>
          </div>
        </Card>

        {/* Bookings Overview Card with Bar Chart Skeleton */}
        <Card className="bg-white rounded-xl shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="space-y-1">
              <Skeleton className="h-6 w-32 rounded-lg mb-2" />
              <div className="flex flex-wrap items-center gap-3">
                {[...Array(2)].map((_, index) => (
                  <div key={index} className="flex items-center gap-1.5">
                    <Skeleton className="h-2.5 w-2.5 rounded-sm" />
                    <Skeleton className="h-4 w-16 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Skeleton className="h-11 w-[130px] rounded-lg" />
              <Skeleton className="h-11 w-[180px] rounded-lg" />
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <Skeleton className="w-full h-[240px] rounded-lg" />
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart Skeleton */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-32 rounded-lg" />
          <Skeleton className="h-10 w-[180px] rounded-lg" />
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Centered "Total Revenue" label */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center bg-white border border-gray-200 rounded-md shadow p-3">
              <Skeleton className="h-4 w-24 rounded-lg mb-1" />
              <Skeleton className="h-6 w-32 rounded-lg" />
            </div>
            <Skeleton className="w-full h-[300px] rounded-lg" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 