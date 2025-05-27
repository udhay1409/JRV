"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import axios from "axios";

import BookingModal from "./BookingModal";

export default function HeroSection() {
  const [heroData, setHeroData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchHeroData = async () => {
      try {
        const response = await axios.get("/api/web-settings");
        if (
          response.data &&
          response.data.heroSections &&
          response.data.heroSections[0]
        ) {
          setHeroData(response.data.heroSections[0]);
        }
      } catch (error) {
        console.error("Error fetching hero section data:", error);
      }
    };

    fetchHeroData();
  }, []);

  const highlightJrvMahal = (text) => {
    const patterns = [
      "JRV Mahal",
      "jrv mahal",
      "JRV mahal",
      "JRV MAHAL",
      "Jrv Mahal",
      "JRV Mahal",
      "jrv mahal",
      "J R V MAHAL",
      "J.R.V MAHAL",
      "J.R.V. MAHAL",

      // Additional patterns
      "J R V Mahal",
      "j.r.v. mahal",
      "J-R-V Mahal",
      "J R V mahal",
      "jrv-mahal",
      "j.r.v mahal",
      "JRV-MAHAL",
      "J R V Wedding Hall",
      "J R V Convention",
      "JRV Marriage Hall",
    ];

    let result = text;
    patterns.forEach((pattern) => {
      const regex = new RegExp(pattern, "gi");
      result = result.replace(
        regex,
        `<span class="text-hotel-primary font-semibold">${pattern}</span>`
      );
    });

    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  if (!heroData) return null;

  return (
    <div className="relative max-sm:h-[60vh] sm:h-[60vh] md:h-[90vh] lg:h-[90vh]">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${heroData.image})`,
        }}
      />

      {/* Enhanced Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/70" />

      {/* Centered Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center text-center">
        <motion.div
          className=" w-full"
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.h1
            className="text-lg xs:text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl 2xl:text-6xl
              font-serif mb-3 sm:mb-4 md:mb-6 
              text-white 
              leading-snug sm:leading-snug md:leading-tight lg:leading-tight
              px-2 sm:px-4
              font-medium
              tracking-normal sm:tracking-wide
              transition-all duration-300
              max-w-[95%] sm:max-w-[90%] mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {highlightJrvMahal(heroData.title)}
          </motion.h1>

          <motion.p
            className="text-xs xs:text-sm sm:text-base md:text-lg lg:text-xl
              text-white 
              mb-4 sm:mb-6 md:mb-8
              tracking-wider
              font-light sm:font-normal
              px-4 sm:px-6 md:px-8
              leading-relaxed sm:leading-relaxed md:leading-relaxed
              max-w-[90%] sm:max-w-[80%] mx-auto"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            {heroData.quote}
          </motion.p>
          <motion.div
            className="flex justify-center w-full px-2 sm:px-0"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <button
              onClick={() => setIsModalOpen(true)}
              className="w-full xs:w-auto min-w-[140px] max-w-[280px] 
                text-center inline-flex items-center justify-center 
                bg-hotel-primary 
                p-2
                 
                xs:text-sm sm:text-base md:text-lg
                hover:bg-hotel-primary/90 
                transform hover:scale-105 hover:-translate-y-0.5
                transition-all duration-300 ease-out
                text-white font-medium tracking-wide
                shadow-md hover:shadow-2xl 
                rounded-sm sm:rounded
                border-2 border-transparent hover:border-hotel-primary/20"
            >
              Book your dream venue today!
            </button>
          </motion.div>
        </motion.div>
      </div>

      <BookingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
