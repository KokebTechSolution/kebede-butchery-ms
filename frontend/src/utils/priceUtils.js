/**
 * Utility functions for safe price and quantity calculations
 */

/**
 * Safely converts a value to a number, returning 0 if conversion fails
 * @param {any} value - The value to convert
 * @returns {number} - The converted number or 0
 */
export const safeNumber = (value) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};

/**
 * Safely calculates the total price for a cart item
 * @param {Object} item - The cart item with price and quantity
 * @returns {number} - The calculated total price
 */
export const calculateItemTotal = (item) => {
  const price = safeNumber(item.price);
  const quantity = safeNumber(item.quantity);
  return price * quantity;
};

/**
 * Safely calculates the total price for an array of cart items
 * @param {Array} items - Array of cart items
 * @returns {number} - The calculated total price
 */
export const calculateCartTotal = (items) => {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + calculateItemTotal(item), 0);
};

/**
 * Formats a price value to 2 decimal places with ETB currency
 * @param {any} price - The price to format
 * @returns {string} - Formatted price string
 */
export const formatPrice = (price) => {
  const safePrice = safeNumber(price);
  return `ETB ${safePrice.toFixed(2)}`;
};

/**
 * Formats a cart total with proper currency display
 * @param {Array} items - Array of cart items
 * @returns {string} - Formatted total price string
 */
export const formatCartTotal = (items) => {
  const total = calculateCartTotal(items);
  return formatPrice(total);
};

/**
 * Safely converts a value to a number and calls toFixed(2)
 * Prevents "toFixed is not a function" errors
 * @param {any} value - The value to format
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {string} Formatted number string
 */
export const safeToFixed = (value, decimals = 2) => {
  if (value === null || value === undefined) return '0.00';
  
  const num = Number(value);
  if (isNaN(num)) return '0.00';
  
  return num.toFixed(decimals);
};

/**
 * Safely formats a price value with ETB currency
 * @param {any} value - The price value to format
 * @returns {string} Formatted price string
 */
export const safeFormatPrice = (value) => {
  return `ETB ${safeToFixed(value)}`;
};

