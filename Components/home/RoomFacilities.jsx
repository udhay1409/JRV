"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";
import BookingModal from "./BookingModal";

function VenueCard({ mainImage, name, description, amenities, pricing, type, capacity, size, maxGuests }) {
  const details = [
    `${amenities?.map(a => a.name).join(' | ') || 'No amenities'}`,
    "Features",
    type === 'hall' 
      ? `Capacity: ${capacity || 'N/A'} guests | Size: ${size || 'N/A'} sq.ft` 
      : `Max Guests: ${maxGuests || 'N/A'} | Size: ${size || 'N/A'} sq.ft`,
  ];

  return (
    <div className="border border-gray-200 rounded-md overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="h-48 md:h-56 overflow-hidden">
        <img
          src={mainImage}
          alt={name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-medium text-gray-800">{name}</h3>
          <span className="text-sm text-gray-600">
            Price: ₹{pricing?.propertyTypePricing?.room?.originalPrice || pricing?.basePrice}
          </span>
        </div>
        <div className="space-y-1">
          {details.map((detail, index) => (
            <p key={index} className={`text-sm ${index === 1 ? "font-medium mt-2" : "text-gray-600"}`}>
              {detail}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HotelFacilities() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rooms, setRooms] = useState([]);
  const [displayRooms, setDisplayRooms] = useState([]);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await axios.get('/api/rooms');
        if (response.data.success) {
          // Filter only rooms (not halls)
          const allRooms = response.data.rooms.filter(room => room.type === 'room');
          const shuffled = [...allRooms].sort(() => 0.5 - Math.random());
          const selected = shuffled.slice(0, 3);
          setRooms(allRooms);
          setDisplayRooms(selected);
        }
      } catch (error) {
        console.error('Error fetching rooms:', error);
      }
    };
    fetchRooms();
  }, []);

  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-center mb-3">
            Comfortable Rooms & Halls
          </h2>
          <p className="text-sm sm:text-base text-gray-600">
            Stay relaxed and refreshed for every occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayRooms.map((room, index) => (
            <Link href="/rooms" key={room._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <VenueCard {...room} />
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="flex justify-center mt-8">
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
              <span
                className="absolute bottom-0 left-0 w-full h-0.5 bg-white transform scale-x-0 
                  transition-transform duration-300 group-hover:scale-x-100"
              />
            </span>
          </button>
        </div>
      </div>
      <BookingModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}

export { VenueCard };
