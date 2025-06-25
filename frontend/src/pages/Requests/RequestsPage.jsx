// src/pages/RequestsPage.jsx
import React from 'react';
import { motion } from 'framer-motion';
import { Hourglass } from 'lucide-react';

const RequestsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-purple-100 to-blue-200 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center bg-white shadow-xl rounded-2xl p-10 max-w-lg"
      >
        <Hourglass size={60} className="mx-auto text-blue-600 animate-spin mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-800 mb-2">Coming Soon!</h1>
        <p className="text-gray-600 text-lg mb-6">
          The Requests page is under construction. Please check back later.
        </p>
        <button
          onClick={() => window.history.back()}
          className="bg-blue-600 text-white px-6 py-2 rounded-full shadow hover:bg-blue-700 transition"
        >
          Go Back
        </button>
      </motion.div>
    </div>
  );
};

export default RequestsPage;
