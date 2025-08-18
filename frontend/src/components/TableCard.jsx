import React from 'react';
import { MdTableRestaurant, MdInfo } from 'react-icons/md';
import { motion } from 'framer-motion';

const getStatusStyles = (status) => {
  switch (status) {
    case 'available':
      return {
        bg: 'bg-green-50 hover:bg-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'Available',
        icon: 'text-green-500',
        actionText: 'Click to take order',
        canClick: true
      };
    case 'ordering':
      return {
        bg: 'bg-orange-50 hover:bg-orange-100',
        border: 'border-orange-200',
        text: 'text-orange-700',
        label: 'Ordering',
        icon: 'text-orange-500',
        actionText: 'Click to view order',
        canClick: true
      };
    case 'ready_to_pay':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: 'Ready to Pay',
        icon: 'text-blue-500',
        actionText: 'Click to view order',
        canClick: true
      };
    case 'occupied':
      return {
        bg: 'bg-red-50 hover:bg-red-100',
        border: 'border-red-200',
        text: 'text-red-700',
        label: 'Occupied',
        icon: 'text-red-500',
        actionText: 'Table has active order',
        canClick: false
      };
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-700',
        label: 'Unavailable',
        icon: 'text-gray-500',
        actionText: 'Table unavailable',
        canClick: false
      };
  }
};

const TableCard = React.forwardRef(({ table, onClick, className = '', showStatusDescription = false }, ref) => {
  const statusStyles = getStatusStyles(table.status);
  
  // Handle click with a small delay to allow ripple effect to complete
  const handleClick = (e) => {
    if (onClick && statusStyles.canClick) {
      onClick(table, e);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: statusStyles.canClick ? 0.98 : 1 }}
      className={`relative overflow-hidden rounded-xl border-2 ${statusStyles.bg} ${statusStyles.border} shadow-sm transition-all duration-200 ${className} ${
        statusStyles.canClick 
          ? 'hover:shadow-md cursor-pointer touch-manipulation' 
          : 'cursor-not-allowed opacity-80'
      }`}
      onClick={handleClick}
    >
      {/* Large Table Number Badge - Mobile Optimized */}
      <div className="absolute -top-1 sm:-top-2 -right-1 sm:-right-2 w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-white rounded-full border-2 border-gray-200 flex items-center justify-center shadow-md">
        <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-800">
          {table.number}
        </span>
      </div>

      {/* Status indicator for unavailable tables */}
      {!statusStyles.canClick && (
        <div className="absolute top-2 left-2">
          <MdInfo className="w-5 h-5 text-red-500" title="Table unavailable for new orders" />
        </div>
      )}

      <div className="p-3 sm:p-4 pt-4 sm:pt-6">
        {/* Table Icon and Name - Mobile Optimized */}
        <div className="flex items-center justify-center mb-2 sm:mb-3">
          <MdTableRestaurant 
            className={`w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 ${statusStyles.icon}`} 
          />
        </div>
        
        {/* Table Label - Mobile Optimized */}
        <div className="text-center mb-2 sm:mb-3">
          <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-900">
            Table {table.number}
          </span>
        </div>

        {/* Seats Information - Mobile Optimized */}
        {table.seats > 0 && (
          <div className="text-center mb-2 sm:mb-3">
            <span className="text-xs sm:text-sm bg-white/70 px-2 sm:px-3 py-1 rounded-full text-gray-700 font-medium">
              {table.seats} {table.seats === 1 ? 'Seat' : 'Seats'}
            </span>
          </div>
        )}
        
        {/* Status Information - Mobile Optimized */}
        <div className="text-center">
          <div className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-2 rounded-lg ${statusStyles.bg} ${statusStyles.border}`}>
            {/* Status indicator dot */}
            <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${statusStyles.icon.replace('text', 'bg')}`}></div>
            <span className={`text-xs sm:text-sm font-semibold ${statusStyles.text} capitalize`}>
              {statusStyles.label}
            </span>
          </div>
          
          {/* Action subtitle */}
          <div className="mt-2">
            <span className={`text-xs font-medium ${
              statusStyles.canClick ? 'text-gray-600' : 'text-red-600'
            }`}>
              {statusStyles.actionText}
            </span>
          </div>

          {/* Additional status description if enabled */}
          {showStatusDescription && table.statusDescription && (
            <div className="mt-2">
              <span className="text-xs text-gray-500 font-medium">
                {table.statusDescription}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
});

TableCard.displayName = 'TableCard';

export default React.memo(TableCard);