import React from 'react';
import { FaLock } from 'react-icons/fa';

const ClosedOrders = ({ orders, filterDate, setFilterDate }) => {
  // Filter orders by date before grouping
  const filteredOrders = filterDate
    ? orders.filter(order => order.created_at && order.created_at.slice(0, 10) === filterDate)
    : orders;

  if (!filteredOrders || filteredOrders.length === 0) {
    return (
      <>
        <div className="mb-6 flex items-center gap-4">
          <label htmlFor="closed-order-date-filter" className="font-medium">Filter by Date:</label>
          <input
            id="closed-order-date-filter"
            type="date"
            value={filterDate}
            max={new Date().toISOString().slice(0, 10)}
            onChange={e => setFilterDate(e.target.value)}
            className="p-2 border rounded"
          />
          <span className="text-xs text-gray-500">(Default: today)</span>
        </div>
        <div className="text-gray-400 text-center">No closed orders</div>
      </>
    );
  }

  // Group orders by table number
  const groupedByTable = filteredOrders.reduce((acc, order) => {
    const table = order.table_number || 'No Table';
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {});

  // Calculate total money for all filtered closed orders
  const totalClosedMoney = filteredOrders.reduce((sum, order) => {
    const orderTotal = order.total_money && Number(order.total_money) > 0
      ? Number(order.total_money)
      : order.items.filter(i => i.status === 'accepted').reduce((s, i) => s + i.price * i.quantity, 0);
    return sum + orderTotal;
  }, 0);

  return (
    <>
      <div className="mb-6 flex items-center gap-4">
        <label htmlFor="closed-order-date-filter" className="font-medium">Filter by Date:</label>
        <input
          id="closed-order-date-filter"
          type="date"
          value={filterDate}
          onChange={e => setFilterDate(e.target.value)}
          className="p-2 border rounded"
        />
      </div>
      <div className="space-y-8">
        {Object.entries(groupedByTable).map(([table, tableOrders]) => (
          <div key={table} className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-bold mb-4">Table {table}</h2>
            <div className="space-y-6">
              {tableOrders.map(order => (
                <div key={order.id} className="bg-gray-50 rounded-lg border border-gray-200 p-4 mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">Order #{order.order_number}</span>
                    <span className="text-xs text-gray-500">{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
                  </div>
                  <div className="space-y-1 mb-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span>{item.name} × {item.quantity}</span>
                        <span className={item.status === 'accepted' ? 'text-green-700' : 'text-red-700'}>
                          <FaLock className="inline mr-1" />
                          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-right font-bold text-blue-700">
                    Total: ${(
                      order.total_money && Number(order.total_money) > 0
                        ? Number(order.total_money)
                        : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
                    ).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-8 text-right font-bold text-lg text-green-700">
        Total Money (All Closed Orders): ${totalClosedMoney.toFixed(2)}
      </div>
    </>
  );
};

export default ClosedOrders; 