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

const NewItemPage = ({ onClose }) => {
  const csrfToken = getCookie('csrftoken');

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);

  const [selectedItemType, setSelectedItemType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  const [newItemType, setNewItemType] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [formVisible, setFormVisible] = useState(true);

  useEffect(() => {
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
    loadData();
  }, []);

  const filteredCategories = categories.filter(
    (cat) => cat.item_type?.id?.toString() === selectedItemType
  );

  const handleAddItemType = async () => {
    if (!newItemType.trim()) return alert('Please enter an item type name');
    try {
      const res = await axios.post(
        'http://localhost:8000/api/inventory/itemtypes/',
        { type_name: newItemType },
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      setItemTypes([...itemTypes, res.data]);
      setSelectedItemType(res.data.id.toString());
      setNewItemType('');
    } catch (err) {
      console.error('Add item type failed:', err.response?.data || err);
      alert('Failed to add item type');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.trim()) return alert('Please enter a category name');
    if (!selectedItemType) return alert('Select an item type first');
    try {
      const res = await axios.post(
        'http://localhost:8000/api/inventory/categories/',
        {
          category_name: newCategory,
          item_type_id: parseInt(selectedItemType),
        },
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );
      setCategories([...categories, res.data]);
      setSelectedCategory(res.data.id.toString());
      setNewCategory('');
    } catch (err) {
      console.error('Add category failed:', err.response?.data || err);
      alert('Failed to add category');
    }
  };

const handleSubmit = (e) => {
  e.preventDefault();
  if (!selectedItemType || !selectedCategory) {
    return alert('Please select both item type and category');
  }

  alert('Submitted successfully!');
  setFormVisible(false);  // Hide the form
  window.location.reload(); // Refresh the page to show updates
};


  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Select Item Type and Category</h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Item Type */}
        <div>
          <label className="block mb-1 font-semibold">Item Type</label>
          <select
            value={selectedItemType}
            onChange={(e) => {
              setSelectedItemType(e.target.value);
              setSelectedCategory('');
            }}
            required
            className="border p-2 w-full rounded"
          >
            <option value="">Select Item Type</option>
            {itemTypes.map((it) => (
              <option key={it.id} value={it.id}>
                {it.type_name}
              </option>
            ))}
          </select>
          <div className="flex mt-2 gap-2">
            <input
              type="text"
              placeholder="Add new item type"
              value={newItemType}
              onChange={(e) => setNewItemType(e.target.value)}
              className="border p-2 flex-1 rounded"
            />
            <button
              type="button"
              onClick={handleAddItemType}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Category */}
        <div>
          <label className="block mb-1 font-semibold">Category</label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            disabled={!selectedItemType}
            required
            className="border p-2 w-full rounded"
          >
            <option value="">Select Category</option>
            {filteredCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.category_name}
              </option>
            ))}
          </select>
          <div className="flex mt-2 gap-2">
            <input
              type="text"
              placeholder="Add new category"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="border p-2 flex-1 rounded"
              disabled={!selectedItemType}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={!selectedItemType}
              className="bg-green-600 text-white px-3 py-1 rounded"
            >
              + Add
            </button>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded flex-1"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            className="bg-gray-300 text-black px-4 py-2 rounded flex-1"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewItemPage;
