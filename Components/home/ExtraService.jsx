"use client";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import BookingModal from "./BookingModal";
import GalleryView from "./GalleryView";
import { useState, useEffect } from "react";
import axios from "axios";

export default function ExtraService() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [galleryImages, setGalleryImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchGalleryImages = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/web-settings/gallery');
        const shuffled = response.data
          .sort(() => 0.5 - Math.random())
          .slice(0, 6)
          .map(image => ({
            src: image.url,
            alt: image.name,
            span: "md:col-span-4",
          }));
        setGalleryImages(shuffled);
      } catch (error) {
        setError('Failed to load images');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGalleryImages();
  }, []);

  return (
    <motion.section
      className="py-12 sm:py-16 md:py-20 bg-gradient-to-b from-white to-gray-50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 md:mb-8">
          <div className="mb-4 md:mb-0">
            <p className="text-sm text-hotel-primary mb-1">Best </p>
            <h2 className="text-3xl md:text-4xl font-serif">
            Gallery – A Glimpse of Grandeur
            </h2>
          </div>
          <p className="text-sm text-gray-500 max-w-lg mb-4 md:mb-0 md:text-right">
          Gallery – A Glimpse of Grandeur
          </p>
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
              BOOK NOW{" "}
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 
                transition-transform duration-300 group-hover:scale-x-100"
              />
            </span>
          </button>
        </div>

        <AnimatePresence>
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-hotel-primary"/>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">{error}</div>
          ) : (
            <div className="grid grid-cols-12 gap-4 md:gap-6">
              {galleryImages.map((image, index) => (
                <motion.div
                  key={index}
                  className={`col-span-12 ${image.span} aspect-[4/3] relative overflow-hidden group`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 33vw"
                    className="object-cover transition-all duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-sm opacity-90">Click to view gallery</p>
                    </div>
                  </div>
                  <motion.div 
                    className="absolute inset-0 cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                    onClick={() => {
                      setSelectedImageIndex(index);
                      setIsGalleryOpen(true);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>

        <BookingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />

        <GalleryView
          images={galleryImages}
          isOpen={isGalleryOpen}
          onClose={() => setIsGalleryOpen(false)}
          currentIndex={selectedImageIndex}
          setCurrentIndex={setSelectedImageIndex}
        />
      </div>
    </motion.section>
  );
}
