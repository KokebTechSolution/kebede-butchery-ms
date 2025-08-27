import React, { useState, useEffect } from 'react';
import axios from 'axios';

// CSRF token helper
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

const CategoryManager = ({ onClose, onSuccess }) => {
  const csrfToken = getCookie('csrftoken');

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [selectedItemType, setSelectedItemType] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemTypeRes, categoryRes] = await Promise.all([
        axios.get('http://localhost:8000/api/inventory/itemtypes/', { withCredentials: true }),
        axios.get('http://localhost:8000/api/inventory/categories/', { withCredentials: true }),
      ]);
      setItemTypes(itemTypeRes.data);
      setCategories(categoryRes.data);
    } catch (err) {
      console.error('Error loading data', err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim() || !selectedItemType) {
      alert('Please fill in category name and select item type');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await axios.post(
        'http://localhost:8000/api/inventory/categories/',
        {
          category_name: newCategoryName.trim(),
          item_type_id: parseInt(selectedItemType),
          description: newCategoryDescription.trim(),
          is_active: true,
          sort_order: categories.filter(c => c.item_type?.id === parseInt(selectedItemType)).length + 1
        },
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      
      setCategories([...categories, res.data]);
      setNewCategoryName('');
      setNewCategoryDescription('');
      setSelectedItemType('');
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Add category failed:', err.response?.data || err);
      alert('Failed to add category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCategory = async (category) => {
    if (!editingCategory) {
      setEditingCategory(category);
      return;
    }

    try {
      const res = await axios.patch(
        `http://localhost:8000/api/inventory/categories/${category.id}/`,
        {
          category_name: editingCategory.category_name,
          description: editingCategory.description,
          is_active: editingCategory.is_active,
          sort_order: editingCategory.sort_order
        },
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      
      setCategories(categories.map(c => c.id === category.id ? res.data : c));
      setEditingCategory(null);
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Update category failed:', err.response?.data || err);
      alert('Failed to update category');
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await axios.delete(
        `http://localhost:8000/api/inventory/categories/${categoryId}/`,
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      
      setCategories(categories.filter(c => c.id !== categoryId));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Delete category failed:', err.response?.data || err);
      alert('Failed to delete category');
    }
  };

  const toggleCategoryStatus = async (category) => {
    try {
      const res = await axios.patch(
        `http://localhost:8000/api/inventory/categories/${category.id}/`,
        {
          is_active: !category.is_active
        },
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      
      setCategories(categories.map(c => c.id === category.id ? res.data : c));
      
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error('Toggle category status failed:', err.response?.data || err);
      alert('Failed to update category status');
    }
  };

  const foodCategories = categories.filter(c => c.item_type?.type_name === 'food');
  const beverageCategories = categories.filter(c => c.item_type?.type_name === 'beverage');

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Category Management</h1>
        <button
          onClick={onClose}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Close
        </button>
      </div>

      {/* Add New Category Form */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
        <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Category Name</label>
            <input
              type="text"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Enter category name"
              className="border p-2 w-full rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Item Type</label>
            <select
              value={selectedItemType}
              onChange={(e) => setSelectedItemType(e.target.value)}
              className="border p-2 w-full rounded"
              required
            >
              <option value="">Select Item Type</option>
              {itemTypes.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.display_name || it.type_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <input
              type="text"
              value={newCategoryDescription}
              onChange={(e) => setNewCategoryDescription(e.target.value)}
              placeholder="Enter description"
              className="border p-2 w-full rounded"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Adding...' : 'Add Category'}
            </button>
          </div>
        </form>
      </div>

      {/* Categories Display */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Food Categories */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-green-700 mb-4 flex items-center">
            🍽️ Food Categories ({foodCategories.length})
          </h3>
          <div className="space-y-2">
            {foodCategories.length > 0 ? (
              foodCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onToggleStatus={toggleCategoryStatus}
                  editingCategory={editingCategory}
                  setEditingCategory={setEditingCategory}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No food categories found</p>
            )}
          </div>
        </div>

        {/* Beverage Categories */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center">
            🥤 Beverage Categories ({beverageCategories.length})
          </h3>
          <div className="space-y-2">
            {beverageCategories.length > 0 ? (
              beverageCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onEdit={handleEditCategory}
                  onDelete={handleDeleteCategory}
                  onToggleStatus={toggleCategoryStatus}
                  editingCategory={editingCategory}
                  setEditingCategory={setEditingCategory}
                />
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No beverage categories found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const CategoryItem = ({ category, onEdit, onDelete, onToggleStatus, editingCategory, setEditingCategory }) => {
  const [editData, setEditData] = useState({
    category_name: category.category_name,
    description: category.description || '',
    sort_order: category.sort_order || 0
  });

  const isEditing = editingCategory?.id === category.id;

  const handleSave = () => {
    onEdit({
      ...category,
      ...editData
    });
  };

  const handleCancel = () => {
    setEditData({
      category_name: category.category_name,
      description: category.description || '',
      sort_order: category.sort_order || 0
    });
    setEditingCategory(null);
  };

  if (isEditing) {
    return (
      <div className="border rounded p-3 bg-yellow-50">
        <div className="space-y-2">
          <input
            type="text"
            value={editData.category_name}
            onChange={(e) => setEditData({...editData, category_name: e.target.value})}
            className="border p-1 w-full rounded text-sm"
          />
          <input
            type="text"
            value={editData.description}
            onChange={(e) => setEditData({...editData, description: e.target.value})}
            placeholder="Description"
            className="border p-1 w-full rounded text-sm"
          />
          <input
            type="number"
            value={editData.sort_order}
            onChange={(e) => setEditData({...editData, sort_order: parseInt(e.target.value) || 0})}
            placeholder="Sort order"
            className="border p-1 w-full rounded text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-2 py-1 rounded text-xs hover:bg-green-700"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="bg-gray-500 text-white px-2 py-1 rounded text-xs hover:bg-gray-600"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`border rounded p-3 ${category.is_active ? 'bg-white' : 'bg-gray-100'}`}>
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`font-medium ${category.is_active ? 'text-gray-900' : 'text-gray-500'}`}>
              {category.category_name}
            </h4>
            <span className={`px-2 py-1 rounded-full text-xs ${
              category.is_active 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {category.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
          {category.description && (
            <p className="text-sm text-gray-600 mt-1">{category.description}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Sort Order: {category.sort_order || 0}
          </p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(category)}
            className="bg-yellow-500 text-white px-2 py-1 rounded text-xs hover:bg-yellow-600"
          >
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(category)}
            className={`px-2 py-1 rounded text-xs ${
              category.is_active
                ? 'bg-red-500 text-white hover:bg-red-600'
                : 'bg-green-500 text-white hover:bg-green-600'
            }`}
          >
            {category.is_active ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryManager;
