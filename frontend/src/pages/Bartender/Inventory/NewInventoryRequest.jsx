import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const NewInventoryRequest = () => {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [formData, setFormData] = useState({
    product: '',
    quantity: '',
    unit_type: 'unit',
    status: 'pending',
    branch: '',
  });
  const [formMessage, setFormMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadProducts();
    loadBranches();
  }, []);

  const loadProducts = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get('http://localhost:8000/api/inventory/inventory/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProducts(res.data);
    } catch (err) {
      console.error('Failed to fetch products:', err);
    }
  };

  const loadBranches = async () => {
    try {
      const token = localStorage.getItem('access');
      const res = await axios.get('http://localhost:8000/api/inventory/branches/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(res.data);
    } catch (err) {
      console.error('Failed to fetch branches:', err);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.product ||
      !formData.branch ||
      !formData.quantity ||
      Number(formData.quantity) <= 0
    ) {
      setFormMessage('Please select a product, branch, and enter a valid quantity.');
      return;
    }

    try {
      const token = localStorage.getItem('access');
      await axios.post(
        'http://localhost:8000/api/inventory/requests/',
        {
          product_id: parseInt(formData.product),
          quantity: parseFloat(formData.quantity),
          unit_type: formData.unit_type,
          status: 'pending',
          branch_id: parseInt(formData.branch),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setFormMessage('');
      navigate('/inventory/requests'); // Go back to request list
    } catch (err) {
      if (err.response && err.response.data) {
        const errors = err.response.data;
        const messages = [];

        for (const key in errors) {
          if (Array.isArray(errors[key])) {
            messages.push(`${key}: ${errors[key].join(', ')}`);
          } else if (typeof errors[key] === 'object') {
            messages.push(
              `${key}: ${Object.values(errors[key]).flat().join(', ')}`
            );
          } else {
            messages.push(`${key}: ${errors[key]}`);
          }
        }

        setFormMessage(messages.join(' | '));
      } else {
        setFormMessage('Submission failed due to an unknown error.');
      }
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded shadow">
      <h2 className="text-2xl font-semibold mb-4">New Inventory Request</h2>

      <form onSubmit={handleFormSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Product</label>
          <select
            name="product"
            value={formData.product}
            onChange={handleFormChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">-- Select Product --</option>
            {products.map((prod) => (
              <option key={prod.id} value={prod.id}>
                {prod.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Quantity</label>
          <input
            type="number"
            step="0.01"
            name="quantity"
            value={formData.quantity}
            onChange={handleFormChange}
            className="w-full border p-2 rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Unit Type</label>
          <select
            name="unit_type"
            value={formData.unit_type}
            onChange={handleFormChange}
            className="w-full border p-2 rounded"
          >
            <option value="unit">Unit</option>
            <option value="carton">Carton</option>
            <option value="bottle">Bottle</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">Branch</label>
          <select
            name="branch"
            value={formData.branch}
            onChange={handleFormChange}
            className="w-full border p-2 rounded"
            required
          >
            <option value="">-- Select Branch --</option>
            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Submit
        </button>

        {formMessage && <p className="text-sm text-red-600">{formMessage}</p>}
      </form>
    </div>
  );
};

export default NewInventoryRequest;
