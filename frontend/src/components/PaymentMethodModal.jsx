import React, { useState } from 'react';
import { X, CreditCard, DollarSign } from 'lucide-react';
import './PaymentMethodModal.css';

const PaymentMethodModal = ({ isOpen, onClose, onConfirm, selectedTable }) => {
  const [selectedMethod, setSelectedMethod] = useState('cash');

  const handleConfirm = () => {
    if (selectedMethod) {
      onConfirm(selectedMethod);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal">
        <div className="payment-modal-header">
          <h2>Select Payment Method</h2>
          <button onClick={onClose} className="close-btn">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="payment-modal-content">
          <div className="table-info">
            <h3>Table {selectedTable?.number}</h3>
            <p>Choose how you'd like to handle payment for this order</p>
          </div>
          
          <div className="payment-options">
            <div 
              className={`payment-option ${selectedMethod === 'cash' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('cash')}
            >
              <div className="payment-option-icon">
                <DollarSign className="w-8 h-8" />
              </div>
              <div className="payment-option-content">
                <h4>Cash Payment</h4>
                <p>Customer will pay with cash at the counter</p>
              </div>
              <div className="payment-option-radio">
                <div className={`radio-circle ${selectedMethod === 'cash' ? 'selected' : ''}`}></div>
              </div>
            </div>
            
            <div 
              className={`payment-option ${selectedMethod === 'online' ? 'selected' : ''}`}
              onClick={() => setSelectedMethod('online')}
            >
              <div className="payment-option-icon">
                <CreditCard className="w-8 h-8" />
              </div>
              <div className="payment-option-content">
                <h4>Online Payment</h4>
                <p>Customer will pay online (card, mobile money, etc.)</p>
              </div>
              <div className="payment-option-radio">
                <div className={`radio-circle ${selectedMethod === 'online' ? 'selected' : ''}`}></div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="payment-modal-footer">
          <button onClick={onClose} className="cancel-btn">
            Cancel
          </button>
          <button 
            onClick={handleConfirm} 
            className="confirm-btn"
            disabled={!selectedMethod}
          >
            Confirm & Place Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodModal;

