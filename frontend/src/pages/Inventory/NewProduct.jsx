import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';

const NewProduct = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    type_id: '',
    unit: '',
    price_per_unit: '',
    stock_qty: '',
    branch_id: '',
    is_active: true,
    expiration_date: '',
  });

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [typesRes, categoriesRes] = await Promise.all([
          axiosInstance.get('inventory/itemtypes/'),
          axiosInstance.get('inventory/categories/'),
        ]);
        setItemTypes(typesRes.data);
        setCategories(categoriesRes.data);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load form data.');
      }
    };

    loadData();
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
      if (!formData.name || !formData.category || !formData.type_id || !formData.unit || !formData.price_per_unit || !formData.stock_qty || !formData.expiration_date || !formData.branch_id) {
        setError('Please fill all required fields.');
        setLoading(false);
        return;
      }

      const res = await axiosInstance.post('inventory/products/', formData);
      console.log('Product created:', res.data);
      alert('Product created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        category: '',
        type_id: '',
        unit: '',
        price_per_unit: '',
        stock_qty: '',
        branch_id: '',
        is_active: true,
        expiration_date: '',
      });
    } catch (err) {
      console.error('Error creating product:', err.response?.data || err);
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

  // ... rest of the component code ...
};

export default NewProduct;
