const GuestProfileSkeleton = () => {
  return (
    <div className="min-h-screen p-4 font-sans animate-pulse">
      <div className="row">
        {/* Left Column - Profile Section */}
        <div className="col-lg-3 col-md-3 col-sm-12">
          <div className="bg-white rounded-lg p-6 h-100">
            {/* Profile Header */}
            <div className="flex justify-between items-center mb-4">
              <div className="h-6 bg-gray-200 rounded w-24"></div>
            </div>

            {/* Profile Image and Name */}
            <div className="flex items-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gray-200 mr-4"></div>
              <div>
                <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="mb-4">
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-full"></div>
            </div>

            {/* Personal Information */}
            <div className="border-t pt-4">
              <div className="h-5 bg-gray-200 rounded w-40 mb-3"></div>
              <div className="grid grid-cols-2 gap-2">
                {[...Array(8)].map((_, index) => (
                  <div key={index} className="h-4 bg-gray-200 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Booking Info */}
        <div className="col-lg-9 col-md-9 col-sm-12">
          <div className="bg-white rounded-lg p-6 h-100">
            <div className="row">
              {/* Booking Information */}
              <div className="col-lg-8 col-md-12 col-sm-12">
                <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
                <div className="h-8 bg-gray-200 rounded w-24 mb-4"></div>
                <div className="h-5 bg-gray-200 rounded w-48 mb-4"></div>

                {/* Guest Info Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index}>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-32"></div>
                    </div>
                  ))}
                </div>

                {/* Dates Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                  {[...Array(3)].map((_, index) => (
                    <div key={index}>
                      <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
                      <div className="h-5 bg-gray-200 rounded w-36"></div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Room Info */}
              <div className="col-lg-4 col-md-12 col-sm-12">
                <div className="bg-gray-100 rounded-lg p-6 mt-6">
                  <div className="h-6 bg-gray-200 rounded w-24 mb-4"></div>
                  <div className="bg-gray-200 rounded-lg h-48 mb-4"></div>
                  <div className="space-y-2">
                    {[...Array(6)].map((_, index) => (
                      <div key={index} className="flex justify-between">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-20"></div>
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
};

export default GuestProfileSkeleton;
