"use client";
import Image from "next/image";
import { motion } from "framer-motion";
import { useState } from "react";
import BookingModal from "./BookingModal";

const About = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className="w-full py-16 px-4 md:px-8 lg:px-16 xl:px-0 bg-white"
    >
      <div className="max-w-7xl mx-auto">
        {/* Main content section */}
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <motion.div 
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
            className="w-full lg:w-1/2 text-center lg:text-left px-4 sm:px-6 lg:px-0"
          >
            {/* Brand name with responsive sizing */}
            <h3 className="text-xs sm:text-sm md:text-base text-gray-700 uppercase tracking-wider font-medium mb-2 sm:mb-3 
              relative inline-block after:content-[''] after:absolute after:w-1/2 after:h-0.5 after:bg-hotel-primary 
              after:bottom-0 after:left-1/2 after:-translate-x-1/2 lg:after:left-0 lg:after:translate-x-0"
            >
              HOTEL JRV
            </h3>

            {/* Main heading with dynamic line height and responsive font sizes */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl 
              font-medium text-gray-800 leading-[1.2] sm:leading-[1.3] md:leading-[1.4] 
              tracking-tight mb-4 sm:mb-6 md:mb-8"
            >
              <span className="block">Welcome to JRV Mahal –</span>
              <span className="block mt-1 sm:mt-2 bg-gradient-to-r from-hotel-primary to-hotel-primary
                text-transparent bg-clip-text"
              >
                Where Celebrations Begin
              </span>
            </h1>

            {/* Description text with improved readability */}
            <p className="text-sm sm:text-base md:text-lg text-gray-600 
              max-w-[280px] sm:max-w-lg mx-auto lg:mx-0 
              leading-relaxed sm:leading-relaxed md:leading-loose 
              mb-6 sm:mb-8 md:mb-10"
            >
              At JRV Mahal, we believe that every celebration deserves the
              perfect setting. Whether it&apos;s a grand wedding, an elegant
              reception, or an intimate family function, our venue is designed
              to host moments that matter.
            </p>

            {/* CTA Button with responsive padding and hover effects */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="group relative inline-flex items-center justify-center
                px-6 sm:px-8 py-2.5 sm:py-3 md:py-4
                text-sm sm:text-base md:text-lg font-medium
                text-white bg-hotel-primary
                overflow-hidden  transition-all duration-300
                hover:bg-hotel-primary/90 hover:scale-105
                focus:outline-none focus:ring-2 focus:ring-hotel-primary focus:ring-offset-2"
            >
              <span className="relative">
                BOOK NOW
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 
                  transition-transform duration-300 group-hover:scale-x-100"
                />
              </span>
            </button>
          </motion.div>

          {/* Single Image Design */}
          <div className="w-full lg:w-1/2 relative h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] mt-10 lg:mt-0">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full  relative"
            >
              <div className="relative w-full h-full transform transition-transform duration-300 hover:scale-105">
                <Image
                  src="/contact/3.png"
                  alt="JRV Mahal Venue"
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 40vw"
                  className="object-cover"
                  priority
                />
              </div>
            </motion.div>
            
            {/* Decorative elements */}
            <div className="absolute -left-4 -bottom-4 w-24 h-24 bg-hotel-primary/10 rounded-full z-[-1] hidden sm:block"></div>
            <div className="absolute -right-4 -top-4 w-32 h-32 bg-hotel-primary/10 rounded-full z-[-1] hidden sm:block"></div>
          </div>
        </div>
      </div>

      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </motion.div>
  );
};

export default About;
