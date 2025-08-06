import React, { useState, useEffect } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import { getPrintedOrders } from "../../../../../../api/cashier";
import axiosInstance from "../../../../../../api/axiosInstance";

// Helper to get today's date in yyyy-mm-dd format
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

export const SidebarSection = () => {
  const [orders, setOrders] = useState([]);
  const [clickedIndex, setClickedIndex] = useState(null);
  const [filterDate, setFilterDate] = useState(getTodayDateString());

  const fetchOrders = async (date) => {
    try {
      const printedOrders = await getPrintedOrders(date);
      setOrders(printedOrders);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => fetchOrders(filterDate), 5000); // Fetch every 5 seconds
    fetchOrders(filterDate); // Initial fetch
    return () => clearInterval(interval); // Cleanup on unmount
  }, [filterDate]);

  const handleProcessPayment = async (order, index) => {
    setClickedIndex(index);
    try {
      let paymentMethod = order.payment_option;
      if (Array.isArray(paymentMethod)) {
        paymentMethod = paymentMethod[0];
      }
      if (typeof paymentMethod === "string" && paymentMethod.startsWith('"') && paymentMethod.endsWith('"')) {
        paymentMethod = paymentMethod.slice(1, -1);
      }
      
      const paymentData = {
        order: order.id,
        payment_method: paymentMethod,
        amount: order.total_money,
      };
      
      console.log('[DEBUG] Processing payment with data:', paymentData);
      console.log('[DEBUG] Order details:', {
        id: order.id,
        order_number: order.order_number,
        total_money: order.total_money,
        payment_option: order.payment_option,
        has_payment: order.has_payment
      });
      
      const response = await axiosInstance.post('/payments/payments/', paymentData);
      console.log('[DEBUG] Payment response:', response.data);
      
      alert('✅ Payment processed and saved successfully!');
      // Refetch orders from backend to get updated payment status
      fetchOrders(filterDate);
    } catch (error) {
      console.error('[ERROR] Payment processing failed:', error);
      
      let msg = '❌ Failed to process payment';
      if (error.response) {
        console.error('[ERROR] Response status:', error.response.status);
        console.error('[ERROR] Response data:', error.response.data);
        
        if (error.response.status === 401) {
          msg += ': Authentication required. Please log in again.';
        } else if (error.response.status === 403) {
          msg += ': Permission denied. You may not have access to process payments.';
        } else if (error.response.status === 400) {
          msg += ': Invalid payment data. Please check the order details.';
        } else if (error.response.data) {
          msg += ': ' + JSON.stringify(error.response.data);
        }
      } else if (error.request) {
        msg += ': Network error. Please check your connection.';
        console.error('[ERROR] No response received:', error.request);
      } else {
        msg += ': ' + error.message;
        console.error('[ERROR] Request setup error:', error.message);
      }
      
      alert(msg);
    } finally {
      setClickedIndex(null);
    }
  };

  // Sort: unprocessed first, then newest first by order_number
  const sortedOrders = [...orders].sort((a, b) => {
    if (a.has_payment !== b.has_payment) {
      return a.has_payment ? 1 : -1;
    }
    if (b.order_number && a.order_number) {
      return b.order_number.localeCompare(a.order_number);
    }
    if (b.created_at && a.created_at) {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return 0;
  });

  // Utility to format payment option label for UI display
  const formatPaymentOption = (opt) => {
    if (!opt) return 'N/A';
    if (Array.isArray(opt)) opt = opt[0];
    if (typeof opt === 'string' && opt.startsWith('"') && opt.endsWith('"')) {
      opt = opt.slice(1, -1);
    }
    
    return opt.charAt(0).toUpperCase() + opt.slice(1);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-3 sm:p-6">
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 space-y-3 sm:space-y-0">
          <h2 className="text-lg sm:text-2xl font-bold text-[#161111] truncate">Orders Ready for Payment</h2>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <label htmlFor="date-filter" className="text-xs sm:text-sm font-medium text-[#82686b] whitespace-nowrap">
                Filter by Date:
              </label>
              <input
                id="date-filter"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation min-h-[44px]"
              />
            </div>
            <Button
              onClick={() => fetchOrders(filterDate)}
              variant="outline"
              className="bg-white hover:bg-gray-50 text-[#161111] border-[#e5e8ea] min-h-[44px] touch-manipulation"
            >
              Refresh
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-white">
              <TableHead className="w-[160px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Waiter
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Table
              </TableHead>
              <TableHead className="w-40 px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Items
              </TableHead>
              <TableHead className="w-[100px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Total
              </TableHead>
              <TableHead className="w-[120px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Order Number
              </TableHead>
              <TableHead className="w-[120px] px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#161111] text-sm">
                Payment Option
              </TableHead>
              <TableHead className="w-32 px-4 py-3 [font-family:'Work_Sans',Helvetica] font-medium text-[#82686b] text-sm">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedOrders.map((order, index) => (
              <TableRow
                key={order.id || `${order.waiterName}-${order.table_number}-${index}`}
                className="border-t border-[#e5e8ea]"
              >
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#161111] text-sm align-top">
                  {order.waiterName}
                </TableCell>
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                  {order.table_number}
                </TableCell>
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                  <ul className="space-y-1">
                    {order.items.filter(item => item.status === 'accepted').map((item, itemIndex) => (
                      <li key={item.id || `${item.name}-${itemIndex}`} className="text-sm">
                        <span className="font-medium">{item.quantity}x</span> {item.name}
                        <span className="text-[#876363] ml-2">({item.price})</span>
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-sm align-top">
                  {`$${order.total_money}`}
                </TableCell>
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#161111] text-sm align-top">
                  {order.order_number}
                </TableCell>
                <TableCell className="px-4 py-3 [font-family:'Work_Sans',Helvetica] font-normal text-[#82686b] text-xl align-top">
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    order.payment_option === 'online' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {formatPaymentOption(order.payment_option)}
                  </span>
                </TableCell>
                <TableCell className="px-4 py-3 align-top">
                  {order.has_payment ? (
                    <span className="w-full rounded-lg px-4 py-2 font-bold text-sm bg-green-100 text-green-700 block text-center">
                      Processed
                    </span>
                  ) : (
                    <button
                      type="button"
                      className={`w-full rounded-lg px-4 py-2 font-bold text-sm transition-colors duration-200 [font-family:'Work_Sans',Helvetica] 
                        ${clickedIndex === index
                          ? 'bg-red-600 text-white'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'}
                      `}
                      onClick={() => handleProcessPayment(order, index)}
                      disabled={clickedIndex === index}
                    >
                      {clickedIndex === index ? 'Processing...' : 'Process Payment'}
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
