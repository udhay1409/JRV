"use client";
import { cn } from "@/lib/utils";
import Link from "next/link";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  IconChevronDown,
  IconMenu2,
  IconX,
  IconChevronRight,
  IconChevronLeft,
} from "@tabler/icons-react"; // Import new icons
import { usePathname } from "next/navigation"; // Import usePathname from next/navigation

const SidebarContext = createContext(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}) => {
  const [openState, setOpenState] = useState(true); // Change initial state to true

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, open, setOpen, animate }) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...props} />
    </>
  );
};

export const DesktopSidebar = ({ className, children, ...props }) => {
  const { open, setOpen, animate } = useSidebar();

  return (
    <>
      <motion.div
        className={cn(
          "h-screen px-4 py-4 hidden md:flex md:flex-col bg-white dark:bg-neutral-800 max-w-[250px] flex-shrink-0 relative overflow-hidden",
          className
        )}
        animate={{
          width: animate ? (open ? "310px" : "80px") : "310px",
          transition: { type: "spring", stiffness: 300, damping: 30 },
        }}
        {...props}
      >
        <div className="flex-1 overflow-hidden">{children}</div>
        {/* <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
           {children}
         </div> */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen(!open)}
          className="bg-gray-100 text-gray-700 shadow-sm dark:border-neutral-700 rounded-md p-2 cursor-pointer hover:bg-gray-200 transition-all duration-200 mt-4"
        >
          {open ? (
            <IconChevronLeft className="h-5 w-5" />
          ) : (
            <IconChevronRight className="h-5 w-5" />
          )}
        </motion.button>
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({ className, children, ...props }) => {
  const { open, setOpen } = useSidebar();

  return (
    <>
      <div
        className={cn(
          "h-16 px-4 flex flex-row md:hidden items-center justify-between bg-[#404040] dark:bg-neutral-800 w-full fixed top-0 left-0 z-50"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-white dark:text-neutral-200 h-6 w-6"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-screen w-[280px] top-0 left-0 bg-white dark:bg-neutral-900 z-[100] flex flex-col",
                className
              )}
            >
              <div className="flex justify-end p-4">
                <IconX
                  className="text-gray-700 dark:text-neutral-200 h-6 w-6"
                  onClick={() => setOpen(false)}
                />
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-6">{children}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {/* Add overlay when mobile sidebar is open */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
};

export const SidebarLink = ({ link, className, ...props }) => {
  const pathname = usePathname();
  const { open, animate } = useSidebar();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const isActive = link?.href && pathname === link.href;
  const hasActiveSublink = link?.subLinks?.some(subLink => pathname === subLink.href);

  const handleClick = (e) => {
    if (link.subLinks) {
      e.preventDefault();
      setIsDropdownOpen(!isDropdownOpen);
    }
  };

  const linkContent = (
    <>
      {link.icon}
      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className={cn(
          "text-gray-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0",
          (isActive || hasActiveSublink) && "text-white"
        )}
      >
        {link.label}
      </motion.span>
      {link.subLinks && (
        <IconChevronDown
          className={cn(
            "text-gray-700 dark:text-neutral-200 h-5 w-5 transition-transform",
            isDropdownOpen && "rotate-180",
            (isActive || hasActiveSublink) && "!text-white"
          )}
        />
      )}
    </>
  );

  return (
    <motion.div
      initial={false}
      animate={{ height: "auto" }}
      className="overflow-hidden w-full"
    >
      {link.href ? (
        <Link
          href={link.href}
          className={cn(
            "flex items-center justify-start gap-2 group/sidebar py-2 px-1 cursor-pointer rounded transition-colors duration-200 w-full",
            isActive || hasActiveSublink
              ? "bg-hotel-primary rounded-md p-3 text-white [&_*]:text-white"
              : open
              ? "hover:bg-gray-100 dark:hover:bg-neutral-700"
              : "hover:bg-gray-100/80 rounded-full p-3",
            !open && "justify-center",
            className
          )}
          onClick={handleClick}
          {...props}
        >
          {linkContent}
        </Link>
      ) : (
        <div
          className={cn(
            "flex items-center gap-2 group/sidebar py-2 px-1 cursor-pointer rounded transition-colors duration-200",
            hasActiveSublink
              ? "bg-hotel-primary rounded-md p-3 text-white [&_*]:text-white"
              : open
              ? "hover:bg-gray-100 dark:hover:bg-neutral-700 justify-start"
              : "hover:bg-gray-100/80 rounded-full p-3 justify-center",
            className
          )}
          onClick={handleClick}
          {...props}
        >
          {linkContent}
        </div>
      )}

      {link.subLinks && (
        <AnimatePresence initial={false}>
          {isDropdownOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="pl-8 overflow-hidden"
            >
              {link.subLinks.map((subLink, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Link
                    href={subLink.href}
                    className={cn(
                      "block py-1 text-sm transition-colors duration-200",
                      pathname === subLink.href
                        ? "text-hotel-primary font-medium"
                        : "text-gray-700 dark:text-neutral-300 hover:text-hotel-primary dark:hover:text-hotel-primary"
                    )}
                  >
                    {subLink.label}
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
};
