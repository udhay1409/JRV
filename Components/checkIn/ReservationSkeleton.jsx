import React from "react";
import { Skeleton } from "@heroui/skeleton";
import { Card } from "react-bootstrap";

const ReservationSkeleton = () => {
  return (
    <>
      <div className="w-full space-y-5">
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="w-full">
              <Card.Header>
                <Skeleton className="w-3/4 h-4 rounded-lg" />
              </Card.Header>
              <Card.Body>
                <Skeleton className="w-1/2 h-8 rounded-lg mb-4" />
                <Skeleton className="w-full h-4 rounded-lg" />
              </Card.Body>
            </Card>
          ))}
        </div>

        {/* Table Header Skeleton */}
        <div className="flex justify-between mb-4">
          <Skeleton className="w-1/4 h-8 rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="w-[200px] h-10 rounded-lg" />
            <Skeleton className="w-[100px] h-10 rounded-lg" />
            <Skeleton className="w-[150px] h-10 rounded-lg" />
          </div>
        </div>

        {/* Table Skeleton */}
        <div className="w-full">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 mb-4">
              <Skeleton className="w-full h-16 rounded-lg" />
            </div>
          ))}
        </div>

        {/* Pagination Skeleton */}
        <div className="flex justify-between items-center">
          <Skeleton className="w-[100px] h-8 rounded-lg" />
          <Skeleton className="w-[200px] h-8 rounded-lg" />
          <Skeleton className="w-[100px] h-8 rounded-lg" />
        </div>
      </div>
    </>
  );
};

export default ReservationSkeleton;
