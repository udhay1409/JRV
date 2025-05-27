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

export default function TableSkeleton() {
  // Create dummy array for skeleton rows
  const skeletonRows = Array(9).fill(null);

  return (
    <div className="flex flex-col gap-4">
      {/* Top Content Skeleton */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-between gap-2 items-end">
          <h2 className="text-hotel-primary-text font-[500]">Title</h2>
          <div className="flex gap-3">
            {/* Search Input Skeleton */}
            <Skeleton className="rounded-lg">
              <Input className="w-[200px]" disabled />
            </Skeleton>

            {/* Date Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="w-[280px]" disabled>
                {/* Pick a date */}
              </Button>
            </Skeleton>

            {/* Filter Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[120px]" disabled>
                {/* All Status */}
              </Button>
            </Skeleton>

            {/* Column Filter Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[48px]" disabled />
            </Skeleton>

            {/* New Booking Button Skeleton */}
            <Skeleton className="rounded-lg">
              <Button className="min-w-[176px]" disabled>
                {/* New Booking */}
              </Button>
            </Skeleton>
          </div>
        </div>
      </div>

      {/* Table Skeleton */}
      <Table aria-label="Loading skeleton table" className="min-h-[400px]">
        <TableHeader>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
          <TableColumn>COLUMN</TableColumn>
        </TableHeader>
        <TableBody>
          {skeletonRows.map((_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex gap-3 items-center">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <div className="flex flex-col gap-2">
                    <Skeleton className="h-3 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded-lg" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-24 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-16 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-3 w-32 rounded-lg" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-lg" />
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-16 rounded-lg" />
                  <Skeleton className="h-8 w-16 rounded-lg" />
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
  );
}
