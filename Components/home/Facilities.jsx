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
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#444] mb-4 sm:mb-6">Venue Overview</h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#555] mb-4 sm:mb-6">
            Our centrally air-conditioned event hall is a masterpiece of space and style. With a capacity to accommodate
            up to 1000 guests, it features luxurious décor, customizable stage arrangements, modern lighting, and
            premium audio-visual support. Whether it&apos;s a traditional wedding or a modern gathering, the ambiance fits
            all themes.
          </p>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">Modern infrastructure</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">Elegant stage & decor</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">Individual rooms available for Groom, Bride, Family & Guests</span>
            </div>
          </div>
        </div>
      </section>

      {/* Room Overview Section */}
      <section className="flex flex-col md:flex-row-reverse gap-6 sm:gap-8 md:gap-0">
        <div className="w-full md:w-1/2 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px]">
          <Image
            src="home/2.jpg"
            alt="Luxury hotel room with bed and seating area"
            width={800}
            height={600}
            className="w-full h-full object-cover rounded-lg md:rounded-none"
            priority
          />
        </div>
        <div className="w-full md:w-1/2 p-4 sm:p-6 md:p-8 lg:p-12 xl:p-16 flex flex-col justify-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium text-[#444] mb-4 sm:mb-6">Room Overview</h2>
          <p className="text-sm sm:text-base lg:text-lg text-[#555] mb-4 sm:mb-6">
            Our well-maintained rooms are available for individual travelers and tourists looking for a cozy and
            affordable stay. Whether you&apos;re here for an event or exploring the city, our rooms are designed to give you
            the comfort you need.
          </p>
          <div className="space-y-2 sm:space-y-3 md:space-y-4">
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">Air Conditioning</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">24/7 Water Supply</span>
            </div>
            <div className="flex items-center">
              <Check className="text-[#555] mr-2 h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm sm:text-base lg:text-lg text-[#555]">Neatly Furnished Beds</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
