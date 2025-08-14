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

  // Calculate accepted total as fallback if total_money not present
  const acceptedTotal = order.items
    .filter(i => i.status === 'accepted')
    .reduce((sum, i) => sum + i.price * i.quantity, 0);
  const displayTotal = (order.total_money && Number(order.total_money) > 0)
    ? Number(order.total_money)
    : acceptedTotal;

  return (
    <>
      <Card className="w-full max-w-4xl rounded-xl border border-gray-200 shadow-sm mb-4 transition-all duration-300 ease-in-out bg-white">
        <CardContent className="p-4 sm:p-6">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between w-full gap-4">
            <div className="flex flex-col gap-1 min-w-0 flex-1">
              <p className="font-['Work_Sans',Helvetica] text-[12px] sm:text-sm text-[#6b7582] break-words">
                Order #{order.order_number}
                <span className="ml-2 text-gray-500">({order.waiterName || order.created_by_username || 'Unknown'})</span>
                <span className="ml-2 text-[11px] sm:text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}</span>
              </p>
              <h3 className="font-['Work_Sans',Helvetica] font-semibold text-sm sm:text-base text-[#111416]">
                {order.items.length} items
              </h3>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-xl sm:text-2xl font-extrabold text-blue-700 leading-none block">
                ${displayTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Item list below, visually separated */}
          <div className="mt-4">
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
                <div key={index} className="w-full flex flex-wrap justify-between items-center gap-3 text-[13px] sm:text-sm py-3 border-t first:border-t-0">
                  <span className="min-w-0 flex-1 break-words text-sm sm:text-base">{item.name} × {item.quantity}</span>
                  <span className="font-medium flex-shrink-0 text-sm sm:text-base">${(item.price * item.quantity).toFixed(2)}</span>
                  <span className="flex-shrink-0">
                    {item.status === 'pending' && (
                      <>
                        <Button
                          variant="secondary"
                          onClick={() => onAcceptItem(item.id)}
                          className="bg-green-100 text-green-800 hover:bg-green-200 px-2 py-0.5 text-[11px] rounded mr-1"
                        >
                          Accept
                        </Button>
                        <Button
                          variant="secondary"
                          onClick={() => onRejectItem(item.id, 'Rejected by staff')}
                          className="bg-red-100 text-red-800 hover:bg-red-200 px-2 py-0.5 text-[11px] rounded"
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
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 text-green-700 px-2 py-0.5 text-[11px] font-medium">
                        <FaLock className="inline" /> Accepted
                      </span>
                    )}
                    {item.status === 'rejected' && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[11px] font-medium">
                        Rejected
                      </span>
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