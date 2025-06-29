// src/pages/MenuManagement/MenuForm.jsx

import React, { useState, useEffect } from 'react';
import { createMenuItem, updateMenuItem, fetchMenuCategories, createMenuCategory } from '../../api/menu';

const MenuForm = ({ refreshMenu, selectedItem, clearSelection, closeModal }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        is_available: true,
        category: '',
        item_type: 'food',
    });

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [newCategory, setNewCategory] = useState('');
    const [addingCategory, setAddingCategory] = useState(false);

    useEffect(() => {
        const loadCategories = async () => {
            try {
                const data = await fetchMenuCategories();
                setCategories(data);
            } catch (error) {
                console.error('Error loading categories:', error);
            }
        };
        loadCategories();
    }, []);

    useEffect(() => {
        if (selectedItem) {
            setFormData({
                name: selectedItem.name,
                description: selectedItem.description,
                price: selectedItem.price,
                is_available: selectedItem.is_available,
                category: selectedItem.category_id,
                item_type: selectedItem.item_type,
            });
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                is_available: true,
                category: '',
                item_type: 'food',
            });
        }
    }, [selectedItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (selectedItem) {
                await updateMenuItem(selectedItem.id, formData);
                alert('Menu item updated successfully!');
            } else {
                await createMenuItem(formData);
                alert('Menu item created successfully!');
            }
            refreshMenu(); // Refresh table
            closeModal();  // Close the modal
            clearSelection(); // Clear selected item
        } catch (error) {
            console.error('Error saving menu item:', error);
            alert('Error saving menu item. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div>
                <label className="block mb-2 font-semibold">Item Name</label>
                <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="border p-2 w-full rounded"
                    required
                />
            </div>

            <div>
                <label className="block mb-2 font-semibold">Description</label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="border p-2 w-full rounded"
                    rows={3}
                />
            </div>

            <div>
                <label className="block mb-2 font-semibold">Price</label>
                <input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="border p-2 w-full rounded"
                    required
                />
            </div>

            <div>
                <label className="block mb-2 font-semibold">Item Type</label>
                <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    className="border p-2 w-full rounded"
                    required
                >
                    <option value="food">Food</option>
                    <option value="drink">Drink</option>
                </select>
            </div>

            <div>
                <label className="block mb-2 font-semibold">Category</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="border p-2 w-full rounded"
                        required
                    >
                        <option value="">Select Category</option>
                        {categories.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <button
                        type="button"
                        onClick={() => setAddingCategory(true)}
                        className="bg-blue-500 text-white px-2 rounded"
                    >
                        +
                    </button>
                </div>
                {addingCategory && (
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                        <input
                            type="text"
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            placeholder="New category name"
                            className="border p-2 rounded"
                        />
                        <button
                            type="button"
                            className="bg-green-500 text-white px-2 rounded"
                            onClick={async () => {
                                if (!newCategory.trim()) return;
                                try {
                                    const res = await createMenuCategory({ name: newCategory });
                                    setCategories([...categories, res]);
                                    setFormData({ ...formData, category: res.id });
                                    setNewCategory('');
                                    setAddingCategory(false);
                                } catch (err) {
                                    alert('Failed to add category');
                                }
                            }}
                        >
                            Save
                        </button>
                        <button
                            type="button"
                            className="bg-gray-400 text-white px-2 rounded"
                            onClick={() => {
                                setAddingCategory(false);
                                setNewCategory('');
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center space-x-2">
                <input
                    type="checkbox"
                    checked={formData.is_available}
                    onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                />
                <label>Available</label>
            </div>

            <div className="flex justify-end space-x-2">
                <button
                    type="button"
                    onClick={closeModal}
                    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    className="bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700"
                    disabled={loading}
                >
                    {loading ? 'Saving...' : 'Save Item'}
                </button>
            </div>
        </form>
    );
};

export default MenuForm;
