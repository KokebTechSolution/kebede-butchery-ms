import React, { useState } from 'react';
import { useBeverages } from '../hooks/useBeverages';

const Reports = () => {
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const { orders } = useBeverages(filterDate);
  const allOrders = orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-[#111416] mb-4 md:mb-6">Beverage Order History</h1>
      
      {/* Date Filter - Mobile Responsive */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <label htmlFor="order-date-filter" className="font-medium text-sm sm:text-base">Filter by Date:</label>
        <input
          id="order-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded text-sm sm:text-base w-full sm:w-auto"
        />
      </div>

      {/* Mobile Card Layout */}
      <div className="space-y-3">
        {allOrders.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p className="text-sm sm:text-base">No beverage orders found for today.</p>
          </div>
        ) : (
          allOrders.map(order => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                <div className="flex items-center gap-2 mb-2 sm:mb-0">
                  <span className="text-sm font-semibold text-gray-600">Order #</span>
                  <span className="text-sm font-bold text-[#111416]">{order.order_number}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Table:</span>
                    <span className="text-sm font-medium">{order.table_number || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Time:</span>
                    <span className="text-sm font-medium">
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : ''}
                    </span>
                  </div>
                </div>
              </div>

              {/* Waiter Info */}
              <div className="mb-3">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Waiter:</span>
                  <span className="text-sm font-medium text-[#111416]">
                    {order.waiterName || order.created_by_username || 'Unknown'}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="mb-3">
                <h4 className="text-xs font-semibold text-gray-600 mb-2">Items:</h4>
                <div className="space-y-1">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="flex-1">
                        {item.name} × {item.quantity}
                      </span>
                      <span 
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          item.status === 'accepted' 
                            ? 'bg-green-100 text-green-700' 
                            : item.status === 'rejected' 
                            ? 'bg-red-100 text-red-700' 
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Status */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Payment Status:</span>
                {order.has_payment ? (
                  <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                    Paid
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs font-semibold">
                    Unpaid
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table Layout (Hidden on mobile) */}
      <div className="hidden lg:block mt-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#e5e8ea]">
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Order #</th>
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Table</th>
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Waiter</th>
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Items</th>
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Time</th>
                <th className="text-left py-3 px-4 font-semibold text-[#111416]">Status</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.map(order => (
                <tr key={order.id} className="border-b border-[#f2f2f4] hover:bg-[#f8f9fa]">
                  <td className="py-3 px-4">{order.order_number}</td>
                  <td className="py-3 px-4">{order.table_number || 'N/A'}</td>
                  <td className="py-3 px-4">{order.waiterName || order.created_by_username || 'Unknown'}</td>
                  <td className="py-3 px-4">
                    <ul>
                      {order.items.map((item, idx) => (
                        <li key={idx}>{item.name} × {item.quantity} <span style={{fontSize: '11px', color: item.status === 'accepted' ? '#16a34a' : item.status === 'rejected' ? '#dc2626' : '#b45309'}}>[{item.status}]</span></li>
                      ))}
                    </ul>
                  </td>
                  <td className="py-3 px-4">{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</td>
                  <td className="py-3 px-4">
                    {order.has_payment ? (
                      <span className="px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">Paid</span>
                    ) : (
                      <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-700 text-xs font-semibold">Unpaid</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports; 