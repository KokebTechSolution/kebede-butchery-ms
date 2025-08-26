import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api';

import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const cookie = c.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

const EditInventoryForm = ({ product, itemTypes, categories, onClose, onSuccess }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const branchId = user?.branch || null;

  const [formData, setFormData] = useState({
    name: product.name || '',
    description: product.description || '',
    category: product.category?.id || '',
    base_unit_price: product.base_unit_price || '',
    base_unit_id: product.base_unit?.id || '',
  });

  const [stockId, setStockId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({
    restock_quantity: '',
    restock_type: '',
    price_per_unit: '',
    receipt_file: null,
    receipt_filename: '',
  });
  const [restockError, setRestockError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [calculatedTotal, setCalculatedTotal] = useState(0);
  const [validRestockUnits, setValidRestockUnits] = useState([]);
  const [loadingValidUnits, setLoadingValidUnits] = useState(false);

  // Calculate total amount when quantity or price changes
  useEffect(() => {
    const quantity = parseFloat(restockData.restock_quantity) || 0;
    const price = parseFloat(restockData.price_per_unit) || 0;
    setCalculatedTotal(quantity * price);
  }, [restockData.restock_quantity, restockData.price_per_unit]);

  // Fetch valid restock units when modal opens
  useEffect(() => {
    if (showRestockModal && product.id) {
      fetchValidRestockUnits();
    }
  }, [showRestockModal, product.id]);

  const fetchValidRestockUnits = async () => {
    setLoadingValidUnits(true);
    try {
      // Use the new valid_units endpoint
      const res = await axios.get(``${API_BASE_URL}/api/inventory/products/${product.id}/valid_units/`, {
        withCredentials: true,
      });
      
      if (res.data.valid_units && res.data.valid_units.length > 0) {
        setValidRestockUnits(res.data.valid_units);
        // Set default restock type to first available unit
        if (!restockData.restock_type) {
          setRestockData(prev => ({ ...prev, restock_type: res.data.valid_units[0] }));
        }
      } else {
        // Fallback to common units if no valid units found
        setValidRestockUnits([`'carton', 'bottle', 'unit']);
        if (!restockData.restock_type) {
          setRestockData(prev => ({ ...prev, restock_type: 'carton' }));
        }
      }
    } catch (error) {
      console.error('Error fetching valid units:', error);
      // Fallback to common units
      setValidRestockUnits(['carton', 'bottle', 'unit']);
      if (!restockData.restock_type) {
        setRestockData(prev => ({ ...prev, restock_type: 'carton' }));
      }
    } finally {
      setLoadingValidUnits(false);
    }
  };

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get('`${API_BASE_URL}/api/inventory/stocks/`', {
          withCredentials: true,
        });
        const branchStock = res.data.find(
          (stock) => stock.product.id === product.id && stock.branch.id === branchId
        );
        if (branchStock) {
          setStockId(branchStock.id);
          console.log('[FRONTEND DEBUG] Stock data received:', branchStock);
          setFormData((prev) => ({
            ...prev,
            // Use the correct fields from the Stock model
            quantity_in_base_units: branchStock.quantity_in_base_units,
            original_quantity: branchStock.original_quantity,
            original_unit: branchStock.original_unit?.unit_name,
            minimum_threshold: branchStock.minimum_threshold_base_units,
            running_out: branchStock.running_out,
          }));
        }
      } catch (error) {
        console.error('Error loading stock:', error);
      }
    };
    fetchStock();
  }, [product.id, branchId]);

  useEffect(() => {
    if (formData.quantityType === 'carton') {
      const bottles =
        (Number(formData.bottles_per_carton) || 0) * (Number(formData.carton_quantity) || 0);
      setFormData((prev) => ({ ...prev, bottle_quantity: bottles.toString() }));
    }
  }, [formData.bottles_per_carton, formData.carton_quantity, formData.quantityType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleRestockChange = (e) => {
    const { name, value, files } = e.target;
    
    console.log('handleRestockChange called:', { name, value, files });
    
    if (name === 'receipt_file' && files) {
      const file = files[0];
      setRestockData((prev) => ({ 
        ...prev, 
        receipt_file: file,
        receipt_filename: file.name 
      }));
    } else {
      setRestockData((prev) => {
        const newData = { ...prev, [name]: value };
        console.log('Updated restockData:', newData);
        
        // Special debugging for price_per_unit
        if (name === 'price_per_unit') {
          console.log('Price per unit changed:', {
            oldValue: prev.price_per_unit,
            newValue: value,
            type: typeof value,
            isEmpty: value === '',
            isZero: Number(value) === 0
          });
        }
        
        return newData;
      });
    }
  };

  const validateRestockForm = () => {
    let err = {};
    if (!restockData.restock_quantity || Number(restockData.restock_quantity) <= 0) {
      err.quantity = 'Enter a valid restock quantity.';
    }
    if (!restockData.price_per_unit || restockData.price_per_unit === '' || Number(restockData.price_per_unit) <= 0) {
      err.price = 'Enter a valid price per unit.';
    }
    // Make receipt optional for now
    // if (!restockData.receipt_file) {
    //   err.receipt = 'Please upload a receipt file.';
    // }
    if (!restockData.restock_type) {
      err.restock_type = 'Please select a restock type.';
    }
    console.log('validateRestockForm - restockData:', restockData);
    console.log('validateRestockForm - errors:', err);
    return err;
  };

  const validateForm = () => {
    let err = {};
    if (!formData.name.trim()) err.name = t('name_required');
    if (!formData.category) err.category = t('category_required');
    if (!formData.price_per_unit || Number(formData.price_per_unit) < 0)
      err.price_per_unit = t('valid_price_required');
    if (!formData.quantityType) err.quantityType = t('choose_quantity_type');

    if (formData.quantityType === 'carton') {
      if (!formData.bottles_per_carton || Number(formData.bottles_per_carton) <= 0)
        err.bottles_per_carton = t('required');
      if (!formData.carton_quantity || Number(formData.carton_quantity) < 0)
        err.carton_quantity = t('required');
    } else if (formData.quantityType === 'bottle') {
      if (formData.bottle_quantity === '' || Number(formData.bottle_quantity) < 0)
        err.bottle_quantity = t('required');
    } else if (formData.quantityType === 'unit') {
      if (formData.unit_quantity === '' || Number(formData.unit_quantity) < 0)
        err.unit_quantity = t('required');
    }

    if (formData.minimum_threshold === '' || Number(formData.minimum_threshold) < 0)
      err.minimum_threshold = t('threshold_required');

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async () => {
    let err = {};
    if (!formData.name.trim()) err.name = t('name_required');
    if (!formData.description.trim()) err.description = t('required');
    if (!formData.category) err.category = t('category_required');
    if (!formData.base_unit_price || Number(formData.base_unit_price) < 0) err.base_unit_price = t('valid_price_required');
    if (!formData.base_unit_id) err.base_unit_id = t('required');
    setErrors(err);
    if (Object.keys(err).length > 0) return;

    const updatedProduct = {
      name: formData.name,
      description: formData.description,
      base_unit_price: formData.base_unit_price,
      base_unit_id: formData.base_unit_id,
      category_id: formData.category,
    };
    const csrfToken = getCookie('csrftoken');
    try {
      await axios.put(
        ``${API_BASE_URL}/api/inventory/products/${product.id}/`,
        updatedProduct,
        {
          withCredentials: true,
          headers: { `'X-CSRFToken': csrfToken },
        }
      );
      alert(t('inventory_updated'));
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Update failed:', err.response?.data || err.message);
      alert(`${t('error_updating_inventory')}: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleRestock = async () => {
    setRestockError('');
    const validationErrors = validateRestockForm();
    
    console.log('Validation errors:', validationErrors);
    console.log('Current restockData:', restockData);
    
    if (Object.keys(validationErrors).length > 0) {
      setRestockError(Object.values(validationErrors).join(', '));
      return;
    }

    // Check if stockId exists
    if (!stockId) {
      setRestockError('❌ No stock found for this product and branch. Please contact admin to create initial stock.');
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('quantity', restockData.restock_quantity);
      formDataToSend.append('type', restockData.restock_type);
      formDataToSend.append('price_per_unit', restockData.price_per_unit);
      formDataToSend.append('total_amount', calculatedTotal);
      if (restockData.receipt_file) {
        formDataToSend.append('receipt', restockData.receipt_file);
      }

      // Debug logging - check each field individually
      console.log('=== RESTOCK DEBUG ===');
      console.log('stockId:', stockId);
      console.log('restockData.restock_quantity:', restockData.restock_quantity, typeof restockData.restock_quantity);
      console.log('restockData.restock_type:', restockData.restock_type, typeof restockData.restock_type);
      console.log('restockData.price_per_unit:', restockData.price_per_unit, typeof restockData.price_per_unit);
      console.log('calculatedTotal:', calculatedTotal, typeof calculatedTotal);
      console.log('receipt_file:', restockData.receipt_file);
      
      // Check FormData contents
      console.log('FormData contents:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value, typeof value);
      }

      await axios.post(
        ``${API_BASE_URL}/api/inventory/stocks/${stockId}/restock/`,
        formDataToSend,
        {
          withCredentials: true,
          headers: { 
            `'X-CSRFToken': getCookie('csrftoken'),
            'Content-Type': 'multipart/form-data'
          },
        }
      );
      
      alert('✅ Restocked successfully!');
      setShowRestockModal(false);
      // Reset restock data
      setRestockData({
        restock_quantity: '',
        restock_type: '',
        price_per_unit: '',
        receipt_file: null,
        receipt_filename: '',
      });
      setCalculatedTotal(0);
      onSuccess();
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message;
      console.error('Restock error response:', err.response?.data);
      console.error('Full error object:', err);
      setRestockError('❌ Restock failed: ' + errorMessage);
      
      // If it's a conversion error, provide helpful guidance
      if (errorMessage.includes('No conversion path found')) {
        setRestockError('❌ Restock failed: No conversion exists for this unit. Please contact admin to set up unit conversions for this product.');
      }
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product and its stock?')) return;
    setIsDeleting(true);
    try {
      await axios.delete(``${API_BASE_URL}/api/inventory/products/${product.id}/`, {
        withCredentials: true,
        headers: { `'X-CSRFToken': getCookie('csrftoken') },
      });
      if (stockId) {
        await axios.delete(``${API_BASE_URL}/api/inventory/stocks/${stockId}/`, {
          withCredentials: true,
          headers: { `'X-CSRFToken': getCookie('csrftoken') },
        });
      }
      alert('Product and stock deleted.');
      onSuccess();
      onClose();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    } finally {
      setIsDeleting(false);
    }
  };

  const resetRestockForm = () => {
    setRestockData({
      restock_quantity: '',
      restock_type: '',
      price_per_unit: '',
      receipt_file: null,
      receipt_filename: '',
    });
    setCalculatedTotal(0);
    setRestockError('');
    setValidRestockUnits([]);
  };

  const openRestockModal = () => {
    setShowRestockModal(true);
    resetRestockForm();
  };

  return (
    <div className="space-y-4">
      {/* Product Name (read-only, always visible) */}
      <div>
        <label className="block font-semibold mb-1">{t('product_name')}</label>
        <input
          type="text"
          value={product.name || ''}
          className="border p-2 w-full bg-gray-100"
          readOnly
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">{t('description')}</label>
        <input
          type="text"
          name="description"
          value={formData.description}
          placeholder={t('description')}
          onChange={handleChange}
          className="border p-2 w-full"
        />
        {errors.description && <p className="text-red-500 text-sm">{errors.description}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">{t('category')}</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="border p-2 w-full"
        >
          <option value="">{t('select_category')}</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.category_name}</option>
          ))}
        </select>
        {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">{t('base_unit_price')}</label>
        <input
          type="number"
          name="base_unit_price"
          value={formData.base_unit_price}
          className="border p-2 w-full bg-gray-100"
          readOnly
          placeholder={t('base_unit_price')}
          aria-label={t('base_unit_price')}
        />
        {errors.base_unit_price && <p className="text-red-500 text-sm">{errors.base_unit_price}</p>}
      </div>

      <div>
        <label className="block font-semibold mb-1">{t('base_unit')}</label>
        <input
          type="text"
          name="base_unit_id"
          value={formData.base_unit_id}
          className="border p-2 w-full bg-gray-100"
          readOnly
          placeholder={t('base_unit')}
          aria-label={t('base_unit')}
        />
      </div>

      <div>
        <label className="block font-semibold mb-1">{t('branch')}</label>
        <input
          type="text"
          value={product.branch?.name || ''}
          className="border p-2 w-full bg-gray-100"
          readOnly
          placeholder={t('branch')}
          aria-label={t('branch')}
        />
      </div>

      {/* Stock Status Message */}
      {!stockId && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-sm font-medium text-yellow-800">
                No stock record found for this product and branch.
              </p>
              <p className="text-xs text-yellow-700 mt-1">
                Contact an administrator to create initial stock before restocking.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between mt-6">
        <div className="flex space-x-3">
          <button 
            onClick={openRestockModal} 
            disabled={!stockId}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 flex items-center space-x-2 ${
              stockId 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>{stockId ? 'Restock' : 'No Stock'}</span>
          </button>
          <button 
            onClick={handleSubmit} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
          {t('save_changes')}
        </button>
        </div>
        <button 
          onClick={onClose} 
          className="bg-gray-400 text-white px-4 py-2 rounded-lg hover:bg-gray-500 transition-colors duration-200"
        >
          {t('cancel')}
        </button>
      </div>

      {/* Enhanced Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-white flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>Restock Product</span>
                </h2>
            <button
                  onClick={() => {
                    setShowRestockModal(false);
                    resetRestockForm();
                  }}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
            </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Product Info */}
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <h3 className="font-semibold text-gray-800 mb-2">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600">Name:</span>
                    <span className="ml-2 text-gray-800">{product.name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600">Current Price:</span>
                    <span className="ml-2 text-gray-800">${product.base_unit_price || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {restockError && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl">
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="font-medium">{restockError}</span>
                  </div>
                </div>
              )}

              {/* Debug Section - Remove in production */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove in production)</h3>
                <div className="text-sm text-yellow-700 space-y-1">
                  <div><strong>restock_quantity:</strong> {restockData.restock_quantity || 'None'} (type: {typeof restockData.restock_quantity})</div>
                  <div><strong>restock_type:</strong> {restockData.restock_type || 'None'}</div>
                  <div><strong>price_per_unit:</strong> {restockData.price_per_unit || 'None'} (type: {typeof restockData.price_per_unit})</div>
                  <div><strong>calculatedTotal:</strong> {calculatedTotal} (type: {typeof calculatedTotal})</div>
                  <div><strong>receipt_file:</strong> {restockData.receipt_file ? restockData.receipt_file.name : 'None'}</div>
                  <div><strong>Full restockData:</strong> {JSON.stringify(restockData, null, 2)}</div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Quantity */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Quantity to Restock *
                  </label>
              <input
                type="number"
                name="restock_quantity"
                value={restockData.restock_quantity}
                onChange={handleRestockChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                    placeholder="Enter quantity"
                    min="1"
                    step="1"
              />
            </div>

                {/* Restock Type */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Restock Type *
                  </label>
                  {loadingValidUnits ? (
                    <div className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500">
                      Loading available units...
                    </div>
                  ) : validRestockUnits.length === 0 ? (
                    <div className="w-full px-4 py-3 border border-red-300 rounded-xl bg-red-50 text-red-600">
                      No valid units configured for this product
                    </div>
                  ) : (
              <select
                name="restock_type"
                value={restockData.restock_type}
                onChange={handleRestockChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
              >
                      <option value="">Select restock type</option>
                      {validRestockUnits.map(unit => (
                        <option key={unit} value={unit}>
                          {unit.charAt(0).toUpperCase() + unit.slice(1)}
                        </option>
                      ))}
              </select>
                  )}
                  {validRestockUnits.length === 0 && (
                    <p className="text-xs text-red-500">
                      Please contact admin to configure unit conversions for this product.
                    </p>
                  )}
                </div>

                {/* Price Per Unit */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Price Per Unit *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="number"
                      name="price_per_unit"
                      value={restockData.price_per_unit || ''}
                      onChange={handleRestockChange}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all duration-200"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Calculated Total (Read-only) */}
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700">
                    Total Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                    <input
                      type="text"
                      value={calculatedTotal.toFixed(2)}
                      className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-700 cursor-not-allowed"
                      readOnly
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    Automatically calculated: Quantity × Price Per Unit
                  </p>
                </div>
              </div>

              {/* Receipt Upload */}
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-700">
                  Receipt Upload (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-green-400 transition-colors duration-200">
                  <input
                    type="file"
                    name="receipt_file"
                    onChange={handleRestockChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                    id="receipt-upload"
                  />
                  <label htmlFor="receipt-upload" className="cursor-pointer">
                    <div className="space-y-2">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-gray-600">
                        <span className="font-medium text-green-600 hover:text-green-500">
                          Click to upload
                        </span>
                        <span className="text-gray-500"> or drag and drop</span>
                      </div>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF, DOC up to 10MB
                      </p>
                    </div>
                  </label>
                </div>
                {restockData.receipt_filename && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm text-green-800 font-medium">
                        {restockData.receipt_filename}
                      </span>
                    </div>
                  </div>
                )}
            </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={handleRestock}
                  disabled={loadingValidUnits || validRestockUnits.length === 0}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center space-x-2 ${
                    loadingValidUnits || validRestockUnits.length === 0
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105'
                  }`}
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>
                    {loadingValidUnits ? 'Loading...' : validRestockUnits.length === 0 ? 'No Valid Units' : 'Confirm Restock'}
                  </span>
              </button>
                <button
                  onClick={() => {
                    setShowRestockModal(false);
                    resetRestockForm();
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-400 transition-colors duration-200"
                >
                Cancel
              </button>
              </div>
              
              {/* Test Button for Debugging */}
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 mb-2">Debug: Test with hardcoded values</p>
                <button
                  onClick={async () => {
                    console.log('Testing with hardcoded values...');
                    const testFormData = new FormData();
                    testFormData.append('quantity', '10');
                    testFormData.append('type', 'carton');
                    testFormData.append('price_per_unit', '5.00');
                    testFormData.append('total_amount', '50.00');
                    
                    console.log('Test FormData contents:');
                    for (let [key, value] of testFormData.entries()) {
                      console.log(`${key}:`, value, typeof value);
                    }
                    
                    try {
                      await axios.post(
                        ``${API_BASE_URL}/api/inventory/stocks/${stockId}/restock/`,
                        testFormData,
                        {
                          withCredentials: true,
                          headers: { 
                            `'X-CSRFToken': getCookie('csrftoken'),
                            'Content-Type': 'multipart/form-data'
                          },
                        }
                      );
                      alert('✅ Test restock successful!');
                    } catch (err) {
                      console.error('Test restock failed:', err.response?.data);
                      alert('❌ Test restock failed: ' + (err.response?.data?.detail || err.message));
                    }
                  }}
                  className="bg-blue-500 text-white px-4 py-2 rounded text-sm hover:bg-blue-600"
                >
                  Test Restock (Hardcoded)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditInventoryForm;
