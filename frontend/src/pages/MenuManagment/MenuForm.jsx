import React, { useState, useEffect } from 'react';
import {
  createMenuItem,
  updateMenuItem,
  fetchMenuCategories,
  createMenuCategory,
} from '../../api/menu';
import { fetchAvailableProducts } from '../../api/stock';

const MenuForm = ({
  refreshMenu,
  selectedItem,
  clearSelection,
  closeModal,
  forcebeverageOnly,
}) => {
  const [formData, setFormData] = useState({
    product: '', // product ID or free text product name
    description: '',
    price: '',
    is_available: true,
    category: '',
    item_type: 'beverage',
  });

  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);

  // Load categories and products on mount
  useEffect(() => {
    async function loadData() {
      try {
        const catData = await fetchMenuCategories();
        setCategories(catData);
      } catch (error) {
        console.error('Error fetching menu categories:', error);
        setCategories([]);
      }

      try {
        const prodData = await fetchAvailableProducts();
        setAvailableProducts(prodData);
      } catch (error) {
        console.error('Error fetching available products:', error);
        setAvailableProducts([]);
      }
    }
    loadData();
  }, []);

  // Initialize form when selectedItem or forcebeverageOnly changes
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        product: selectedItem.product_id || '',
        description: selectedItem.description || '',
        price: selectedItem.price || '',
        is_available: selectedItem.is_available !== undefined ? selectedItem.is_available : true,
        category: selectedItem.category_id || '',
        item_type: forcebeverageOnly ? 'beverage' : selectedItem.item_type || 'food',
      });
    } else {
      setFormData({
        product: '',
        description: '',
        price: '',
        is_available: true,
        category: '',
        item_type: forcebeverageOnly ? 'beverage' : 'food',
      });
    }
  }, [selectedItem, forcebeverageOnly]);

  const selectedCategory = categories.find((c) => c.id === formData.category);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isBeverage =
        (selectedCategory?.name || '').toLowerCase() === 'beverage' ||
        formData.item_type === 'beverage';
      const isFood = 
        (selectedCategory?.name || '').toLowerCase() === 'food' ||
        formData.item_type === 'food';
      let productName = '';
      if (isBeverage) {
        const selectedProduct = availableProducts.find((p) => p.id == formData.product);
        productName = selectedProduct ? selectedProduct.name : '';
      } else {
        productName = formData.product; // free text product name
      }

      const payload = {
        ...formData,
        name: productName,
        product: isBeverage | isFood
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
        {/* Product Name / Dropdown */}
        <div>
          <label className="block mb-2 font-semibold">Product Name</label>

          {(selectedCategory?.name.toLowerCase() === 'beverage' || formData.item_type === 'beverage') ? (
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
          ) : (
            <input
              type="text"
              value={formData.product}
              onChange={(e) => setFormData({ ...formData, product: e.target.value })}
              className="border p-2 w-full rounded"
              placeholder="Enter product name"
              required
            />
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border p-2 w-full rounded"
            rows={3}
          />
        </div>

        {/* Price */}
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

        {/* Item Type */}
        {!forcebeverageOnly && (
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

        {/* Category dropdown */}
        <div>
          <label className="block mb-2 font-semibold">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: parseInt(e.target.value) })}
            className="border p-2 w-full rounded"
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>

          {addingCategory ? (
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
          ) : (
            <button
              type="button"
              onClick={() => setAddingCategory(true)}
              className="bg-blue-500 text-white px-2 rounded mt-2"
            >
              + Add New Category
            </button>
          )}
        </div>

        {/* Availability Checkbox */}
        <div className="flex items-center space-x-2 mt-4">
          <input
            type="checkbox"
            checked={formData.is_available}
            onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
          />
          <label>Available</label>
        </div>
      </div>

      {/* Buttons */}
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
        <button type="button" className="bg-gray-400 text-white px-4 py-2 rounded" onClick={closeModal}>
          Cancel
        </button>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded" disabled={loading}>
          {loading ? 'Saving...' : 'Save Item'}
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
