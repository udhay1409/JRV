import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import RoomDetails from "./RoomDetails";

const RoomPreviewModal = ({
  isOpen,
  onClose,
  room,
  dateRange,
  roomSettings,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-y-0 right-0 max-w-2xl w-full bg-white overflow-y-auto z-50"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between p-4 bg-white ">
              <h2 className="text-xl font-semibold">{room.name}</h2>
              <motion.button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
              >
                <X size={24} />
              </motion.button>
            </div>
            <div className="p-4">
              <RoomDetails
                room={room}
                dateRange={dateRange}
                roomSettings={roomSettings}
                isModal={true}
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default RoomPreviewModal;
