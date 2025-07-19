import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  { value: 'out-of-ingredient', labelKey: 'out_of_ingredient' },
  { value: 'waiter-cancel', labelKey: 'waiter_cancel' },
  { value: 'custom', labelKey: 'custom_reason' },
];

export const RejectOrderDialog = ({ isOpen, onClose, onConfirm, orderId }) => {
  const { t } = useTranslation();
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const handleConfirm = () => {
    const reason = selectedReason === 'custom' ? customReason : 
                  rejectReasons.find(r => r.value === selectedReason)?.labelKey || '';
    
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
          <DialogTitle>{t('reject_order')} {orderId}</DialogTitle>
          <DialogDescription>
            {t('select_rejection_reason')}
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="reason" className="text-sm font-medium">
              {t('reason_for_rejection')}
            </label>
            <Select value={selectedReason} onValueChange={setSelectedReason}>
              <SelectTrigger>
                <SelectValue placeholder={t('select_a_reason')} />
              </SelectTrigger>
              <SelectContent>
                {rejectReasons.map((reason) => (
                  <SelectItem key={reason.value} value={reason.value}>
                    {t(reason.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedReason === 'custom' && (
            <div className="grid gap-2">
              <label htmlFor="custom-reason" className="text-sm font-medium">
                {t('custom_reason_label')}
              </label>
              <Input
                id="custom-reason"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder={t('enter_custom_reason')}
              />
            </div>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedReason || (selectedReason === 'custom' && !customReason.trim())}
          >
            {t('reject')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};