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
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-[#111416] mb-6">Beverage Order History</h1>
      <div className="mb-4 flex items-center gap-4">
        <label htmlFor="order-date-filter" className="font-medium">Filter by Date:</label>
        <input
          id="order-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
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
            {allOrders.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-6 text-gray-400">No beverage orders found for today.</td></tr>
            ) : (
              allOrders.map(order => (
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Reports; 