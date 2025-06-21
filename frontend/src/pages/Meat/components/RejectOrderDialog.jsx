import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';

const rejectReasons = [
  { value: 'out-of-ingredient', label: 'Out of ingredient' },
  { value: 'waiter-cancel', label: 'Waiter asked to cancel' },
  { value: 'custom', label: 'Custom reason' },
];

export const RejectOrderDialog = ({ isOpen, onClose, onConfirm, orderId }) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'custom' ? customReason : 
                  rejectReasons.find(r => r.value === selectedReason)?.label || '';
    
    if (reason.trim()) {
      onConfirm(orderId, reason);
      handleClose();
    }
  };

  const handleClose = () => {
    setSelectedReason('');
    setCustomReason('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reject Order {orderId}</DialogTitle>
          <DialogDescription>
            Please select a reason for rejecting this order.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              Reason for rejection
            </label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder="Select a reason" />
              </SelectTrigger>
              <SelectContent>
                {rejectReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {reason.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedReason === 'custom' && (
            <div className="grid gap-2">
              <label htmlFor="custom-reason" className="text-sm font-medium">
                Custom reason
              </label>
              <Input
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom reason..."
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'custom' && !customReason.trim())}
            className="bg-red-600 hover:bg-red-700"
          >
            Reject Order
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};