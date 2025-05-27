import { Skeleton } from "@heroui/skeleton";

export default function EditProfileSkeleton() {
  return (
    <section className="p-4 z-0 flex flex-col relative justify-between gap-4 bg-content1 overflow-auto rounded-large shadow-small w-full">
      <Skeleton className="w-48 h-8 rounded-lg mb-4" />
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Avatar Skeleton */}
          <div className="col-span-1 md:col-span-2 flex items-center space-x-4 justify-center my-4">
            <Skeleton className="w-24 h-24 rounded-full" />
          </div>

          {/* Form Field Skeletons */}
          {[...Array(12)].map((_, index) => (
            <div key={index}>
              <Skeleton className="w-24 h-4 rounded-lg mb-2" />
              <Skeleton className="w-full h-10 rounded-lg" />
            </div>
          ))}

          {/* File Upload Area Skeleton */}
          <div className="col-span-1 md:col-span-2">
            <Skeleton className="w-32 h-4 rounded-lg mb-2" />
            <Skeleton className="w-full h-32 rounded-lg" />
          </div>

          {/* Action Buttons Skeleton */}
          <div className="col-span-1 md:col-span-2 flex justify-end space-x-4 mt-6">
            <Skeleton className="w-24 h-10 rounded-lg" />
            <Skeleton className="w-24 h-10 rounded-lg" />
          </div>
        </div>
      </div>
    </section>
  );
}
