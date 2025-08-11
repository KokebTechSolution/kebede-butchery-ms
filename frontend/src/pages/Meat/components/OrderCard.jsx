import React, { useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { FaPrint } from 'react-icons/fa';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { RejectOrderDialog } from './RejectOrderDialog';
import { FaLock } from 'react-icons/fa';

export const OrderCard = ({ order, onAcceptOrder, onRejectOrder, onAcceptItem, onRejectItem, onCancelItem, onPrint, showActions = true }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleAccept = () => {
    onAcceptOrder(order.id);
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = (orderId, reason) => {
    onRejectOrder(orderId, reason);
    setShowRejectDialog(false);
  };

  return (
    <>
      <Card className="w-full rounded-xl border-0 mb-4 transition-all duration-300 ease-in-out">
        <CardContent className="p-4">
          <div className="flex justify-between w-full items-center">
            <div className="flex flex-col gap-1">
              <p className="font-['Work_Sans',Helvetica] text-sm text-[#6b7582]">
                Order #{order.order_number} <span className="ml-2 text-gray-500">({order.waiterName || order.created_by_username || 'Unknown'})</span>
                <span className="ml-2 text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
              </p>
              <h3 className="font-['Work_Sans',Helvetica] font-bold text-base text-[#111416]">
                {order.items.length} items
              </h3>
              <span className="text-lg font-bold text-blue-700">${(order.total_money && Number(order.total_money) > 0 ? Number(order.total_money) : order.items.filter(i => i.status === 'accepted').reduce((sum, i) => sum + i.price * i.quantity, 0)).toFixed(2)}</span>
            </div>
            {/* Removed order-level Accept/Reject buttons */}
          </div>
          {/* Item list below, visually separated */}
          <div className="mt-3">
            {/* --- MERGE ITEMS FOR DISPLAY --- */}
            {(() => {
              function mergeDisplayItems(items) {
                const merged = [];
                items.forEach(item => {
                  const found = merged.find(i => i.name === item.name && i.price === item.price && (i.item_type || 'food') === (item.item_type || 'food') && i.status === item.status);
                  if (found) {
                    found.quantity += item.quantity;
                  } else {
                    merged.push({ ...item });
                  }
                });
                return merged;
              }
              const mergedItems = mergeDisplayItems(order.items);
              return mergedItems.map((item, index) => (
                <div key={index} className="flex justify-between items-center text-sm py-1 border-t pt-2">
                  <span>{item.name} × {item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                  <span className="ml-4">
                    {item.status === 'pending' && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => onAcceptItem(item.id)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 px-2 py-0.5 text-xs rounded mr-1"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onRejectItem(item.id, 'Rejected by staff')}
                          className="bg-red-100 text-red-800 hover:bg-red-200 px-2 py-0.5 text-xs rounded mr-1"
                        >
                          Reject
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onCancelItem(item.id)}
                          className="bg-orange-100 text-orange-800 hover:bg-orange-200 px-2 py-0.5 text-xs rounded"
                        >
                          Cancel
                        </Button>
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
              ));
            })()}
          </div>
        </CardContent>
      </Card>
      {showActions && (
        <RejectOrderDialog
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleRejectConfirm}
          orderId={order.id}
        />
      )}
    </>
  );
};