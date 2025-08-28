import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';

const CategoryManager = ({ onCategoryChange }) => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState({ name: '', item_type: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setError('');
      const response = await axiosInstance.get('menu/menucategories/');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to view categories.');
      } else {
        setError('Failed to fetch categories. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.name || !newCategory.item_type) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await axiosInstance.post('menu/menucategories/', newCategory);
      setSuccess('Category created successfully!');
      setNewCategory({ name: '', item_type: '' });
      setShowAddForm(false);
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (error) {
      console.error('Error creating category:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to create categories.');
      } else if (error.response?.status === 400) {
        setError('Invalid data. Please check your input.');
      } else {
        setError('Failed to create category. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? This will affect all menu items in this category.')) {
      return;
    }

    try {
      await axiosInstance.delete(`menu/menucategories/${categoryId}/`);
      setSuccess('Category deleted successfully!');
      fetchCategories();
      if (onCategoryChange) onCategoryChange();
    } catch (error) {
      console.error('Error deleting category:', error);
      if (error.response?.status === 401) {
        setError('Authentication required. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. You do not have permission to delete categories.');
      } else {
        setError('Failed to delete category. Please try again.');
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewCategory(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
    setSuccess('');
  };

  const getItemTypeLabel = (itemType) => {
    return itemType === 'food' ? '🍽️ Food' : itemType === 'beverage' ? '🥤 Beverage' : '❓ Unknown';
  };

  const getItemTypeColor = (itemType) => {
    return itemType === 'food' ? 'bg-orange-100 text-orange-800 border-orange-200' : 
           itemType === 'beverage' ? 'bg-blue-100 text-blue-800 border-blue-200' : 
           'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Category Management</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          <span className="text-xl">➕</span>
          Add Category
        </button>
      </div>
      
      {/* Add New Category Form */}
      {showAddForm && (
        <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
            <span className="text-green-600">➕</span>
            Add New Category
          </h3>
          
          {error && <div className="text-red-600 text-sm mb-3 bg-red-50 p-3 rounded border border-red-200">{error}</div>}
          {success && <div className="text-green-600 text-sm mb-3 bg-green-50 p-3 rounded border border-green-200">{success}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={newCategory.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Main Dish, Soft Drinks"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Type
                </label>
                <select
                  name="item_type"
                  value={newCategory.item_type}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">-- Select Item Type --</option>
                  <option value="food">🍽️ Food</option>
                  <option value="beverage">🥤 Beverage</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Creating...' : '✅ Create Category'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategory({ name: '', item_type: '' });
                  setError('');
                  setSuccess('');
                }}
                className="flex items-center gap-2 bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600"
              >
                ❌ Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-700 flex items-center gap-2">
          <span className="text-blue-600">📂</span>
          Existing Categories
        </h3>
        
        {categories.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 text-lg mb-2">No categories found</p>
            <p className="text-gray-400">Click the "Add Category" button above to create your first category!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 bg-white hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800 text-lg">{category.name}</h4>
                  <button
                    onClick={() => handleDelete(category.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-full transition-colors"
                    title="Delete category"
                  >
                    🗑️
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className={`text-sm px-3 py-1 rounded-full border ${getItemTypeColor(category.item_type)}`}>
                    {getItemTypeLabel(category.item_type)}
                  </span>
                  <span className="text-xs text-gray-400">ID: {category.id}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManager;
