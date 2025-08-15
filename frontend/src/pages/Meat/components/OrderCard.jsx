import React, { useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { FaPrint, FaUser, FaClock, FaLock } from 'react-icons/fa';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { RejectOrderDialog } from './RejectOrderDialog';

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

  // Get order status for visual indication
  const getOrderStatus = () => {
    const pendingItems = order.items.filter(item => item.status === 'pending');
    const acceptedItems = order.items.filter(item => item.status === 'accepted');
    const rejectedItems = order.items.filter(item => item.status === 'rejected');
    
    if (pendingItems.length > 0) return 'pending';
    if (acceptedItems.length > 0 && rejectedItems.length === 0) return 'accepted';
    if (rejectedItems.length > 0) return 'rejected';
    return 'mixed';
  };

  const orderStatus = getOrderStatus();

  return (
    <>
      <Card className={`w-full max-w-4xl rounded-2xl border-2 shadow-lg mb-6 transition-all duration-300 ease-in-out bg-white/90 backdrop-blur-sm hover:shadow-xl hover:-translate-y-1 ${
        orderStatus === 'pending' ? 'border-orange-200 shadow-orange-100' :
        orderStatus === 'accepted' ? 'border-green-200 shadow-green-100' :
        orderStatus === 'rejected' ? 'border-red-200 shadow-red-100' :
        'border-gray-200 shadow-gray-100'
      }`}>
        <CardContent className="p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between w-full gap-4 mb-6">
            <div className="flex flex-col gap-2 min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                  orderStatus === 'pending' ? 'bg-orange-100 text-orange-700' :
                  orderStatus === 'accepted' ? 'bg-green-100 text-green-700' :
                  orderStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-700'
                }">
                  <span className={`w-2 h-2 rounded-full ${
                    orderStatus === 'pending' ? 'bg-orange-500' :
                    orderStatus === 'accepted' ? 'bg-green-500' :
                    orderStatus === 'rejected' ? 'bg-red-500' :
                    'bg-gray-500'
                  }`}></span>
                  {orderStatus.charAt(0).toUpperCase() + orderStatus.slice(1)}
                </span>
                <span className="text-sm text-gray-500">#{order.order_number}</span>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <FaUser className="text-orange-500" />
                  {order.waiterName || order.created_by_username || 'Unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <FaClock className="text-blue-500" />
                  {order.created_at ? new Date(order.created_at).toLocaleTimeString() : ''}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-gray-800">
                {order.items.length} item{order.items.length !== 1 ? 's' : ''}
              </h3>
            </div>
            <div className="text-right flex-shrink-0">
              <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-none block">
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
                  <span className="font-medium flex-shrink-0 text-sm sm:text-base">${(Number(item.price || 0) * item.quantity).toFixed(2)}</span>
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