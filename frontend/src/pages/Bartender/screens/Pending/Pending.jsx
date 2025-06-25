import React, { useState } from 'react';
import { useDrinks } from '../../hooks/useDrinks';
// We can reuse the OrderCard and other components from the Meat section if they are generic enough
// For now, let's just display the basics.

export const Pending = () => {
  const { 
    acceptOrder, 
    rejectOrder, 
    getPendingOrders, 
    getRejectedOrders 
  } = useDrinks();
  const [activeTab, setActiveTab] = useState('pending');

  const pendingOrders = getPendingOrders();
  const rejectedOrders = getRejectedOrders();

  const displayOrders = activeTab === 'pending' ? pendingOrders : rejectedOrders;

  return (
    <main className="flex flex-col w-full bg-white min-h-screen">
      <div className="flex flex-col max-w-[960px] w-full mx-auto">
        {/* Simplified tab structure for now */}
        <div className="flex justify-center border-b">
          <button onClick={() => setActiveTab('pending')} className={`p-4 ${activeTab === 'pending' ? 'border-b-2 border-blue-500' : ''}`}>
            Pending
          </button>
          <button onClick={() => setActiveTab('rejected')} className={`p-4 ${activeTab === 'rejected' ? 'border-b-2 border-blue-500' : ''}`}>
            Rejected
          </button>
        </div>
        
        <div className="px-4 py-2">
          {displayOrders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {activeTab === 'pending' ? 'No pending drink orders' : 'No rejected drink orders'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayOrders.map((order) => (
                <div key={order.id} className="p-4 border rounded-lg shadow-sm">
                  <h3 className="font-bold">Order #{order.order_number}</h3>
                  <ul>
                    {order.items.map(item => (
                      <li key={item.id}>{item.quantity} x {item.name}</li>
                    ))}
                  </ul>
                  {activeTab === 'pending' && (
                    <div className="flex gap-2 mt-4">
                      <button onClick={() => acceptOrder(order.id)} className="bg-green-500 text-white px-4 py-2 rounded">
                        Accept
                      </button>
                      <button onClick={() => rejectOrder(order.id, 'Out of stock')} className="bg-red-500 text-white px-4 py-2 rounded">
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
};

export default Pending; 