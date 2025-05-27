import { Skeleton } from "@heroui/skeleton";

export default function RoomListSkeleton() {
  return (
    <div className="flex flex-col relative gap-4 w-full">
      <div className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
        <div className="container-fluid w-full p-4">
          {/* Header Skeletons */}
          <div className="flex flex-col sm:flex-row justify-start items-start sm:items-center mb-4 space-y-4 sm:space-y-0 gap-5">
            <Skeleton className="h-10 w-full sm:max-w-xs rounded-lg" />
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-10 w-[300px] rounded-lg" />
              <Skeleton className="h-10 w-40 rounded-lg" />
              <Skeleton className="h-10 w-44 rounded-lg" />
            </div>
          </div>

          {/* Room List and Details Skeleton */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="w-full lg:w-2/4 space-y-4">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="bg-white border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm"
                >
                  <Skeleton className="w-full sm:w-1/4 h-40 rounded-lg" />
                  <div className="flex-1 sm:ml-4 w-full">
                    <Skeleton className="h-6 w-1/3 rounded-lg mb-2" />
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Skeleton className="h-4 w-20 rounded-lg" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                      <Skeleton className="h-4 w-24 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-3/4 rounded-lg mb-2" />
                    <Skeleton className="h-4 w-1/3 rounded-lg" />
                  </div>
                  <div className="text-right mt-4 sm:mt-0">
                    <div className="flex gap-2 mb-10">
                      <Skeleton className="h-8 w-16 rounded-lg" />
                      <Skeleton className="h-8 w-8 rounded-lg" />
                    </div>
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                </div>
              ))}
            </div>

            {/* Room Details Section Skeleton */}
            <div className="w-full lg:w-2/4">
              <div className="bg-hotel-primary-bg border rounded-lg p-4 shadow-sm">
                <Skeleton className="h-8 w-1/3 rounded-lg mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  {[...Array(5)].map((_, index) => (
                    <Skeleton key={index} className="h-4 w-20 rounded-lg" />
                  ))}
                </div>
                <div className="grid grid-cols-11 gap-2 mb-6">
                  {[...Array(22)].map((_, index) => (
                    <Skeleton key={index} className="h-10 w-16 rounded" />
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <Skeleton className="md:col-span-2 h-72 rounded-lg" />
                  <div className="grid grid-cols-3 md:grid-cols-1 gap-2">
                    {[...Array(3)].map((_, index) => (
                      <Skeleton key={index} className="h-[5.5rem] rounded-lg" />
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
