import { Button } from "@heroui/button";
import { Modal, ModalContent } from "@heroui/modal";
import Image from "next/image";
import { useState } from "react";
import { FaUsers, FaChevronRight, FaChevronLeft, FaBed } from "react-icons/fa";
import { amenityIcons } from "../../utils/amenityIcons";
import { MdFreeBreakfast, MdLunchDining, MdDinnerDining } from "react-icons/md";
import { GiCakeSlice } from "react-icons/gi";
import "./RoomDetails.css";

const complementaryFoodIcons = {
  Breakfast: <MdFreeBreakfast className="w-4 h-4 md:w-5 md:h-5  text-black" />,
  Lunch: <MdLunchDining className="w-4 h-4 md:w-5 md:h-5 text-black" />,
  Dinner: <MdDinnerDining className="w-4 h-4 md:w-5 md:h-5 text-black" />,
  Snacks: <GiCakeSlice className="w-4 h-4 md:w-5 md:h-5 text-black" />,
};

const RoomDetails = ({ room, isModal = false }) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPreviewOpen, setPreviewOpen] = useState(false);

  const images = [room?.mainImage, ...(room?.thumbnailImages || [])];

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setPreviewOpen(true);
  };

  const prevImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1
    );
  };

  const nextImage = () => {
    setSelectedImageIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1
    );
  };

  if (!room) {
    return <div>No room selected</div>;
  }

  return (
    <div
      className={` ${
        isModal ? "" : "room-details-bg border rounded-lg shadow-sm p-3 md:p-4"
      }`}
    >
      <h2 className="text-base md:text-lg font-semibold mb-4">
        {room?.name} Room
      </h2>

      {/* Image Gallery */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <div className="col-span-4 md:col-span-3 aspect-video relative">
          <Image
            src={room?.mainImage}
            alt={room?.name}
            fill
            className="object-cover rounded-lg cursor-pointer"
            onClick={() => handleImageClick(0)}
            priority
          />
        </div>
        <div className="col-span-4 md:col-span-1 grid grid-cols-4 md:grid-cols-1 gap-2">
          {room?.thumbnailImages?.slice(0, 3).map((image, index) => (
            <div key={index} className="aspect-video relative">
              <Image
                src={image}
                alt={`Room ${index + 1}`}
                fill
                className="object-cover rounded-lg cursor-pointer"
                onClick={() => handleImageClick(index + 1)}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Room Specifications */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm md:text-base">{room?.size} m²</span>
        </div>
        <div className="flex items-center gap-2">
          <FaBed className="w-4 h-4" />
          <span className="text-sm md:text-base">{room?.bedModel}</span>
        </div>
        <div className="flex items-center gap-2">
          <FaUsers className="w-4 h-4" />
          <span className="text-sm md:text-base">{room?.maxGuests} guests</span>
        </div>
      </div>

      {/* Description */}
      <div className="mb-6">
        <p className="text-sm md:text-base text-gray-600 whitespace-pre-line">
          {room?.description}
        </p>
      </div>

      {/* Complementary Foods */}
      {room.complementaryFoods && room.complementaryFoods.length > 0 && (
        <div className="mb-6">
          <h4 className="font-semibold text-base md:text-lg mb-3">
            Complementary Foods
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {room.complementaryFoods.map((food, index) => (
              <div key={index} className="flex items-center gap-2 text-sm">
                <span className="text-gray-500">
                  {complementaryFoodIcons[food]}
                </span>
                <span>{food}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Facilities */}
      <div className="space-y-3">
        <h4 className="font-semibold text-base md:text-lg">Facilities</h4>
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {room?.amenities?.map((amenity, index) => {
            const IconComponent = amenityIcons[amenity.name];
            return (
              <li
                key={index}
                className="flex items-center gap-2 text-sm md:text-base"
              >
                {IconComponent && (
                  <IconComponent className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                )}
                <span>{amenity.name}</span>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Image Preview Modal */}
      <Modal
        isOpen={isPreviewOpen}
        onClose={() => setPreviewOpen(false)}
        size="full"
        className="image-preview-modal bg-black/90"
        hideCloseButton // Add this line to hide the default close button
      >
        <ModalContent className="relative bg-transparent max-w-7xl mx-auto h-screen flex items-center justify-center">
          {(onClose) => (
            <>
              {/* Navigation buttons */}
              <div className="fixed inset-x-0 flex items-center justify-between px-4 z-50">
                <Button
                  isIconOnly
                  onClick={prevImage}
                  className="bg-black/50 text-white hover:bg-black/70 w-10 h-10 min-w-0"
                >
                  <FaChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  isIconOnly
                  onClick={nextImage}
                  className="bg-black/50 text-white hover:bg-black/70 w-10 h-10 min-w-0"
                >
                  <FaChevronRight className="w-5 h-5" />
                </Button>
              </div>

              {/* Close button */}
              <Button
                isIconOnly
                className="fixed top-4 right-4 bg-black/50 text-white hover:bg-black/70 z-[60]"
                onClick={onClose}
              >
                ✕
              </Button>

              {/* Image container */}
              <div className="w-full h-full max-h-[90vh] relative flex items-center justify-center p-4">
                <div className="relative w-full h-full max-w-5xl">
                  <Image
                    src={images[selectedImageIndex]}
                    alt={`Room preview ${selectedImageIndex + 1}`}
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
              </div>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
};

export default RoomDetails;
