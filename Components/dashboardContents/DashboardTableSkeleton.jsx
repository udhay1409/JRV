"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/Components/ui/card";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/table";
import { Skeleton } from "@heroui/skeleton";

export default function DashboardTableSkeleton() {
  // Create dummy array for skeleton rows
  const skeletonRows = Array(5).fill(null); // 5 rows to match the tables' display count

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>
          <Skeleton className="h-6 w-48 rounded-lg" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table
          aria-label="Loading skeleton table"
          className="min-h-[400px]"
        >
          <TableHeader>
            {/* Match the number of columns in Recent Enquiries/Pending Payments */}
            {[...Array(8)].map((_, index) => (
              <TableColumn key={index}>
                <Skeleton className="h-4 w-24 rounded-lg" />
              </TableColumn>
            ))}
          </TableHeader>
          <TableBody>
            {skeletonRows.map((_, rowIndex) => (
              <TableRow key={rowIndex}>
                {/* Customer Name + Booking ID */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-32 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </TableCell>
                {/* Email */}
                <TableCell>
                  <Skeleton className="h-4 w-40 rounded-lg" />
                </TableCell>
                {/* Mobile */}
                <TableCell>
                  <Skeleton className="h-4 w-28 rounded-lg" />
                </TableCell>
                {/* Property Type */}
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </TableCell>
                {/* Event Dates */}
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Skeleton className="h-4 w-28 rounded-lg" />
                    <Skeleton className="h-3 w-24 rounded-lg" />
                  </div>
                </TableCell>
                {/* Event Type */}
                <TableCell>
                  <Skeleton className="h-4 w-24 rounded-lg" />
                </TableCell>
                {/* Notes */}
                <TableCell>
                  <Skeleton className="h-4 w-32 rounded-lg" />
                </TableCell>
                {/* Actions */}
                <TableCell>
                  <div className="flex justify-center gap-2">
                    <Skeleton className="h-8 w-20 rounded-lg" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 