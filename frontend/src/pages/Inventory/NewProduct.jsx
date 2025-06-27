import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';

const NewProductPage = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        category: ''
    });

    const [itemTypes, setItemTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedItemType, setSelectedItemType] = useState('');

    useEffect(() => {
        const loadData = async () => {
            try {
                const itemTypeData = await fetchItemTypes();
                const categoryData = await fetchCategories();
                setItemTypes(itemTypeData);
                setCategories(categoryData);
            } catch (err) {
                console.error('Error loading form data:', err);
            }
        };

        loadData();
    }, []);

    // Handle submit: minimal product creation
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.category) {
            alert('Please complete all fields.');
            return;
        }

        try {
            await axios.post('http://localhost:8000/api/inventory/inventory/', {
                name: formData.name,
                category: formData.category,
                // Optional: You can set default values for the rest of the fields in the backend if needed
            }, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('access')}`,
                }
            });
            alert('Product added successfully!');
            navigate('/branch-manager/inventory');
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Failed to add product.');
        }
    };

    // Filter categories based on selected item type
    const filteredCategories = categories.filter(cat => cat.item_type === parseInt(selectedItemType));

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Add New Product</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Item Type Dropdown */}
                <select
                    value={selectedItemType}
                    onChange={e => {
                        setSelectedItemType(e.target.value);
                        setFormData({ ...formData, category: '' });
                    }}
                    className="border p-2 w-full"
                    required
                >
                    <option value="">Select Item Type</option>
                    {itemTypes.map(itemType => (
                        <option key={itemType.id} value={itemType.id}>{itemType.type_name}</option>
                    ))}
                </select>

                {/* Category Dropdown */}
                <select
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    className="border p-2 w-full"
                    required
                    disabled={!selectedItemType}
                >
                    <option value="">Select Category</option>
                    {filteredCategories.map(category => (
                        <option key={category.id} value={category.id}>{category.category_name}</option>
                    ))}
                </select>

                {/* Product Name Input */}
                <input
                    type="text"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    className="border p-2 w-full"
                    required
                />

                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                    Add Product
                </button>
            </form>
        </div>
    );
};

export default NewProductPage;
