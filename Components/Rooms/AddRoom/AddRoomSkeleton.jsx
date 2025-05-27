import { Skeleton } from "@heroui/skeleton";

export default function AddRoomSkeleton() {
  return (
    <div className="flex flex-col relative gap-4 w-full">
      <div className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="w-full">
            <div className="flex justify-between items-center mb-4">
              <Skeleton className="h-8 w-32 rounded-lg" />
              <Skeleton className="h-10 w-20 rounded-lg" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Left Section */}
              <div className="lg:col-span-3 p-4 z-0 bg-content1 rounded-large shadow-small">
                {/* Main Image Skeleton */}
                <Skeleton className="w-full h-[384px] rounded-lg mb-4" />

                {/* Thumbnail Skeletons */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {[...Array(4)].map((_, index) => (
                    <Skeleton key={index} className="h-20 rounded-lg" />
                  ))}
                </div>

                {/* Room Details Skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index}>
                      <Skeleton className="h-4 w-24 mb-2 rounded" />
                      <Skeleton className="h-10 w-full rounded" />
                    </div>
                  ))}
                </div>

                {/* Category and Price Skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {[...Array(4)].map((_, index) => (
                    <div key={index}>
                      <Skeleton className="h-4 w-32 mb-2 rounded" />
                      <Skeleton className="h-10 w-full rounded" />
                    </div>
                  ))}
                </div>

                {/* Room Numbers Section */}
                <div>
                  <Skeleton className="h-4 w-40 mb-2 rounded" />
                  <Skeleton className="h-10 w-full rounded mb-4" />

                  <Skeleton className="h-4 w-32 mb-2 rounded" />
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-9 gap-2">
                    {[...Array(9)].map((_, index) => (
                      <Skeleton key={index} className="h-10 rounded" />
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Section */}
              <div className="lg:col-span-2 p-4 z-0 bg-content1 rounded-large shadow-small">
                {/* Description Skeleton */}
                <Skeleton className="w-full h-32 rounded-lg mb-4" />

                {/* Amenities Sections */}
                {[...Array(3)].map((_, sectionIndex) => (
                  <div key={sectionIndex} className="mb-8">
                    <Skeleton className="h-6 w-32 mb-4 rounded" />
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {[...Array(9)].map((_, index) => (
                        <div
                          key={index}
                          className="flex items-center space-x-2"
                        >
                          <Skeleton className="h-5 w-5 rounded" />
                          <Skeleton className="h-5 w-24 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
