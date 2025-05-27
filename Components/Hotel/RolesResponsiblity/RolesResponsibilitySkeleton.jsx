import { Skeleton } from "@heroui/skeleton";

export default function RolesResponsibilitySkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-15xl border rounded-lg bg-white shadow-sm">
      <main>
        {/* Role Input Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-6 w-20 mb-2" />
          <Skeleton className="h-10 max-w-md" />
        </div>

        {/* Permissions Table Skeleton */}
        <div className="mb-6">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  <th className="p-2">
                    <Skeleton className="h-6 w-24" />
                  </th>
                  {[1, 2, 3, 4].map((i) => (
                    <th key={i} className="p-2">
                      <Skeleton className="h-6 w-16 mx-auto" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((row) => (
                  <tr key={row} className="border-b">
                    <td className="p-2">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    {[1, 2, 3, 4].map((col) => (
                      <td key={col} className="p-2">
                        <Skeleton className="h-6 w-6 mx-auto rounded" />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Button Skeleton */}
        <Skeleton className="h-10 w-24 mb-8" />

        {/* Roles List Skeleton */}
        <div>
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-blue-50">
                  {["No", "Role", "Permissions", "Action"].map((header) => (
                    <th key={header} className="p-2">
                      <Skeleton className="h-6 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map((row) => (
                  <tr key={row} className="border-b">
                    <td className="p-2">
                      <Skeleton className="h-6 w-8" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-6 w-24" />
                    </td>
                    <td className="p-2">
                      <Skeleton className="h-6 w-48" />
                    </td>
                    <td className="p-2 text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
