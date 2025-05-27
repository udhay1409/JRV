import Image from "next/image"
import { Check } from "lucide-react"

export default function Home() {
  return (
    <main className="flex flex-col bg-[#FFE9E9]  mx-auto ">
      {/* Venue Overview Section */}
      <section className="flex flex-col md:flex-row gap-6 sm:gap-8 md:gap-0"> 
        <div className="w-full md:w-1/2 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          <Image
            src="home/1.jpg"
            alt="Luxury wedding venue with elegant sofa and floral decorations"
            width={800}
            height={600}
            className="w-full h-full object-cover rounded-lg md:rounded-none"
            priority
          />
        </div>
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-medium text-[#444] mb-4 sm:mb-6">Why Choose JRV Mahal?</h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#555] mb-4 sm:mb-6">
          Because every event deserves the best stage
          </p>
          <div className="space-y-1">
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 w-4  sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">Grand Banquet Halls for 1000+ guests</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base text-[#555]">Centralized air-conditioning</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]"> High-end sound and lighting systems</span>
            </div>

            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">24/7 Power backup</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base text-[#555]">Modern Amenities and Top-Quality Facilities</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base text-[#555]">Customizable Event Solutions</span>
            </div>

            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">Experienced Event Support Team</span>
            </div>



            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base text-[#555]">Luxurious Guest Rooms & Suites</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">Modern Amenities and Top-Quality Facilities</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">Prime Location with Easy Accessibility</span>
            </div>

            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base  text-[#555]">Ample Parking Space & Safety Measures</span>
            </div>
            
          </div>
        </div>
      </section>

    
    </main>
  )
}
