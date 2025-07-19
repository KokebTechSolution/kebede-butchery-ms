import React, { useState } from 'react';
import { AlertTriangle, Package } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { useInventory } from '../../hooks/useInventory';
import { useOrders } from '../../hooks/useOrders';

const getStatusColor = (status) => {
  switch (status) {
    case 'enough':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'out':
      return 'bg-gray-100 text-gray-800 border-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'enough':
      return 'In Stock';
    case 'low':
      return 'Running Low';
    case 'critical':
      return 'Critically Low';
    case 'out':
      return 'Out of Stock';
    default:
      return 'Unknown';
  }
};

export const Inventory = () => {
  const [filterDate, setFilterDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const { inventory, getLowStockItems } = useInventory();
  const lowStockItems = getLowStockItems();
  const { getActiveOrders, getClosedOrders } = useOrders(filterDate);
  const activeOrders = getActiveOrders();
  const closedOrders = getClosedOrders();
  const allOrders = [...activeOrders, ...closedOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Map low stock items to waiter names who ordered them
  const lowStockWithWaiters = lowStockItems.map(item => {
    // Find all waiter names who have ordered this item in active orders
    const waiterNames = Array.from(new Set(
      activeOrders.flatMap(order =>
        order.items
          .filter(orderItem => orderItem.name === item.name)
          .map(() => order.waiterName || order.created_by_username || 'Unknown')
      )
    ));
    return { ...item, waiterNames };
  });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Order History Section */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Order History
          </CardTitle>
        </CardHeader>
        <CardContent>
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
                  <tr><td colSpan={6} className="text-center py-6 text-gray-400">No orders found for today.</td></tr>
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
        </CardContent>
      </Card>
    </div>
  );
};