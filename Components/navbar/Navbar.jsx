"use client";

import { Menu, X, ChevronDown } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import React, { useState, useEffect } from "react";
import Image from "next/image";

export default function Navbar({ logoUrl }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [roomsDropdown, setRoomsDropdown] = useState(false);
  const [hallsDropdown, setHallsDropdown] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 50;
      setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isActive = (path) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  const getLinkStyles = (path) => {
    return isActive(path) ? "text-hotel-primary" : "hover:text-hotel-primary";
  };

  const renderLogo = () => {
    if (!logoUrl) return null;
    return (
      <Image
        src={logoUrl}
        alt="Hotel Logo"
        width={200}
        height={200}
        className="w-auto h-full max-w-full object-contain opacity-90"
        priority
      />
    );
  };

  return (
    <nav
      className={`w-full md:fixed top-0 z-50 transition-all duration-300 ${
        scrolled ? "fixed bg-white text-black shadow-lg" : "bg-transparent text-white"
      }`}
    >
      <div className="max-w-7xl mx-auto ">
        {/* Mobile Menu Button */}
        <div className="flex items-center justify-between py-4 lg:hidden px-3">
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
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-gray-800 focus:outline-none"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center justify-between py-3">
          <div
            className="flex items-center space-x-16"
            style={{ display: "contents" }}
          >
            <Link
              href={`/`}
              className="logo-container h-16 flex items-center px-4"
            >
              <div className="logo-wrapper relative w-[130px] h-16">
                <div className="absolute inset-0 flex items-center justify-start">
                  {renderLogo()}
                </div>
              </div>
            </Link>
            <div className="flex space-x-8">
              <Link href="/" className={getLinkStyles("/")}>
                HOME
              </Link>
              <Link href="/about" className={getLinkStyles("/about")}>
                ABOUT
              </Link>

              {/* Rooms Dropdown */}
              <div className="relative group">
                <button
                  className="flex items-center space-x-1 group"
                  onMouseEnter={() => setRoomsDropdown(true)}
                  onMouseLeave={() => setRoomsDropdown(false)}
                >
                  <span className={getLinkStyles("/rooms")}>PROPERTY</span>
                  <ChevronDown size={16} />
                </button>
                {roomsDropdown && (
                  <div
                    className="absolute top-full left-0 bg-white/30 backdrop-blur-md hover:text-black shadow-lg rounded-md py-2 w-48"
                    onMouseEnter={() => setRoomsDropdown(true)}
                    onMouseLeave={() => setRoomsDropdown(false)}
                  >
                    <Link
                      href="/hall"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Hall
                    </Link>
                    <Link
                      href="/rooms"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Rooms
                    </Link>
                  </div>
                )}
              </div>

              <Link href="/gallery" className={getLinkStyles("/galley")}>
                GALLERY
              </Link>

              <Link href="/contact" className={getLinkStyles("/contact")}>
                CONTACT
              </Link>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Link
              href="/login"
              className="px-4 py-2 rounded-md hover:text-hotel-primary transition"
            >
              LOGIN
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMenuOpen && (
          <div className="lg:hidden p-4 bg-black text-white">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="hover:text-hotel-primary">
                HOME
              </Link>
              <Link href="/about" className="hover:text-hotel-primary">
                ABOUT
              </Link>

              {/* Mobile Rooms Dropdown */}
              <div className="space-y-2">
                <button
                  onClick={() => setRoomsDropdown(!roomsDropdown)}
                  className="flex items-center justify-between w-full hover:text-hotel-primary"
                >
                  <span>PROPERTY</span>
                  <ChevronDown size={16} />
                </button>
                {roomsDropdown && (
                  <div className="pl-4 space-y-2">
                    <Link
                      href="/hall"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Hall
                    </Link>
                    <Link
                      href="/rooms"
                      className="block px-4 py-2 hover:bg-gray-100"
                    >
                      Rooms
                    </Link>
                  </div>
                )}
              </div>
              <Link href="/gallery" className={getLinkStyles("/galley")}>
                GALLERY
              </Link>

              <Link href="/contact" className="hover:text-hotel-primary">
                CONTACT
              </Link>

              <div className="pt-4 border-t border-gray-800">
                <Link
                  href="/login"
                  className="block text-center hover:text-hotel-primary transition"
                >
                  LOGIN
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
