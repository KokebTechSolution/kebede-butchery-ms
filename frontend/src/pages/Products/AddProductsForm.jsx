import React, { useState, useEffect } from 'react';
import { createProduct, fetchItemTypes } from '../../api/product';

const AddProductsForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type_id: '', // Item Type (number)
    unit: '',
    price_per_unit: '',
    stock_qty: '',
    branch_id: '', // ✅ Correct field name
    is_active: true,
    expiration_date: '',
  });

  const [itemTypes, setItemTypes] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadItemTypes = async () => {
      try {
        const types = await fetchItemTypes();
        setItemTypes(types);
      } catch (err) {
        console.error('Error fetching item types:', err);
        setError('Failed to load item types.');
      }
    };

    loadItemTypes();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (['type_id', 'price_per_unit', 'stock_qty'].includes(name) ? Number(value) : value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.name || !formData.category || !formData.type_id || !formData.unit || !formData.price_per_unit || !formData.stock_qty || !formData.expiration_date || !formData.branch_id) {
        setError('Please fill all required fields.');
        setLoading(false);
        return;
      }

      // Send formData to the API
      const newProduct = await createProduct(formData);
      onSuccess(newProduct);
    } catch (err) {
      console.error('Error creating product:', err.response?.data || err);

      // Friendly error message
      if (err.response?.data) {
        const messages = [];
        for (let key in err.response.data) {
          messages.push(`${key}: ${err.response.data[key]}`);
        }
        setError(messages.join(' | '));
      } else {
        setError('Failed to create product. Please check your input.');
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
        placeholder="Product Name"
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="text"
        name="category"
        value={formData.category}
        onChange={handleChange}
        placeholder="Product Category"
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
        <option value="">Select Item Type</option>
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
        placeholder="Unit (e.g. piece, kg)"
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="number"
        name="price_per_unit"
        value={formData.price_per_unit}
        onChange={handleChange}
        placeholder="Price per Unit"
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="number"
        name="stock_qty"
        value={formData.stock_qty}
        onChange={handleChange}
        placeholder="Stock Quantity"
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="text"
        name="branch"
        value={formData.branch_id}
        onChange={handleChange}
        placeholder="Branch ID"
        className="w-full border px-4 py-2 rounded"
        required
      />

      <input
        type="date"
        name="expiration_date"
        value={formData.expiration_date}
        onChange={handleChange}
        className="w-full border px-4 py-2 rounded"
        required
      />

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          name="is_active"
          checked={formData.is_active}
          onChange={handleChange}
        />
        <label>Active</label>
      </div>

      {error && <p className="text-red-500">{error}</p>}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          {loading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default AddProductsForm;
