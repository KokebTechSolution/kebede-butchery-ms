import React, { useState } from 'react';
import { X, CreditCard, DollarSign, Camera } from 'lucide-react';
import CameraCapture from './CameraCapture/CameraCapture';
import './PaymentMethodModal.css';

const PaymentMethodModal = ({ isOpen, onClose, onConfirm, selectedTable }) => {
  const [selectedMethod, setSelectedMethod] = useState('cash');
  const [showCamera, setShowCamera] = useState(false);
  const [capturedReceipt, setCapturedReceipt] = useState(null);

  const handleConfirm = () => {
    if (selectedMethod === 'online' && !capturedReceipt) {
      // For online payment, require receipt capture first
      setShowCamera(true);
      return;
    }
    
    if (selectedMethod) {
      onConfirm(selectedMethod, capturedReceipt);
      onClose();
    }
  };

  const handleMethodSelect = (method) => {
    setSelectedMethod(method);
    // Clear captured receipt when switching methods
    if (method === 'cash') {
      setCapturedReceipt(null);
    }
  };

  const handleReceiptCapture = (receiptData) => {
    setCapturedReceipt(receiptData);
    setShowCamera(false);
  };

  const handleClose = () => {
    setCapturedReceipt(null);
    setShowCamera(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="payment-modal-overlay">
        <div className="payment-modal">
          <div className="payment-modal-header">
            <h2>Select Payment Method</h2>
            <button onClick={handleClose} className="close-btn">
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
                onClick={() => handleMethodSelect('cash')}
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
                onClick={() => handleMethodSelect('online')}
              >
                <div className="payment-option-icon">
                  <CreditCard className="w-8 h-8" />
                </div>
                <div className="payment-option-content">
                  <h4>Online Payment</h4>
                  <p>Customer will pay online (card, mobile money, etc.)</p>
                  {capturedReceipt && (
                    <div className="receipt-status">
                      <Camera className="w-4 h-4 text-green-500" />
                      <span className="text-green-600 text-sm">Receipt captured</span>
                    </div>
                  )}
                </div>
                <div className="payment-option-radio">
                  <div className={`radio-circle ${selectedMethod === 'online' ? 'selected' : ''}`}></div>
                </div>
              </div>
            </div>

            {/* Receipt capture section for online payments */}
            {selectedMethod === 'online' && (
              <div className="receipt-capture-section">
                <div className="receipt-capture-header">
                  <h4>Payment Receipt</h4>
                  <p>Capture the customer's payment receipt for verification</p>
                </div>
                
                {capturedReceipt ? (
                  <div className="receipt-preview">
                    <img 
                      src={capturedReceipt.url} 
                      alt="Payment receipt" 
                      className="receipt-thumbnail"
                    />
                    <div className="receipt-actions">
                      <button 
                        onClick={() => setShowCamera(true)}
                        className="recapture-btn"
                      >
                        <Camera className="w-4 h-4" />
                        Recapture
                      </button>
                      <button 
                        onClick={() => setCapturedReceipt(null)}
                        className="remove-btn"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button 
                    onClick={() => setShowCamera(true)}
                    className="capture-receipt-btn"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Receipt
                  </button>
                )}
              </div>
            )}
          </div>
          
          <div className="payment-modal-footer">
            <button onClick={handleClose} className="cancel-btn">
              Cancel
            </button>
            <button 
              onClick={handleConfirm} 
              className="confirm-btn"
              disabled={!selectedMethod || (selectedMethod === 'online' && !capturedReceipt)}
            >
              {selectedMethod === 'online' && !capturedReceipt 
                ? 'Capture Receipt First' 
                : 'Confirm & Place Order'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraCapture
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onCapture={handleReceiptCapture}
        title="Capture Payment Receipt"
      />
    </>
  );
};

export default PaymentMethodModal;

