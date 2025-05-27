"use client";

import { Skeleton } from "@heroui/skeleton";
import { Button } from "@heroui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function CalendarViewSkeleton() {
  // Create dummy arrays for calendar grid
  const weekDays = Array(7).fill(null);
  const calendarDays = Array(35).fill(null);
  const weeklyScheduleDays = Array(7).fill(null);
  const timeSlots = Array(5).fill(null);

  return (
    <div className="flex bg-gray-900">
      <div className="flex-1 flex flex-col bg-white">
        <div className="grid grid-cols-[300px,1fr] gap-4 m-4">
          {/* Occasions Calendar Section */}
          <div className="bg-gray-50 rounded-lg p-6">
            {/* Month Navigation */}
            <div className="flex items-center gap-4 mb-4">
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Skeleton className="h-6 w-32 rounded-lg" />
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Week days */}
              {weekDays.map((_, index) => (
                <div key={`weekday-${index}`} className="h-8 flex items-center justify-center">
                  <Skeleton className="h-4 w-8 rounded-lg" />
                </div>
              ))}

              {/* Calendar days */}
              {calendarDays.map((_, index) => (
                <div key={`day-${index}`} className="aspect-square p-1">
                  <Skeleton className="w-full h-full rounded-lg" />
                </div>
              ))}
            </div>

            {/* Occasions Legend */}
            <div className="mt-6">
              <Skeleton className="h-6 w-24 rounded-lg mb-4" />
              <div className="space-y-3">
                {Array(4).fill(null).map((_, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Skeleton className="w-3 h-3 rounded-full" />
                    <Skeleton className="h-4 w-24 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bookings Schedule Section */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <div className="flex items-center gap-4">
                {/* Month Navigation */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                {/* Category Filter */}
                <Skeleton className="h-10 w-28 rounded-lg" />
              </div>
            </div>

            {/* Weekly Schedule Grid */}
            <div className="mt-4">
              {/* Time slots column */}
              <div className="grid grid-cols-[100px,1fr] gap-4">
                <div className="space-y-4 pt-16">
                  {timeSlots.map((_, index) => (
                    <Skeleton key={`time-${index}`} className="h-24 w-20 rounded-lg" />
                  ))}
                </div>

                {/* Schedule grid */}
                <div className="border rounded-lg">
                  {/* Week days header */}
                  <div className="grid grid-cols-7 gap-1 p-4 border-b">
                    {weeklyScheduleDays.map((_, index) => (
                      <div key={`schedule-day-${index}`} className="text-center">
                        <Skeleton className="h-6 w-20 mx-auto rounded-lg mb-2" />
                        <Skeleton className="h-4 w-16 mx-auto rounded-lg" />
                      </div>
                    ))}
                  </div>

                  {/* Time slots grid */}
                  <div className="grid grid-cols-7 gap-1 p-4">
                    {Array(35).fill(null).map((_, index) => (
                      <div key={`slot-${index}`} className="aspect-square p-1">
                        <Skeleton className="w-full h-full rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 