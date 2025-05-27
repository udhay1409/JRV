import { motion, AnimatePresence } from 'framer-motion';
import { IoClose } from "react-icons/io5";
import { IoChevronBackSharp, IoChevronForwardSharp } from "react-icons/io5";

export default function GalleryView({ images, isOpen, onClose, currentIndex, setCurrentIndex }) {
  if (!isOpen) return null;

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <div className="fixed inset-0 bg-black/90" onClick={onClose} />
      
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <div className="relative w-full max-w-5xl">
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 p-2 text-white hover:bg-white/10 rounded-full"
          >
            <IoClose className="h-6 w-6" />
          </button>

          <div className="relative aspect-[16/9]">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0"
              >
                <img
                  src={images[currentIndex]?.src || ''}
                  alt={images[currentIndex]?.alt || ''}
                  className="w-full h-full object-contain"
                />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="absolute inset-y-0 left-0 flex items-center">
            <button
              onClick={handlePrevious}
              className="p-2 m-4 text-white hover:bg-white/10 rounded-full"
            >
              <IoChevronBackSharp className="h-8 w-8" />
            </button>
          </div>

          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              onClick={handleNext}
              className="p-2 m-4 text-white hover:bg-white/10 rounded-full"
            >
              <IoChevronForwardSharp className="h-8 w-8" />
            </button>
          </div>

          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
