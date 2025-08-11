import React from 'react';
import { FaLock, FaTable, FaClock, FaDollarSign, FaCheck, FaTimes, FaClipboardList } from 'react-icons/fa';

const ClosedOrders = ({ orders, filterDate, setFilterDate }) => {

  // Filter orders by selected date
  const filteredOrders = orders.filter(order => {
    if (!order.created_at) return false;
    const orderDate = new Date(order.created_at).toISOString().slice(0, 10);
    return orderDate === filterDate;
  });

  if (!filteredOrders || filteredOrders.length === 0) {
    return (
      <div className="p-4">
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaLock className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No closed orders</h3>
          <p className="text-gray-500">No orders were closed on {new Date(filterDate).toLocaleDateString()}</p>
        </div>
      </div>
    );
  }

  // Group filtered orders by table number
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
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
          <FaLock className="text-green-600 text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Closed Orders</h1>
          <p className="text-sm text-gray-500">
            {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''} closed on {new Date(filterDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Orders List */}
      <div className="space-y-6">
        {Object.entries(groupedByTable).map(([table, tableOrders]) => (
          <div key={table} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Table Header */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
                  <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {table}
                  </span>
                  <span>Table {table}</span>
                </h2>
                <span className="text-sm text-gray-600 font-medium">
                  {tableOrders.length} order{tableOrders.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Orders for this table */}
            <div className="divide-y divide-gray-100">
              {tableOrders.map(order => {
                const orderTotal = (
                  order.total_money && Number(order.total_money) > 0
                    ? Number(order.total_money)
                    : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
                ).toFixed(2);
                
                return (
                  <div key={order.id} className="p-4">
                    {/* Order Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-bold text-gray-900 text-lg">
                            #{order.order_number}
                          </h3>
                          <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                            Closed
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-600">
                          <div className="flex items-center space-x-1">
                            <FaClock className="w-3 h-3" />
                            <span>{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm text-gray-500">Total</div>
                        <div className="text-xl font-bold text-green-600 flex items-center space-x-1">
                          <FaDollarSign className="w-4 h-4" />
                          <span>{orderTotal}</span>
                        </div>
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">{item.name}</div>
                              <div className="text-sm text-gray-600">
                                Qty: {item.quantity} × ETB {(Number(item.price) || 0).toFixed(2)}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-gray-900">
                                ETB {(item.price * item.quantity).toFixed(2)}
                              </div>
                              <div className={`flex items-center justify-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${
                                item.status === 'accepted' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {item.status === 'accepted' ? (
                                  <>
                                    <FaCheck className="w-3 h-3" />
                                    <span>Accepted</span>
                                  </>
                                ) : (
                                  <>
                                    <FaTimes className="w-3 h-3" />
                                    <span>Rejected</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Total Summary */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <FaDollarSign className="text-2xl" />
            </div>
            <div>
              <h3 className="text-lg font-medium">Total Revenue</h3>
              <p className="text-green-100 text-sm">All closed orders for {new Date(filterDate).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold">ETB {totalClosedMoney.toFixed(2)}</div>
            <div className="text-green-100 text-sm">{filteredOrders.length} orders</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClosedOrders; 