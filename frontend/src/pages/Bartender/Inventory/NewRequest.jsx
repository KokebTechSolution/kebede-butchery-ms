// src/components/NewRequest.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosInstance';

const NewRequest = ({
  showModal,
  setShowModal,
  formData,
  setFormData,
  formMessage,
  products,
  branches,
  handleFormChange,
  handleFormSubmit,
}) => {
  const { t } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [availableUnits, setAvailableUnits] = useState([]);

  // Get the selected product based on formData.product
  const selectedProduct = products.find(p => p.id === parseInt(formData.product));

  useEffect(() => {
    if (formData.product) {
      const selectedProduct = products.find(p => p.id === parseInt(formData.product));
      if (selectedProduct && selectedProduct.available_units) {
        setAvailableUnits(selectedProduct.available_units);
      } else {
        setAvailableUnits([]);
      }
    } else {
      setAvailableUnits([]);
    }
  }, [formData.product, products, handleFormChange]);

  useEffect(() => {
      if (selectedProduct && selectedProduct.base_unit) {
          setFormData(prev => ({
              ...prev,
              unit_type: selectedProduct.base_unit
          }));
      }
  }, [selectedProduct, formData.unit_type, setFormData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Transform form data to match backend expectations
      const requestData = {
        product_id: parseInt(formData.product),
        quantity: parseFloat(formData.quantity),
        unit_type: formData.unit_type,
        status: 'pending',
        branch_id: parseInt(formData.branch),
      };

      await api.post('/inventory/requests/', requestData);
      
      // Show success message
      setSuccessMessage(t('request_submitted_successfully'));
      
      // Reset form
      setFormData({
        product: '',
        quantity: '',
        unit_type: 'unit',
        status: 'pending',
        branch: formData.branch,
      });
      setShowModal(false);
      
      // Just refresh the requests list without calling parent's submit handler
      if (handleFormSubmit) {
        // Call the parent's refresh function without the event parameter
        await handleFormSubmit();
      }
      
      // Clear success message after a delay
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (err) {
      console.error('Error submitting request:', err);
      const errors = err.response?.data || {};
      const messages = [];
      for (const key in errors) {
        if (Array.isArray(errors[key])) {
          messages.push(`${key}: ${errors[key].join(', ')}`);
        } else if (typeof errors[key] === 'object') {
          messages.push(`${key}: ${Object.values(errors[key]).flat().join(', ')}`);
        } else {
          messages.push(`${key}: ${errors[key]}`);
        }
      }
      // You might want to show this error message somewhere
      console.error(messages.join(' | ') || 'Submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
        <h2 className="text-lg font-semibold mb-4">{t('new_inventory_request')}</h2>
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div>
            <label className="block text-sm font-medium">{t('quantity')}</label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              min="0.01"
              value={formData.quantity}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">{t('unit_type')}</label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
              disabled={availableUnits.length === 0}
            >
              {availableUnits.length === 0 ? (
                <option value="">{t('select_product_first')}</option>
              ) : (
                availableUnits.map((unit) => {
                  const isBaseUnit = selectedProduct && selectedProduct.base_unit === unit;
                  return (
                    <option key={unit} value={unit}>
                      {t(unit)} {isBaseUnit ? `(${t('default')})` : ''}
                    </option>
                  );
                })
              )}
            </select>
            {availableUnits.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {t('available_units_for_product')}: {availableUnits.map(unit => {
                  const isBaseUnit = selectedProduct && selectedProduct.base_unit === unit;
                  return isBaseUnit ? `${t(unit)} (${t('default')})` : t(unit);
                }).join(', ')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">{t('branch')}</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">{t('select_branch')}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('submitting') : t('submit_request')}
          </button>

          {formMessage && (
            <p className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{formMessage}</p>
          )}
          {successMessage && (
            <p className="text-sm text-green-600 mt-2 whitespace-pre-wrap">{successMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
