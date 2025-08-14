import React from 'react';
import { MdTableRestaurant } from 'react-icons/md';
import { motion } from 'framer-motion';

const getStatusStyles = (status) => {
  switch (status) {
    case 'available':
      return {
        bg: 'bg-green-50 hover:bg-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        label: 'Available',
        icon: 'text-green-500'
      };
    case 'ordering':
      return {
        bg: 'bg-orange-50 hover:bg-orange-100',
        border: 'border-orange-200',
        text: 'text-orange-700',
        label: 'Ordering',
        icon: 'text-orange-500'
      };
    case 'ready_to_pay':
      return {
        bg: 'bg-blue-50 hover:bg-blue-100',
        border: 'border-blue-200',
        text: 'text-blue-700',
        label: 'Ready to Pay',
        icon: 'text-blue-500'
      };
    default:
      return {
        bg: 'bg-gray-50 hover:bg-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-700',
        label: 'Unavailable',
        icon: 'text-gray-500'
      };
  }
};

const TableCard = React.forwardRef(({ table, onClick, className = '' }, ref) => {
  const statusStyles = getStatusStyles(table.status);
  
  // Handle click with a small delay to allow ripple effect to complete
  const handleClick = (e) => {
    if (onClick) {
      onClick(table, e);
    }
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className={`relative overflow-hidden rounded-xl border ${statusStyles.bg} ${statusStyles.border} shadow-sm hover:shadow-md transition-all duration-200 ${className}`}
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <MdTableRestaurant 
              className={`w-5 h-5 sm:w-6 sm:h-6 ${statusStyles.icon} flex-shrink-0`} 
            />
            <span className="ml-2 font-medium text-sm sm:text-base text-gray-800 truncate">
              Table {table.number}
            </span>
          </div>
          {table.seats > 0 && (
            <span className="text-xs bg-white/50 px-2 py-0.5 rounded-full text-gray-600">
              {table.seats} {table.seats === 1 ? 'seat' : 'seats'}
            </span>
          )}
        </div>
        
        <div className="mt-2 flex items-center justify-between">
          <span className={`text-xs sm:text-sm font-medium ${statusStyles.text} capitalize`}>
            {statusStyles.label.toLowerCase()}
          </span>
          
          {/* Status indicator dot */}
          <div className={`w-2 h-2 rounded-full ${statusStyles.icon.replace('text', 'bg')}`}></div>
        </div>
      </div>
    </motion.div>
  );
});

TableCard.displayName = 'TableCard';

export default React.memo(TableCard);