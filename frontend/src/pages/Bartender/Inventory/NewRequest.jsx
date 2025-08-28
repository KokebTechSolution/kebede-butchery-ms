// src/components/NewRequest.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const NewRequest = ({
  showModal,
  setShowModal,
  formData,
  formMessage,
  products,
  branches,
  handleFormChange,
  handleFormSubmit,
  defaultMeasurement,
  stocks // Add stocks prop to see available quantities
}) => {
  const { t } = useTranslation();
  const [selectedProductStock, setSelectedProductStock] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  
  // 🔧 NEW: Find the selected product's stock information from main store stocks
  useEffect(() => {
    if (formData.product && stocks) {
      const stock = stocks.find(s => s.product === parseInt(formData.product));
      setSelectedProductStock(stock);
      
      // Also get the product details for input unit info
      const product = products.find(p => p.id === parseInt(formData.product));
      setSelectedProduct(product);
      
      // 🔧 DEBUG: Log what we're getting
      console.log('🔧 NewRequest - Selected product and stock:', {
        productId: formData.product,
        stock: stock,
        product: product,
        stocksLength: stocks.length,
        inputQuantity: stock?.input_quantity,
        calculatedBaseUnits: stock?.calculated_base_units
      });
    } else {
      setSelectedProductStock(null);
      setSelectedProduct(null);
    }
  }, [formData.product, stocks, products]);

  if (!showModal) return null;

  // 🔧 NEW: Get available quantity in input units
  const getAvailableInputQuantity = () => {
    if (selectedProduct) {
      let quantity = 0; // Start with 0, no default restriction
      
      if (selectedProductStock) {
        // Try to get real quantity if stock data exists
        const realQuantity = selectedProductStock.input_quantity || 
                           selectedProductStock.original_quantity || 
                           selectedProductStock.quantity_in_base_units || 
                           selectedProductStock.calculated_base_units;
        
        if (realQuantity && realQuantity > 0) {
          quantity = realQuantity;
          console.log('🔧 Using real stock quantity:', realQuantity);
        } else {
          console.log('🔧 Stock data exists but no valid quantity found');
        }
      } else {
        console.log('🔧 No stock data found');
      }
      
      console.log('🔧 Available quantity for', selectedProduct.name, ':', quantity);
      return quantity;
    }
    
    console.log('🔧 No product selected');
    return 0;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
        <h2 className="text-lg font-semibold mb-4">{t('new_inventory_request')}</h2>
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
          aria-label={t('close_modal')}
        >
          &times;
        </button>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">{t('product')}</label>
            <select
              name="product"
              value={formData.product}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">{t('select_product')}</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          {/* 🔧 NEW: Show available stock information with both input and base units */}
          {selectedProductStock && selectedProduct && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <div className="font-medium mb-2">📦 Available Stock Information:</div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-medium">Input Unit ({selectedProduct.input_unit?.unit_name || 'N/A'}):</span>
                    <span className="font-bold text-green-600">
                      {selectedProductStock.input_quantity || 0} {selectedProduct.input_unit?.unit_name || 'units'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-blue-600 font-medium">Base Unit ({selectedProduct.base_unit?.unit_name || 'N/A'}):</span>
                    <span className="font-bold text-blue-600">
                      {selectedProductStock.calculated_base_units || 0} {selectedProduct.base_unit?.unit_name || 'units'}
                    </span>
                  </div>
                  {selectedProduct.conversion_amount && (
                    <div className="text-xs text-blue-600 bg-blue-100 p-2 rounded">
                      💡 Conversion: 1 {selectedProduct.input_unit?.unit_name} = {selectedProduct.conversion_amount} {selectedProduct.base_unit?.unit_name}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">
              {t('quantity')} ({selectedProduct?.input_unit?.unit_name || 'input units'})
            </label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              min="0.01"
              value={formData.quantity}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
              placeholder={`Enter quantity in ${selectedProduct?.input_unit?.unit_name || 'input units'}`}
            />
            {selectedProduct?.input_unit && (
              <p className="text-xs text-gray-500 mt-1">
                Available: {getAvailableInputQuantity()} {selectedProduct.input_unit.unit_name}{getAvailableInputQuantity() !== 1 ? 's' : ''} (No maximum restriction)
              </p>
            )}
          </div>

          {/* Branch is auto-set to bartender's assigned branch */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <div className="text-sm text-gray-800">
              <div className="font-medium mb-1">Branch:</div>
              <div className="text-gray-600">
                {branches.find(b => b.id === parseInt(formData.branch))?.name || 'Loading...'}
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
            disabled={!selectedProduct}
          >
            {selectedProduct ? t('submit_request') : 'Select Product'}
          </button>

          {formMessage && (
            <div className="text-red-500 text-sm mt-2">{formMessage}</div>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
