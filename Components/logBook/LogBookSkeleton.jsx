"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Skeleton } from "@heroui/skeleton";
import { Card } from "@/Components/ui/card";

export default function LogBookSkeleton() {
  // Create dummy array for skeleton rows
  const skeletonRows = Array(5).fill(null);

  return (
    <div className="container mx-auto p-4 bg-white">
      {/* Metrics Cards Skeleton */}
      <section>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 databoxmain">
          {/* Total Items Issued Today */}
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="databoxback">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
            <div className="py-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>

          {/* Total Item Charges */}
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="databoxback">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
            <div className="py-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>

          {/* Pending Items to Return */}
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="databoxback">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
            <div className="py-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>

          {/* Damage Items Reported */}
          <div className="p-4 rounded-lg shadow bg-white">
            <div className="flex flex-row items-center justify-between pb-2">
              <Skeleton className="h-4 w-32 rounded-lg" />
              <div className="databoxback">
                <Skeleton className="h-4 w-4 rounded-full" />
              </div>
            </div>
            <div className="py-2">
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Working Sheet Logs Table Skeleton */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-6 w-48 rounded-lg" />
          <div className="flex gap-3">
            {/* Search Input Skeleton */}
            <Skeleton className="h-10 w-44 rounded-lg" />

            {/* Status Filter Skeleton */}
            <Skeleton className="h-10 w-[150px] rounded-lg" />

            {/* Date Range Picker Skeleton */}
            <Skeleton className="h-10 w-[280px] rounded-lg" />

            {/* Download Button Skeleton */}
            <Skeleton className="h-10 w-10 rounded-lg" />

            {/* Filter Button Skeleton */}
            <Skeleton className="h-10 w-10 rounded-lg" />

            {/* Add Item Button Skeleton */}
            <Skeleton className="h-10 w-44 rounded-lg" />
          </div>
        </div>

        {/* Table Header Info Skeleton */}
        <div className="flex justify-between items-center mb-4">
          <Skeleton className="h-4 w-32 rounded-lg" />
          <Skeleton className="h-4 w-48 rounded-lg" />
        </div>

        {/* Table Skeleton */}
        <Table aria-label="Loading skeleton table" className="min-h-[400px]">
          <TableHeader>
            <TableColumn>NAME</TableColumn>
            <TableColumn>PROPERTY TYPE</TableColumn>
            <TableColumn>EVENT TYPE</TableColumn>
            <TableColumn>DATE</TableColumn>
            <TableColumn>ISSUED ITEMS</TableColumn>
            <TableColumn>STATUS</TableColumn>
            <TableColumn>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <div className="flex flex-col">
                    <Skeleton className="h-4 w-32 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <Skeleton className="h-4 w-28 rounded-lg mb-1" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 justify-center">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-8 w-8 rounded-lg" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Bottom Pagination Skeleton */}
        <div className="py-2 px-2 flex justify-between items-center">
          <Skeleton className="h-4 w-[200px] rounded-lg" />
          <Skeleton className="h-8 w-[200px] rounded-lg" />
        </div>
      </div>
    </div>
  );
} 