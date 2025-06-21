import React, { useState } from 'react';
import { OrderListSection } from './sections/OrderListSection';
import { OrderCard } from '../../components/OrderCard';
import { useOrders } from '../../hooks/useOrders';

export const Pending = () => {
  const { acceptOrder, rejectOrder, getPendingOrders, getRejectedOrders } = useOrders();
  const [activeTab, setActiveTab] = useState('pending');

  const pendingOrders = getPendingOrders();
  const rejectedOrders = getRejectedOrders();

  const handleAcceptOrder = (orderId) => {
    acceptOrder(orderId);
  };

  const handleRejectOrder = (orderId, reason) => {
    rejectOrder(orderId, reason);
  };

  const displayOrders = activeTab === 'pending' ? pendingOrders : rejectedOrders;

  return (
    <main className="flex flex-col w-full bg-white min-h-screen">
      <section className="flex justify-center px-40 py-5 w-full flex-1">
        <div className="flex flex-col max-w-[960px] w-full">
          <header className="flex flex-wrap items-start gap-3 p-4 w-full">
            <div className="w-72">
              <h1 className="font-bold text-[32px] leading-10 font-sans text-[#111416]">
                Orders
              </h1>
            </div>
          </header>

          <OrderListSection activeTab={activeTab} onTabChange={setActiveTab} />
          
          <div className="px-4 py-2">
            {displayOrders.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-[#6b7582] text-lg">
                  {activeTab === 'pending' ? 'No pending orders' : 'No rejected orders'}
                </p>
              </div>
            ) : (
              <div className="space-y-0">
                {displayOrders.map((order) => (
                  <OrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    showActions={activeTab === 'pending'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
};