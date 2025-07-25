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
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
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
        `http://localhost:8000/api/inventory/products/${product.id}/`,
        updatedProduct,
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': csrfToken },
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

      {/* ...other read-only fields as needed... */}
      <div className="flex justify-between mt-4">
        <button onClick={handleSubmit} className="bg-blue-600 text-white px-4 py-2 rounded">
          {t('save_changes')}
        </button>
        <button onClick={onClose} className="bg-gray-400 text-white px-4 py-2 rounded">
          {t('cancel')}
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
