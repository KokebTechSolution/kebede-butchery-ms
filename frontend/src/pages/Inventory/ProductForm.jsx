import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';

const AddProductForm = () => {
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        category: '',
        unit_type: '',
        quantity_per_carton: '',
        unit_price: ''
    });

    const [itemTypes, setItemTypes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedItemType, setSelectedItemType] = useState('');
    const [allowedToAdd, setAllowedToAdd] = useState(false);

    // ✅ Allowed Unit Types for Beverages/Drinks
    const unitTypes = ['bottle', 'carton', 'piece'];

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

    const handleItemTypeChange = (e) => {
        const selectedId = e.target.value;
        setSelectedItemType(selectedId);

        const selectedItem = itemTypes.find(item => item.id.toString() === selectedId);
        if (selectedItem && (selectedItem.type_name.toLowerCase() === 'beverages' || selectedItem.type_name.toLowerCase() === 'drinks')) {
            setAllowedToAdd(true);
        } else {
            setAllowedToAdd(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
                await axios.post('http://localhost:8000/api/inventory/inventory/', {
                    ...formData,
                    item_type: selectedItemType
                }, { 
                    headers: { Authorization: `Bearer ${localStorage.getItem('access')}` }
                });
            alert('Product added successfully!');
            navigate('/branch-manager/inventory');
        } catch (err) {
            console.error('Error adding product:', err);
            alert('Failed to add product.');
        }
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Add New Product</h1>

            {/* Item Type Selection */}
            <select
                value={selectedItemType}
                onChange={handleItemTypeChange}
                className="border p-2 w-full mb-4"
                required
            >
                <option value="">Select Item Type</option>
                {itemTypes.map(item => (
                    <option key={item.id} value={item.id}>{item.type_name}</option>
                ))}
            </select>

            {allowedToAdd ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input
                        type="text"
                        placeholder="Product Name"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="border p-2 w-full"
                        required
                    />

                    <select
                        value={formData.category}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="border p-2 w-full"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories
                            .filter(cat => cat.item_type === parseInt(selectedItemType))
                            .map(category => (
                                <option key={category.id} value={category.id}>{category.category_name}</option>
                            ))}
                    </select>

                    {/* ✅ Restricted Unit Types */}
                    <select
                        value={formData.unit_type}
                        onChange={e => setFormData({ ...formData, unit_type: e.target.value })}
                        className="border p-2 w-full"
                        required
                    >
                        <option value="">Select Unit Type</option>
                        {unitTypes.map((type, index) => (
                            <option key={index} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                        ))}
                    </select>

                    <input
                        type="number"
                        placeholder="Quantity per carton (if applicable)"
                        value={formData.quantity_per_carton}
                        onChange={e => setFormData({ ...formData, quantity_per_carton: e.target.value })}
                        className="border p-2 w-full"
                    />

                    <input
                        type="number"
                        placeholder="Unit Price"
                        value={formData.unit_price}
                        onChange={e => setFormData({ ...formData, unit_price: e.target.value })}
                        className="border p-2 w-full"
                        required
                    />

                    <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
                        Add Product
                    </button>
                </form>
            ) : (
                <div className="text-red-500 font-semibold">
                    This form is only available for Beverages or Drinks item types.
                </div>
            )}
        </div>
    );
};

export default AddProductForm;
