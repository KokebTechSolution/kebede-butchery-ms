import React, { useState } from 'react';
import { useBeverages } from '../hooks/useBeverages';
import { FaClipboardList, FaTable, FaUser, FaClock, FaDollarSign, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

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

  // Calculate summary statistics
  const totalOrders = allOrders.length;
  const totalRevenue = allOrders.reduce((sum, order) => {
    const orderTotal = order.total_money && Number(order.total_money) > 0
      ? Number(order.total_money)
      : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0);
    return sum + orderTotal;
  }, 0);
  const paidOrders = allOrders.filter(order => order.has_payment).length;
  const pendingOrders = allOrders.filter(order => !order.has_payment).length;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'accepted': return <FaCheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected': return <FaTimesCircle className="w-4 h-4 text-red-600" />;
      case 'pending': return <FaClock className="w-4 h-4 text-yellow-600" />;
      default: return <FaClock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
          <FaClipboardList className="text-indigo-600 text-lg" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Beverage Order History</h1>
          <p className="text-sm text-gray-500">View and analyze beverage order data</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <FaClipboardList className="text-blue-600 text-lg" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Orders</div>
              <div className="text-2xl font-bold text-blue-600">{totalOrders}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FaDollarSign className="text-green-600 text-lg" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">ETB {totalRevenue.toFixed(2)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FaCheckCircle className="text-green-600 text-lg" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Paid Orders</div>
              <div className="text-2xl font-bold text-green-600">{paidOrders}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <FaClock className="text-yellow-600 text-lg" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Pending Payment</div>
              <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Orders List */}
      {allOrders.length === 0 ? (
        <div className="text-center py-16 px-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaClipboardList className="text-gray-400 text-3xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-500">No beverage orders found for {new Date(filterDate).toLocaleDateString()}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allOrders.map(order => {
            const orderTotal = (
              order.total_money && Number(order.total_money) > 0
                ? Number(order.total_money)
                : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)
            ).toFixed(2);
            
            return (
              <div key={order.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Order Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-bold text-gray-900 text-lg">
                          #{order.order_number}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                          order.has_payment 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                        }`}>
                          {order.has_payment ? 'Paid' : 'Unpaid'}
                        </span>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <FaTable className="w-3 h-3" />
                          <span>Table {order.table_number || 'N/A'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaUser className="w-3 h-3" />
                          <span>{order.waiterName || order.created_by_username || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <FaClock className="w-3 h-3" />
                          <span>{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm text-gray-500">Total</div>
                      <div className="text-xl font-bold text-indigo-600 flex items-center space-x-1">
                        <FaDollarSign className="w-4 h-4" />
                        <span>{orderTotal}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="p-4">
                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">{item.name}</div>
                            <div className="text-sm text-gray-600">
                              Qty: {item.quantity} × ETB {(Number(item.price) || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-gray-900">
                              ETB {((Number(item.price) || 0) * (Number(item.quantity) || 0)).toFixed(2)}
                            </div>
                            <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border ${getStatusColor(item.status)}`}>
                              {getStatusIcon(item.status)}
                              <span className="capitalize">{item.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Reports; 