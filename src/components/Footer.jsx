// src/components/Footer.jsx
import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { 
  FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaSnapchat, 
  FaChevronUp, FaChevronDown 
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const Footer = () => {
  const [expanded, setExpanded] = useState(false);

  const links = [
    "Home", "About", "Purpose", "Vision", 
    "Domains", "Team", "Careers", "Contact"
  ];

  const { isAuthenticated } = useAuth();
  const location = useLocation();

  // Pages where footer should remain visible even after login
  const ALWAYS_SHOW_ON = [
    "/",
    "/about",
    "/purpose",
    "/vision",
    "/domains",
    "/team",
    "/careers",
    "/contact",
    "/license",
  ];

  const path = (location.pathname || "/").replace(/\/+$/g, "").toLowerCase() || "/";
  const shouldShow = !isAuthenticated || ALWAYS_SHOW_ON.includes(path);

  if (!shouldShow) return null;

  return (
    <footer className="fixed bottom-0 left-0 w-full z-50">
      {/* Gradient background */}
      <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800 text-white shadow-lg">

        {/* Toggle Bar */}
        <div
          onClick={() => setExpanded(!expanded)}
          className="cursor-pointer flex justify-center items-center py-1 bg-gray-800/90 hover:bg-gray-700/90 transition"
        >
          {expanded ? <FaChevronDown size={14} /> : <FaChevronUp size={14} />}
        </div>

        {/* Expandable Footer Content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="overflow-hidden relative"
            >
              {/* Animated golden border-top */}
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                exit={{ width: "0%" }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="absolute top-0 left-0 h-[3px] bg-gradient-to-r from-yellow-400 via-yellow-200 to-yellow-400 shadow-lg"
              />

              <div className="max-w-7xl mx-auto px-6 sm:px-8 lg:px-12 py-8 grid grid-cols-1 md:grid-cols-2 gap-10">

                {/* Quick Links */}
                <div className="text-sm text-gray-300">
                  <h4 className="text-[20px] font-semibold text-yellow-400 mb-4">
                    Quick Links
                  </h4>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                    {links.map((name) => (
                      <Link
                        key={name}
                        to={`/${name.toLowerCase() === "home" ? "" : name.toLowerCase()}`}
                        className="relative hover:text-yellow-400 transition group text-[16px]"
                      >
                        {name}
                        <span className="absolute left-0 -bottom-1 w-0 h-[2px] bg-yellow-400 transition-all group-hover:w-full"></span>
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Contact Info + Socials */}
                <div className="flex flex-col space-y-6 md:items-end text-sm text-gray-400">
                  <div>
                    <h4 className="text-[20px] font-semibold text-yellow-400 mb-2">
                      Contact
                    </h4>
                    <p className="text-[16px]">
                      Email:{" "}
                      <a
                        href="mailto:aikinannu@gmail.com"
                        className="hover:text-yellow-400"
                      >
                        aikinannu@gmail.com
                      </a>
                    </p>
                    <p className="text-[16px]">
                      Phone:{" "}
                      <a
                        href="tel:+233557529621"
                        className="hover:text-yellow-400"
                      >
                        +233 55 752 9621
                      </a>
                    </p>
                  </div>

                  {/* Social Icons */}
                  <div className="flex space-x-5 text-[20px]">
                    {[FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaSnapchat].map((Icon, i) => (
                      <motion.a
                        key={i}
                        href="#"
                        target="_blank"
                        rel="noreferrer"
                        whileHover={{ scale: 1.2, y: -2, color: "#facc15" }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="transition"
                      >
                        <Icon />
                      </motion.a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Copyright */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-center text-[14px] text-gray-400 pb-4"
              >
                &copy; {new Date().getFullYear()} Godemar’s Empire. All rights reserved.
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </footer>
  );
};

export default Footer;
