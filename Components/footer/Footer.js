"use client";

import React from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Facebook, Twitter, Instagram, Youtube } from "lucide-react";
import Image from "next/image";

export default function Footer({ logoUrl }) {
  const pathname = usePathname();

  const renderLogo = () => {
    if (!logoUrl) return null;

    return (
      <Image
        src={logoUrl}
        alt="Hotel Logo"
        width={200}
        height={200}
        className="w-auto h-full max-w-full object-contain brightness-0 invert opacity-90"
        priority={false}
      />
    );
  };

  const links = [
    { name: "Home", href: "/" },
    { name: "About", href: "/about" },
    { name: "Rooms", href: "/rooms" },
    { name: "Hall", href: "/hall" },
    { name: "Contact", href: "/contact" },
    { name: "Gallery", href: "/gallery" },
  ];

  return (
    <footer className="bg-[#1C1C1C] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
        <div>
          <Link
            href={`/dashboard`}
            className="logo-container h-16 flex items-center px-4 transition-all duration-300"
          >
            <div className="logo-wrapper relative w-[130px] h-16">
              <div className="absolute inset-0 flex items-center justify-start">
                {renderLogo()}
              </div>
            </div>
          </Link>
          <p className="text-gray-400 mb-6 mt-5">
            RV Mahal blends modern comforts with traditional elegance to deliver
            unforgettable experiences. With spacious halls, well-furnished
            rooms, and top-tier amenities, your dream event starts right here.{" "}
          </p>
          <div className="flex space-x-4 pt-4">
            <a href="#" className="hover:text-hotel-primary">
              <Facebook size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Twitter size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Instagram size={20} />
            </a>
            <a href="#" className="hover:text-hotel-primary">
              <Youtube size={20} />
            </a>
          </div>
        </div>

        <div>
          <h4 className="text-lg font-serif mb-4">USEFUL LINKS</h4>
          <ul className="space-y-2 text-gray-400">
            {links.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`${
                    pathname === link.href
                      ? "text-hotel-primary"
                      : "hover:text-hotel-primary"
                  }`}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="text-lg font-serif mb-4">ADDRESS</h4>
          <div className="text-gray-400 space-y-2">
            <p>234, Main Rd,</p>
            <p>Kallidaikurchi </p>
            <p>TamilNadu 627416</p>
            <p>Phone: +91 94896 04545</p>
            <p>Email: vrj@gmail.com</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-16 pt-8 border-t border-gray-800">
        <div className="flex justify-evenly  mb-4">
          <p className="text-start text-gray-400">
            © {new Date().getFullYear()} JRV Mahal. All Rights Reserved.
          </p>
          <Link
            href="/privacy-policy"
            className="text-gray-400 hover:text-hotel-primary"
          >
            Privacy Policy
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href="/payment-policy"
            className="text-gray-400 hover:text-hotel-primary"
          >
            Payment Policy
          </Link>
          <span className="text-gray-400">|</span>
          <Link
            href="/terms-and-conditions"
            className="text-gray-400 hover:text-hotel-primary"
          >
            Terms & Conditions
          </Link>
        </div>
      </div>
    </footer>
  );
}
