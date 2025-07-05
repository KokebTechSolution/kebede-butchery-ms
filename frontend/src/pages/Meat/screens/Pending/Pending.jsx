import React from 'react';
import { FaLock } from 'react-icons/fa';
import { useOrders } from '../../hooks/useOrders';

export const Pending = () => {
  const { orders, acceptOrder, rejectOrder, acceptOrderItem, rejectOrderItem } = useOrders();

  // Sort all orders by most recent first
  const allOrders = orders.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  // Group by table
  const groupedByTable = allOrders.reduce((acc, order) => {
    const table = order.table_number || 'No Table';
    if (!acc[table]) acc[table] = [];
    acc[table].push(order);
    return acc;
  }, {});
  // Sort tables: tables with pending orders first, then by most recent order
  const tableEntries = Object.entries(groupedByTable).sort(([tableA, ordersA], [tableB, ordersB]) => {
    const aHasPending = ordersA.some(order => order.items.some(item => item.status === 'pending'));
    const bHasPending = ordersB.some(order => order.items.some(item => item.status === 'pending'));
    if (aHasPending !== bHasPending) return aHasPending ? -1 : 1;
    // If both have (or don't have) pending, sort by most recent order
    const aMostRecent = Math.max(...ordersA.map(o => new Date(o.created_at).getTime()));
    const bMostRecent = Math.max(...ordersB.map(o => new Date(o.created_at).getTime()));
    return bMostRecent - aMostRecent;
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Orders</h1>
      {Object.keys(groupedByTable).length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No active orders</p>
        </div>
      ) : (
        <div className="space-y-8">
          {tableEntries.map(([table, tableOrders]) => {
            return (
              <div key={table} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-gray-900">Table {table}</h2>
                </div>
                <div className="space-y-4">
                  {tableOrders.map(order => {
                    // Determine if there are any pending items
                    const hasPendingItems = order.items.some(item => item.status === 'pending');
                    return (
                      <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center space-x-3">
                            <h3 className="font-semibold text-gray-900">
                              Order #{order.order_number}
                            </h3>
                            <span className="text-sm text-gray-500">
                              {order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}
                            </span>
                            <span className="text-lg font-bold text-blue-700">
                              ${(
                                order.total_money && Number(order.total_money) > 0
                                  ? Number(order.total_money)
                                  : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
                              ).toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            {order.status === 'pending' && hasPendingItems && (
                              <button
                                onClick={() => acceptOrder(order.id)}
                                className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                              >
                                Accept
                              </button>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center text-sm py-1">
                                <span>{item.name} × {item.quantity}</span>
                                <span>${(item.price * item.quantity).toFixed(2)}</span>
                                <span className="ml-4">
                                  {item.status === 'pending' && (
                                    <>
                                      <button
                                        onClick={() => acceptOrderItem(item.id)}
                                        className="px-2 py-0.5 bg-green-600 text-white text-xs rounded hover:bg-green-700 mr-1"
                                      >
                                        Accept
                                      </button>
                                      <button
                                        onClick={() => rejectOrderItem(item.id)}
                                        className="px-2 py-0.5 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                                      >
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  {item.status === 'accepted' && (
                                    <span className="text-green-700 flex items-center"><FaLock className="inline mr-1" />Accepted</span>
                                  )}
                                  {item.status === 'rejected' && (
                                    <span className="text-red-700">Rejected</span>
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};