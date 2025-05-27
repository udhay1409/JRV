"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const testimonials = [
  {
    name: "John D. Alexon",
    role: "Traveler",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
  {
    name: "Zaman D. John",
    role: "Tourist",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
  {
    name: "Mukul Ansari",
    role: "Business",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    comment:
      "Rapideously procrastinate cross-platform intellectual capital after marketing model. Appropriately interactive infrastructures after maintainable are",
  },
];

export default function Testimonials() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const testimonialTimer = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(testimonialTimer);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1
    );
  };

  return (
    <>
      {/* Testimonials Section */}
      <motion.section
        className="py-12 sm:py-16 md:py-20 bg-[#FFE9E9] overflow-hidden"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center mb-12">
            <div>
              <p className="text-gray-600 mb-4 uppercase tracking-wider">
                Your trust, our commitment{" "}
              </p>
              <h2 className="text-4xl font-serif text-gray-800">
                Voices of 
                Happy Clients
              </h2>
            </div>
            <div className="flex gap-4 mt-8 md:mt-0">
              <button
                onClick={prevTestimonial}
                className="w-12 h-12 border border-gray-400 text-gray-600 flex items-center justify-center hover:bg-white hover:border-gray-600 hover:text-gray-800 transition-all duration-300"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-12 h-12 border border-gray-400 text-gray-600 flex items-center justify-center hover:bg-white hover:border-gray-600 hover:text-gray-800 transition-all duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="relative h-[360px] max-w-3xl mx-auto overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial}
                className="absolute w-full"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
              >
                <motion.div
                  className="bg-white shadow-lg p-8 transform transition-all duration-300 hover:scale-[1.02]"
                  whileHover={{ y: -5 }}
                >
                  <div className="mb-8">
                    <div className="text-[#ff9999] text-4xl mb-4">&ldquo;</div>
                    <p className="text-gray-600 leading-relaxed text-lg">
                      {testimonials[currentTestimonial].comment}
                    </p>
                  </div>
                  <motion.div
                    className="flex items-center gap-4"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Image
                      src={testimonials[currentTestimonial].image}
                      alt={testimonials[currentTestimonial].name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium text-lg text-gray-800">
                        {testimonials[currentTestimonial].name}
                      </h4>
                      <p className="text-gray-600">
                        {testimonials[currentTestimonial].role}
                      </p>
                    </div>
                    <div className="ml-auto text-[#ff9999] text-lg">★★★★★</div>
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentTestimonial(index)}
                className={`h-3 transition-all duration-300 ${
                  currentTestimonial === index
                    ? "w-8 bg-[#ff9999]"
                    : "w-3 bg-gray-300 hover:bg-gray-400"
                }`}
              />
            ))}
          </div>
        </div>
      </motion.section>
    </>
  );
}
