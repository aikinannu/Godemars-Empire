import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png"; // ✅ Make sure this path matches your logo file

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-black via-gray-900 to-black text-white text-center px-6 overflow-hidden">
      
      {/* Animated Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{
          opacity: 1,
          scale: [1, 1.05, 1],
          rotate: [0, 2, -2, 0],
          transition: {
            duration: 3,
            ease: "easeInOut",
            repeat: Infinity,
            repeatDelay: 4,
          },
        }}
        className="mb-8"
      >
        <motion.img
          src={logo}
          alt="Godemar Logo"
          className="w-32 h-32 sm:w-40 sm:h-40 rounded-full shadow-lg border-4 border-yellow-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{
            opacity: 1,
            y: 0,
            transition: { duration: 1.5, ease: "easeOut" },
          }}
          whileHover={{ scale: 1.1, rotate: 5 }}
        />
      </motion.div>

      {/* Hero Message */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 1, duration: 1, ease: "easeOut" },
        }}
        className="max-w-3xl"
      >
        <h1 className="text-2xl sm:text-4xl font-bold text-yellow-500 drop-shadow-lg mb-6">
          Welcome to The Grand Coordinating Enterprise
        </h1>
        <p className="text-gray-300 text-lg sm:text-xl mb-10 leading-relaxed">
          Explore the world of innovation, creativity, and purpose. 
          Join our empire of designers, thinkers, and creators shaping the future with brilliance.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-6">
          <motion.button
            onClick={() => navigate("/login")}
            className="w-full sm:w-auto bg-yellow-500 hover:bg-yellow-400 text-black font-semibold py-3 px-8 rounded-xl shadow-lg transition duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Login
          </motion.button>
          <motion.button
            onClick={() => navigate("/signup")}
            className="w-full sm:w-auto bg-transparent border-2 border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black font-semibold py-3 px-8 rounded-xl shadow-lg transition duration-300 transform hover:scale-105"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            Sign Up
          </motion.button>
        </div>

        {/* Footer */}
        <motion.div
          className="mt-12 mb-20"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 2 } }}
        >
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Godemar’s Empire — Built with vision and purpose.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
