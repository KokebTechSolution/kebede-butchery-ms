import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const AddProductsForm = ({ onSuccess, onCancel }) => {
  const { t } = useTranslation();
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type_id: '',
    unit: '',
    price_per_unit: '',
  });

  useEffect(() => {
    fetchItemTypes();
  }, []);

  const fetchItemTypes = async () => {
    try {
      const response = await axios.get('/api/inventory/item-types/');
      setItemTypes(response.data);
    } catch (error) {
      console.error('Error fetching item types:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/inventory/products/', formData);
      onSuccess(response.data);
    } catch (err) {
      console.error('Error creating product:', err);

      // Friendly error message
      if (err.response?.data) {
        const messages = [];
        for (let key in err.response.data) {
          messages.push(`${key}: ${err.response.data[key]}`);
        }
        setError(messages.join(' | '));
      } else {
        setError(t('failed_create_product'));
      }

    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        placeholder={t('product_name')}
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="text"
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder={t('product_category')}
        className="w-full border px-4 py-2 rounded"
        required
      />

      <select
        name="type_id"
        value={formData.type_id}
        onChange={handleChange}
        className="w-full border px-4 py-2 rounded"
        required
      >
        <option value="">{t('select_item_type')}</option>
        {itemTypes.map((type) => (
          <option key={type.id} value={type.id}>
            {type.type_name}
          </option>
        ))}
      </select>

      <input
        type="text"
        name="unit"
        value={formData.unit}
        onChange={handleChange}
        placeholder={t('unit_placeholder')}
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="number"
        name="price_per_unit"
        value={formData.price_per_unit}
        onChange={handleChange}
        placeholder={t('price_per_unit_placeholder')}
        className="w-full border px-4 py-2 rounded"
        required
      />

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? t('saving') : t('save_changes')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400"
        >
          {t('cancel')}
        </button>
      </div>
    </form>
  );
};

export default AddProductsForm;
