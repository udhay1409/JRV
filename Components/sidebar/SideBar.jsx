"use client";
import React, { useState, useEffect } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "@/Components/ui/sidebar";
import {
  IconLayoutDashboard, // Dashboard
  IconClipboardCheck, // Reservation
  IconHome, // Rooms
  /*   IconSpray, // Housekeeping */
  IconPackage, // Inventory
  IconCash, // Financials
  IconUserCircle, // Concierge
  IconUsersGroup,
  IconUser,
  IconCalendar, // Add this import
  IconNotebook, // Add this import
} from "@tabler/icons-react";

import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { MdOutlineSettings } from "react-icons/md";
import { BiBookContent } from "react-icons/bi";

import "./sidebarr.css";

import { motion } from "framer-motion";

export function SidebarDemo() {
  const [hotelData, setHotelData] = useState(null);

  useEffect(() => {
    const fetchHotelData = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/hotelDetails`
        );
        const data = await response.json();
        if (data.success) {
          setHotelData(data.hotelData);
        }
      } catch (error) {
        console.error("Error fetching hotel data:", error);
      }
    };

    fetchHotelData();
  }, []);

  const links = [
    {
      label: `Dashboard`,
      href: `/dashboard`,
      icon: (
        <IconLayoutDashboard className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Calendar View",
      href: `/dashboard/calendar-view`,
      icon: (
        <IconCalendar className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Contacts",

      icon: (
        <IconUser className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      subLinks: [
        { label: "Guest", href: `/dashboard/contacts/guest` },
        // {
        //   label: "Expenses",
        //   href: `/dashboard/financials/expenses`,
        // },
      ],
    },
    {
      label: "Bookings",
      href: `/dashboard/bookings`,
      icon: (
        <IconClipboardCheck className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Property Management",
      href: `/dashboard/rooms`,
      icon: (
        <IconHome className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Log Book",
      href: `/dashboard/logBook`,
      icon: (
        <IconNotebook className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    // {
    //   label: "Messages",
    //   href: "#",
    //   icon: (
    //     <IconMessage className="text-white dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    //   ),
    // },
    /*  {
      label: "Housekeeping",
      href: `/dashboard/house-keeping`,
      icon: (
        <IconSpray className="text-white dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    }, */
    {
      label: "Inventory",
      href: `/dashboard/inventory`,
      icon: (
        <IconPackage className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Financials",

      icon: (
        <IconCash className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      subLinks: [
        { label: "Invoice", href: `/dashboard/financials/invoices` },
        {
          label: "Expenses",
          href: `/dashboard/financials/expenses`,
        },
        {
          label: "Bank",
          href: `/dashboard/financials/bank`,
        },
        {
          label: "Ledger Book",
          href: `/dashboard/financials/ledger-book`,
        },
      ],
    },
    {
      label: "Staff Management",

      icon: (
        <IconUserCircle className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
      subLinks: [
        { label: "Employee Details", href: `/dashboard/employees` },
        {
          label: "Role",
          href: `/dashboard/employees/roles-responsibility`,
        },
      ],
    },

    {
      label: "CRM",
      href: `/dashboard/crm`,
      icon: (
        <IconUsersGroup className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Web Settings",
      href: `/dashboard/web-settings`,
      icon: (
        <BiBookContent className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Settings",
      href: `/dashboard/settings`,
      icon: (
        <MdOutlineSettings className="text-gray-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    // {
    //   label: "Calendar",
    //   href: "#",
    //   icon: (
    //     <IconCalendar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    //   ),
    // },

    // {
    //   label: "Reviews",
    //   href: "#",
    //   icon: (
    //     <IconStar className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    //   ),
    // },
    // {
    //   label: "Concierge",
    //   href: "#",
    //   icon: (
    //     <IconUserCircle className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
    //   ),
    // },
  ];

  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ x: -100 }}
      animate={{ x: 0 }}
      className={cn(
        "rounded-md flex flex-col bg-white dark:bg-neutral-800 max-w-[250px] border border-neutral-200 dark:border-neutral-700 overflow-hidden h-screen sidebarmain"
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between gap-10">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col flex-1 overflow-y-auto"
          >
            {open ? (
              <Logo hotelData={hotelData} />
            ) : (
              <LogoIcon hotelData={hotelData} />
            )}
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <SidebarLink link={link} />
                </motion.div>
              ))}
            </div>
          </motion.div>
        </SidebarBody>
      </Sidebar>
    </motion.div>
  );
}

export const Logo = ({ hotelData }) => {
  const logoUrl = hotelData?.logo || "/favicon.ico";

  return (
    <Link
      href={`/dashboard`}
      className="logo-container h-16 flex items-center px-4 transition-all duration-300"
    >
      <div className="logo-wrapper relative w-[160px] h-16">
        {/* Fixed height container with flexible width */}
        <div className="absolute inset-0 flex items-center justify-start">
          <Image
            src={logoUrl}
            alt="Hotel Logo"
            width={200}
            height={200}
            className="w-auto h-full max-w-full object-contain"
            priority
          />
        </div>
      </div>
    </Link>
  );
};

export const LogoIcon = ({ hotelData }) => {
  const logoUrl = hotelData?.logo || "/favicon.ico";

  return (
    <Link
      href={`/dashboard`}
      className="logo-container h-16 flex items-center justify-center transition-all duration-300"
    >
      <div className="logo-wrapper relative w-12 h-12">
        {/* Square container for collapsed state */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={logoUrl}
            alt="Hotel Logo"
            width={200}
            height={200}
            className="w-auto h-[32px] max-w-[32px] object-contain"
            priority
          />
        </div>
      </div>
    </Link>
  );
};
