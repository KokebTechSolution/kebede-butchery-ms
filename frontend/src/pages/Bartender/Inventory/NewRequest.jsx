// src/pages/Bartender/Inventory/NewRequest.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { createInventoryRequest } from '../../../api/inventory'; // Corrected import path, removed ReachRequest, NotReachRequest

// This component is now a self-contained form, to be used within a parent (like a Modal or directly rendered).
const NewRequest = ({
  products,         // List of products passed from parent (e.g., InventoryRequestList)
  branches,         // List of branches passed from parent
  onSuccess,        // Callback function to execute on successful submission (e.g., to close modal, refresh list)
  onError,          // Callback function to execute on submission error (e.g., to display error message)
  initialBranchId,  // Optional: Pre-fill the branch field for the current user's branch
  show,             // Controls visibility if this component is directly a modal or wrapped by one
  onClose,          // Function to call to close the modal
}) => {
  const { t } = useTranslation();

  // Internal form state for this component
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    unit_type: 'unit', // Default, ensure this aligns with your backend
    branch: '',
  });
  const [formStatusMessage, setFormStatusMessage] = useState(''); // Status messages for this specific form
  const [isSubmitting, setIsSubmitting] = useState(false); // To disable button during submission

  // Effect to set initial branch if provided (e.g., for a bartender's default branch)
  useEffect(() => {
    if (initialBranchId && !formData.branch) { // Only set if initialBranchId exists and form.branch is not already set
      setFormData(prev => ({ ...prev, branch: String(initialBranchId) })); // Ensure it's a string for select value
    }
  }, [initialBranchId, formData.branch]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormStatusMessage(''); // Clear any previous messages on user input
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormStatusMessage(''); // Clear previous messages
    setIsSubmitting(true); // Set submitting state

    // --- Client-side Validation ---
    if (!formData.product || !formData.branch || !formData.quantity || parseFloat(formData.quantity) <= 0) {
      const message = t('new_request_form_validation_error');
      setFormStatusMessage(message);
      onError(message); // Notify parent of validation error
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare data for API: ensure IDs are integers, quantity is float
      const dataToSubmit = {
        product: parseInt(formData.product),
        quantity: parseFloat(formData.quantity),
        unit_type: formData.unit_type,
        status: 'pending', // New requests are always pending by default
        branch: parseInt(formData.branch),
      };

      // Call the centralized API function (createInventoryRequest)
      const response = await createInventoryRequest(dataToSubmit);
      console.log('New request submitted:', response);

      setFormStatusMessage(t('request_submitted_successfully'));
      // Reset form fields after successful submission, keeping branch if it was pre-filled
      setFormData({
        product: '',
        quantity: '',
        unit_type: 'unit',
        branch: initialBranchId || '', // Reset to initial branch or empty
      });
      onSuccess(); // Notify parent of success (e.g., to close modal and refresh list)
    } catch (err) {
      console.error("New request submission error:", err.response?.data || err.message);
      const errors = err.response?.data || {};
      const messages = [];

      // Improved error message parsing from backend
      if (typeof errors === 'string') {
        messages.push(errors);
      } else if (typeof errors === 'object' && errors !== null) {
        for (const key in errors) {
          if (Object.prototype.hasOwnProperty.call(errors, key)) {
            const errorValue = errors[key];
            if (Array.isArray(errorValue)) {
              messages.push(`${t(key)}: ${errorValue.join(', ')}`);
            } else if (typeof errorValue === 'object' && errorValue !== null) {
              messages.push(`${t(key)}: ${Object.values(errorValue).flat().join(', ')}`);
            } else {
              messages.push(`${t(key)}: ${errorValue}`);
            }
          }
        }
      }
      const finalMessage = messages.join(' | ') || t('unknown_submission_error');
      setFormStatusMessage(finalMessage);
      onError(finalMessage); // Notify parent of error
    } finally {
      setIsSubmitting(false); // Reset submitting state
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative animate-fade-in-up">
        <h2 className="text-2xl font-semibold mb-4 text-gray-800">{t('new_inventory_request')}</h2>
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-3xl font-bold text-gray-500 hover:text-gray-700 transition duration-150 ease-in-out"
          aria-label={t('close_modal')}
        >
          &times;
        </button>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formStatusMessage && (
            <div className={`p-3 rounded-md text-sm font-medium ${
                formStatusMessage.includes(t('successfully'))
                  ? 'bg-green-100 text-green-800 border border-green-200'
                  : 'bg-red-100 text-red-800 border border-red-200'
              }`}
            >
              {formStatusMessage}
            </div>
          )}

          <div>
            <label htmlFor="product" className="block text-sm font-medium text-gray-700 mb-1">{t('product')}</label>
            <select
              id="product"
              name="product"
              value={formData.product}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">{t('select_product_placeholder')}</option>
              {products.length === 0 ? (
                <option disabled>{t('loading_products')}</option>
              ) : (
                products.map((prod) => (
                  <option key={prod.id} value={prod.id}>
                    {prod.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">{t('quantity')}</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              step="0.01"
              min="0.01"
              value={formData.quantity}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder={t('enter_quantity_placeholder')}
              required
            />
          </div>

          <div>
            <label htmlFor="unit_type" className="block text-sm font-medium text-gray-700 mb-1">{t('unit_type')}</label>
            <select
              id="unit_type"
              name="unit_type"
              value={formData.unit_type}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="unit">{t('unit')}</option>
              <option value="carton">{t('carton')}</option>
              <option value="bottle">{t('bottle')}</option>
            </select>
          </div>

          <div>
            <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">{t('branch')}</label>
            <select
              id="branch"
              name="branch"
              value={formData.branch}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              required
            >
              <option value="">{t('select_branch_placeholder')}</option>
              {branches.length === 0 ? (
                <option disabled>{t('loading_branches')}</option>
              ) : (
                branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? t('submitting') : t('submit_request')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default NewRequest;