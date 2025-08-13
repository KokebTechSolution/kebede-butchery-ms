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
import { getMyOrders } from "../../../../../../api/cashier";
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
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchOrders = async (date, status = null) => {
    try {
      const ordersData = await getMyOrders(date, status);
      setOrders(ordersData);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    }
  };

  useEffect(() => {
    const status = filterStatus === 'all' ? null : filterStatus;
    const interval = setInterval(() => fetchOrders(filterDate, status), 5000); // Fetch every 5 seconds
    fetchOrders(filterDate, status); // Initial fetch
    return () => clearInterval(interval); // Cleanup on unmount
  }, [filterDate, filterStatus]);

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
      await axiosInstance.post('/payments/payments/', {
        order: order.id,
        payment_method: paymentMethod,
        amount: order.total_money,
      });
      alert('Payment processed and saved!');
      // Refetch orders from backend to get updated payment status
      fetchOrders(filterDate);
    } catch (error) {
      let msg = 'Failed to process payment';
      if (error.response && error.response.data) {
        msg += ': ' + JSON.stringify(error.response.data);
      }
      alert(msg);
      console.error(error);
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
    <div className="max-w-[960px] flex-1 grow flex flex-col items-start">
      <div className="flex flex-col items-start pt-5 pb-3 px-4 w-full">
        <h2 className="font-bold text-[#161111] text-[22px] leading-7 [font-family:'Work_Sans',Helvetica]">
          Pending Orders
        </h2>
        <div className="w-full mt-3">
          <label htmlFor="order-date-filter" className="block text-sm font-medium text-gray-700 mb-2">
            Filter by Date:
          </label>
          <input
            id="order-date-filter"
            type="date"
            value={filterDate}
            onChange={e => setFilterDate(e.target.value)}
            className="w-full sm:w-auto p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Mobile Card View (hidden on desktop) */}
      <div className="block lg:hidden px-4 py-3 w-full space-y-4">
        {sortedOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No pending orders for the selected date.</p>
          </div>
        ) : (
          sortedOrders.map((order, index) => (
            <Card key={order.id || `${order.waiterName}-${order.table_number}-${index}`}
                  className="border border-gray-200 rounded-lg shadow-sm">
              <CardContent className="p-4">
                {/* Order Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">#{order.order_number}</h3>
                    <p className="text-sm text-gray-600">Table {order.table_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">${order.total_money}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                      order.payment_option === 'online'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {formatPaymentOption(order.payment_option)}
                    </span>
                  </div>
                </div>

                {/* Order Details */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Waiter:</span>
                    <span className="font-medium">{order.waiterName}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="border-t pt-3 mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Items:</h4>
                  <div className="space-y-1">
                    {order.items.filter(item => item.status === 'accepted').map((item, itemIndex) => (
                      <div key={item.id || `${item.name}-${itemIndex}`}
                           className="flex justify-between items-center text-sm">
                        <span className="text-gray-900">
                          <span className="font-medium">{item.quantity}x</span> {item.name}
                        </span>
                        <span className="text-gray-600">${item.price}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Button */}
                <div className="border-t pt-3">
                  {order.has_payment ? (
                    <div className="w-full rounded-lg px-4 py-3 font-bold text-sm bg-green-100 text-green-700 text-center">
                      ✓ Payment Processed
                    </div>
                  ) : (
                    <button
                      type="button"
                      className={`w-full rounded-lg px-4 py-3 font-bold text-sm transition-colors duration-200
                        ${clickedIndex === index
                          ? 'bg-red-600 text-white'
                          : 'bg-red-500 text-white hover:bg-red-600'}
                      `}
                      onClick={() => handleProcessPayment(order, index)}
                      disabled={clickedIndex === index}
                    >
                      {clickedIndex === index ? 'Processing...' : 'Process Payment'}
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Desktop Table View (hidden on mobile) */}
      <div className="hidden lg:block px-4 py-3 w-full">
        <Card className="border border-solid border-[#e2dddd] rounded-xl overflow-hidden">
          <CardContent className="p-0">
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
      </div>
    </div>
  );
};
