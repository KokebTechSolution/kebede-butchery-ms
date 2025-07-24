import React, { useEffect, useState } from 'react';
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
    category: product.category?.id || '',
    price_per_unit: product.price_per_unit || '',
    uses_carton: product.uses_carton || false,
    bottles_per_carton: product.bottles_per_carton || '',
    quantityType: product.uses_carton ? 'carton' : 'unit',
    carton_quantity: '',
    bottle_quantity: '',
    unit_quantity: '',
    minimum_threshold: '',
    running_out: false,
  });

  const [stockId, setStockId] = useState(null);
  const [errors, setErrors] = useState({});
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({
    restock_quantity: '',
    restock_type: 'carton',
  });
  const [restockError, setRestockError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const res = await axios.get('http://localhost:8000/api/inventory/stocks/', {
          withCredentials: true,
        });
        const branchStock = res.data.find(
          (stock) => stock.product.id === product.id && stock.branch.id === branchId
        );
        if (branchStock) {
          setStockId(branchStock.id);
          setFormData((prev) => ({
            ...prev,
            carton_quantity: branchStock.carton_quantity,
            bottle_quantity: branchStock.bottle_quantity,
            unit_quantity: branchStock.unit_quantity,
            minimum_threshold: branchStock.minimum_threshold,
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
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleRestockChange = (e) => {
    const { name, value } = e.target;
    setRestockData((prev) => ({ ...prev, [name]: value }));
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
    if (!validateForm()) return;

    const updatedProduct = {
      name: formData.name,
      category_id: formData.category,
      price_per_unit: formData.price_per_unit,
      uses_carton: formData.quantityType === 'carton',
      bottles_per_carton: formData.quantityType === 'carton' ? formData.bottles_per_carton : 0,
    };

    const updatedStock = {
      carton_quantity: formData.carton_quantity,
      bottle_quantity: formData.bottle_quantity,
      unit_quantity: formData.unit_quantity,
      minimum_threshold: formData.minimum_threshold,
      running_out: formData.running_out,
      branch_id: branchId,
      product_id: product.id,
    };

    const csrfToken = getCookie('csrftoken');

    try {
      await axios.put(
        `http://localhost:8000/api/inventory/products/${product.id}/`,
        updatedProduct,
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
        }
      );

      if (stockId) {
        await axios.put(
          `http://localhost:8000/api/inventory/stocks/${stockId}/`,
          updatedStock,
          {
            withCredentials: true,
            headers: { 'X-CSRFToken': csrfToken },
          }
        );
      } else {
        await axios.post(
          'http://localhost:8000/api/inventory/stocks/',
          updatedStock,
          {
            withCredentials: true,
            headers: { 'X-CSRFToken': csrfToken },
          }
        );
      }

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
    if (!restockData.restock_quantity || Number(restockData.restock_quantity) <= 0) {
      setRestockError('Enter a valid restock quantity.');
      return;
    }
    // You may need to adjust the endpoint and payload to match your backend
    try {
      await axios.post(
        `http://localhost:8000/api/inventory/stocks/${stockId}/restock/`,
        {
          quantity: restockData.restock_quantity,
          type: restockData.restock_type,
        },
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
        }
      );
      alert('Restocked successfully!');
      setShowRestockModal(false);
      onSuccess();
    } catch (err) {
      setRestockError('Restock failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this product and its stock?')) return;
    setIsDeleting(true);
    try {
      await axios.delete(`http://localhost:8000/api/inventory/products/${product.id}/`, {
        withCredentials: true,
        headers: { 'X-CSRFToken': getCookie('csrftoken') },
      });
      if (stockId) {
        await axios.delete(`http://localhost:8000/api/inventory/stocks/${stockId}/`, {
          withCredentials: true,
          headers: { 'X-CSRFToken': getCookie('csrftoken') },
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

  return (
    <div className="space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name}
        placeholder={t('product_name')}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="border p-2 w-full"
      >
        <option value="">{t('select_category')}</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.category_name}
          </option>
        ))}
      </select>
      {errors.category && <p className="text-red-500 text-sm">{errors.category}</p>}

      <input
        type="number"
        name="price_per_unit"
        value={formData.price_per_unit}
        placeholder={t('price_per_unit')}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      {errors.price_per_unit && <p className="text-red-500 text-sm">{errors.price_per_unit}</p>}

      <div>
        <label className="block font-semibold">{t('quantity_type')}</label>
        {['carton', 'bottle', 'unit'].map((type) => (
          <label key={type} className="inline-flex items-center mr-4">
            <input
              type="radio"
              name="quantityType"
              value={type}
              checked={formData.quantityType === type}
              onChange={handleChange}
            />
            <span className="ml-2 capitalize">{t(type)}</span>
          </label>
        ))}
        {errors.quantityType && <p className="text-red-500 text-sm">{errors.quantityType}</p>}
      </div>

      {formData.quantityType === 'carton' && (
        <>
          <input
            type="number"
            name="bottles_per_carton"
            placeholder={t('bottles_per_carton')}
            value={formData.bottles_per_carton}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.bottles_per_carton && (
            <p className="text-red-500 text-sm">{errors.bottles_per_carton}</p>
          )}
          <input
            type="number"
            name="carton_quantity"
            placeholder={t('carton_quantity')}
            value={formData.carton_quantity}
            onChange={handleChange}
            className="border p-2 w-full"
          />
          {errors.carton_quantity && (
            <p className="text-red-500 text-sm">{errors.carton_quantity}</p>
          )}
          <input
            type="number"
            value={formData.bottle_quantity}
            readOnly
            className="border p-2 w-full bg-gray-100"
            aria-label={t('calculated_bottle_quantity')}
          />
        </>
      )}

      {formData.quantityType === 'bottle' && (
        <input
          type="number"
          name="bottle_quantity"
          placeholder={t('bottle_quantity')}
          value={formData.bottle_quantity}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      )}

      {formData.quantityType === 'unit' && (
        <input
          type="number"
          name="unit_quantity"
          placeholder={t('unit_quantity')}
          value={formData.unit_quantity}
          onChange={handleChange}
          className="border p-2 w-full"
        />
      )}

      <input
        type="number"
        name="minimum_threshold"
        placeholder={t('minimum_threshold')}
        value={formData.minimum_threshold}
        onChange={handleChange}
        className="border p-2 w-full"
      />
      {errors.minimum_threshold && (
        <p className="text-red-500 text-sm">{errors.minimum_threshold}</p>
      )}

      <label className="inline-flex items-center space-x-2">
        <input
          type="checkbox"
          name="running_out"
          checked={formData.running_out}
          onChange={handleChange}
        />
        <span>{t('running_out')}</span>
      </label>

      <div className="flex justify-between mt-4">
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
          {t('save_changes')}
        </button>
        <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">
          {t('cancel')}
        </button>
        <button onClick={() => setShowRestockModal(true)} className="bg-green-600 text-white px-4 py-2 rounded">
          Restock
        </button>
        <button onClick={handleDelete} className="bg-red-600 text-white px-4 py-2 rounded" disabled={isDeleting}>
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
      {/* Restock Modal */}
      {showRestockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl relative">
            <h2 className="text-lg font-semibold mb-4">Restock Product</h2>
            <button
              onClick={() => setShowRestockModal(false)}
              className="absolute top-3 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
              aria-label="Close modal"
            >
              &times;
            </button>
            <div className="mb-4">
              <label className="block font-medium mb-1">Quantity</label>
              <input
                type="number"
                name="restock_quantity"
                value={restockData.restock_quantity}
                onChange={handleRestockChange}
                className="border p-2 w-full rounded"
                min="0"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-1">Type</label>
              <select
                name="restock_type"
                value={restockData.restock_type}
                onChange={handleRestockChange}
                className="border p-2 w-full rounded"
              >
                <option value="carton">Carton</option>
                <option value="bottle">Bottle</option>
                <option value="unit">Unit</option>
              </select>
            </div>
            {restockError && <p className="text-red-500 text-sm mb-2">{restockError}</p>}
            <div className="flex justify-end space-x-2">
              <button onClick={handleRestock} className="bg-green-600 text-white px-4 py-2 rounded">
                Restock
              </button>
              <button onClick={() => setShowRestockModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EditInventoryForm;
