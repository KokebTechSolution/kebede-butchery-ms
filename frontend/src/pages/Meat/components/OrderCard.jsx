import React, { useState } from 'react';
import { CheckIcon, XIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { RejectOrderDialog } from './RejectOrderDialog';

export const OrderCard = ({ order, onAccept, onReject, showActions = true }) => {
  const [showRejectDialog, setShowRejectDialog] = useState(false);

  const handleAccept = () => {
    onAccept(order.order_number);
  };

  const handleRejectClick = () => {
    setShowRejectDialog(true);
  };

  const handleRejectConfirm = (orderId, reason) => {
    onReject(orderId, reason);
    setShowRejectDialog(false);
  };

  return (
    <>
      <Card className="w-full rounded-xl border-0 mb-4 transition-all duration-300 ease-in-out">
        <CardContent className="p-4">
          <div className="flex justify-between w-full">
            <div className="flex flex-col gap-1">
              <p className="font-['Work_Sans',Helvetica] text-sm text-[#6b7582]">
                Order {order.order_number}
              </p>

              <h3 className="font-['Work_Sans',Helvetica] font-bold text-base text-[#111416]">
                {order.items.length} items
              </h3>

              {order.rejectionReason && (
                <p className="font-['Work_Sans',Helvetica] text-sm text-red-600 bg-red-50 px-2 py-1 rounded mt-1">
                  Rejected: {order.rejectionReason}
                </p>
              )}

              {showActions && (
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="secondary"
                    onClick={handleAccept}
                    className="h-8 rounded-2xl px-4 py-0 bg-green-100 hover:bg-green-200 font-['Work_Sans',Helvetica] font-medium text-sm text-green-800 border-green-300"
                  >
                    Accept
                    <CheckIcon className="ml-1 h-4 w-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    onClick={handleRejectClick}
                    className="h-8 rounded-2xl px-4 py-0 bg-red-100 hover:bg-red-200 font-['Work_Sans',Helvetica] font-medium text-sm text-red-800 border-red-300"
                  >
                    Reject
                    <XIcon className="ml-1 h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="font-['Work_Sans',Helvetica] font-medium text-black text-sm">
              <div className="text-center">
                <p className="mb-2 font-semibold">Items:</p>
                {order.items.map((item, index) => (
                  <p key={index} className="leading-relaxed">
                    {item.quantity} {item.name}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {showActions && (
        <RejectOrderDialog
          isOpen={showRejectDialog}
          onClose={() => setShowRejectDialog(false)}
          onConfirm={handleRejectConfirm}
          orderId={order.order_number}
        />
      )}
    </>
  );
};