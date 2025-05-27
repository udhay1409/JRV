"use client";

import { Skeleton } from "@heroui/skeleton";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";

export default function EditLogFormSkeleton() {
  // Create dummy arrays for skeleton rows
  const itemRows = Array(3).fill(null);
  const electricityRows = Array(2).fill(null);
  const damageRows = Array(2).fill(null);

  return (
    <div className="w-full px-4 py-2">
      <div className="p-4 rounded-lg shadow">
        {/* Header section */}
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-48 rounded-lg" />
        </div>

        {/* Form content */}
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Range Skeleton */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-24 rounded-lg" />
              <div className="flex flex-col md:flex-row gap-4">
                <Skeleton className="h-10 w-full rounded-lg" />
                <div className="flex items-center justify-center">
                  <Skeleton className="h-4 w-4" />
                </div>
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Booking Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking ID */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-20 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
              {/* Phone Number */}
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            </div>

            {/* Customer Details */}
            {[...Array(6)].map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-5 w-28 rounded-lg" />
                <Skeleton className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          {/* Items Returned Section */}
          <div className="border-t border-dashed pt-6 mb-8">
            <Skeleton className="h-7 w-32 rounded-lg mb-4" />
            
            <Table aria-label="Loading skeleton table">
              <TableHeader>
                <TableColumn>CATEGORY</TableColumn>
                <TableColumn>SUB CATEGORY</TableColumn>
                <TableColumn>BRAND</TableColumn>
                <TableColumn>MODEL</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>CONDITION</TableColumn>
                <TableColumn>REMARKS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {itemRows.map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(8)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-9 w-full rounded-lg" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-4 mt-4">
              <Skeleton className="h-16 w-28 rounded-lg" />
              <Skeleton className="h-16 w-32 rounded-lg" />
            </div>
          </div>

          {/* Electricity Section */}
          <div className="border-t border-dashed pt-6 mb-8">
            <Skeleton className="h-7 w-44 rounded-lg mb-4" />
            
            <Table aria-label="Loading skeleton table">
              <TableHeader>
                <TableColumn>TYPE</TableColumn>
                <TableColumn>START</TableColumn>
                <TableColumn>END</TableColumn>
                <TableColumn>UNIT TYPE</TableColumn>
                <TableColumn>UNITS</TableColumn>
                <TableColumn>COST/UNIT</TableColumn>
                <TableColumn>TOTAL</TableColumn>
                <TableColumn>REMARKS</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {electricityRows.map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(9)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-9 w-full rounded-lg" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end mt-4">
              <Skeleton className="h-16 w-32 rounded-lg" />
            </div>
          </div>

          {/* Damage/Loss Summary Section */}
          <div className="border-t border-dashed pt-6 mb-8">
            <Skeleton className="h-7 w-44 rounded-lg mb-4" />
            
            <Table aria-label="Loading skeleton table">
              <TableHeader>
                <TableColumn>CATEGORY</TableColumn>
                <TableColumn>SUB CATEGORY</TableColumn>
                <TableColumn>BRAND</TableColumn>
                <TableColumn>MODEL</TableColumn>
                <TableColumn>QUANTITY</TableColumn>
                <TableColumn>CONDITION</TableColumn>
                <TableColumn>REMARKS</TableColumn>
                <TableColumn>AMOUNT</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {damageRows.map((_, index) => (
                  <TableRow key={index}>
                    {[...Array(9)].map((_, cellIndex) => (
                      <TableCell key={cellIndex}>
                        <Skeleton className="h-9 w-full rounded-lg" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex justify-end gap-4 mt-4">
              <Skeleton className="h-16 w-28 rounded-lg" />
              <Skeleton className="h-16 w-32 rounded-lg" />
            </div>
          </div>

          {/* Grand Total Summary */}
          <div className="border-t border-dashed pt-6 mb-8">
            <div className="flex justify-between items-center">
              <Skeleton className="h-7 w-32 rounded-lg" />
              <Skeleton className="h-16 w-40 rounded-lg" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8 border-t border-dashed pt-6">
            <Skeleton className="h-10 w-28 rounded-lg" />
            <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}