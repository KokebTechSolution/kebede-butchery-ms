// src/pages/MenuManagement/MenuForm.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  createMenuItem,
  updateMenuItem,
  fetchMenuCategories,
  createMenuCategory,
} from '../../api/menu';
import { fetchAvailableProducts } from '../../api/stock'; // ✅ Fetch from inventory
import { FaTrash, FaChevronDown } from 'react-icons/fa';

const MenuForm = ({ refreshMenu, selectedItem, clearSelection, closeModal, forceDrinkOnly }) => {
  const [formData, setFormData] = useState({
    product: '',
    description: '',
    price: '',
    is_available: true,
    category: '',
    item_type: 'food',
  });

  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [catData, prodData] = await Promise.all([
          fetchMenuCategories(),
          fetchAvailableProducts(),
        ]);
        setCategories(catData);
        setAvailableProducts(prodData);
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (selectedItem) {
      setFormData({
        product: selectedItem.product_id,
        description: selectedItem.description,
        price: selectedItem.price,
        is_available: selectedItem.is_available,
        category: selectedItem.category_id,
        item_type: forceDrinkOnly ? 'beverage' : selectedItem.item_type,
      });
    } else {
      setFormData({
        product: '',
        description: '',
        price: '',
        is_available: true,
        category: '',
        item_type: forceDrinkOnly ? 'beverage' : 'food',
      });
    }
  }, [selectedItem, forceDrinkOnly]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedProduct = availableProducts.find((p) => p.id == formData.product);
      const payload = {
        ...formData,
        name: selectedProduct?.name || '',
      };

      if (selectedItem) {
        await updateMenuItem(selectedItem.id, payload);
        alert('Menu item updated successfully!');
      } else {
        await createMenuItem(payload);
        alert('Menu item created successfully!');
      }
      refreshMenu();
      closeModal();
      clearSelection();
    } catch (error) {
      console.error('Error saving menu item:', error);
      alert('Error saving menu item. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6"
      style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
    >
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 16 }}>
        <div>
          <label className="block mb-2 font-semibold">Select Product</label>
          <select
            value={formData.product}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedProduct = availableProducts.find((p) => p.id == selectedId);
              setFormData({
                ...formData,
                product: selectedId,
                price: selectedProduct?.price_per_unit || '',
              });
            }}
            className="border p-2 w-full rounded"
            required
          >
            <option value="">-- Select a product --</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>
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

        {!forceDrinkOnly && (
          <div>
            <label className="block mb-2 font-semibold">Item Type</label>
            <select
              value={formData.item_type}
              onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
              className="border p-2 w-full rounded"
              required
            >
              <option value="food">Food</option>
              <option value="beverage">Beverage</option>
            </select>
          </div>
        )}

        <div>
          <label className="block mb-2 font-semibold">Category</label>
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <div
              className="border p-2 w-full rounded flex justify-between items-center cursor-pointer"
              onClick={() => setDropdownOpen((open) => !open)}
            >
              {categories.find((c) => c.id === formData.category)?.name || 'Select Category'}
              <FaChevronDown />
            </div>
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  width: '100%',
                  background: 'white',
                  border: '1px solid #ccc',
                  borderRadius: 4,
                  zIndex: 100,
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {categories.map((category) => (
                  <div
                    key={category.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      cursor: 'pointer',
                    }}
                    onClick={() => {
                      setFormData({ ...formData, category: category.id });
                      setDropdownOpen(false);
                    }}
                  >
                    <span>{category.name}</span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: 'red', marginLeft: 8 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCategories(categories.filter((c) => c.id !== category.id));
                      }}
                      title={`Delete ${category.name}`}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="bg-blue-500 text-white px-2 rounded ml-2"
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
      </div>

      <div
        className="flex justify-end space-x-2"
        style={{
          background: '#fff',
          padding: '12px 0 0 0',
          position: 'sticky',
          bottom: 0,
          zIndex: 2,
        }}
      >
        <button
          type="button"
          className="bg-gray-400 text-white px-4 py-2 rounded"
          onClick={closeModal}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Saving...' : 'Save Item'}
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
