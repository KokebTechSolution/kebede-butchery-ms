import React, { useState, useEffect } from 'react';
import {
  createMenuItem,
  updateMenuItem,
  fetchAvailableProducts,
  fetchInventoryCategories,
} from '../../api/menu';

const MenuForm = ({
  refreshMenu,
  selectedItem,
  clearSelection,
  closeModal,
  forcebeverageOnly,
  menuItems = [], // <-- add menuItems prop with default empty array
}) => {
  const [formData, setFormData] = useState({
    product: '',
    description: '',
    price: '',
    is_available: true,
    category: '',
    item_type: '',
  });

  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load inventory categories and products
  useEffect(() => {
    const loadData = async () => {
      try {
        const [cats, products] = await Promise.all([
          fetchInventoryCategories(),
          fetchAvailableProducts(),
        ]);
        setCategories(cats);
        setAvailableProducts(products);
      } catch (error) {
        console.error('Error loading data:', error);
        alert('❌ Failed to load categories or products.');
      }
    };
    loadData();
  }, []);

  // Load form data when editing
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        product: selectedItem.product || '',
        description: selectedItem.description || '',
        price: selectedItem.price || '',
        is_available: selectedItem.is_available,
        category: selectedItem.category || '',
        item_type: selectedItem.item_type || '',
      });
    } else {
      setFormData({
        product: '',
        description: '',
        price: '',
        is_available: true,
        category: '',
        item_type: '',
      });
    }
  }, [selectedItem]);

  // Get the selected inventory category object
  const selectedCategory = categories.find(
    (cat) => String(cat.id) === String(formData.category)
  );

  const isBeverage =
    forcebeverageOnly ||
    selectedCategory?.item_type?.type_name?.toLowerCase() === 'beverage' ||
    formData.item_type?.toLowerCase() === 'beverage';

  const filteredCategories = formData.item_type
    ? categories.filter(
        (cat) =>
          cat.item_type?.type_name?.toLowerCase() ===
          (formData.item_type === 'beverage' ? 'beverage' : 'food')
      )
    : categories;

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validate required fields
    if (!formData.item_type) {
      alert('Please select item type.');
      return;
    }
    if (!formData.category) {
      alert('Please select a category.');
      return;
    }
    if (isBeverage && !formData.product) {
      alert('Please select a beverage product.');
      return;
    }
    if (!isBeverage && !formData.product) {
      alert('Please enter a food product name.');
      return;
    }
    if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
      alert('Please enter a valid price.');
      return;
    }

    // 2. Prevent duplicate menu items (optional, if you have menuItems in props or context)
    const duplicate = menuItems.some(item =>
      item.name?.toLowerCase() === (isBeverage
        ? availableProducts.find(p => String(p.id) === String(formData.product))?.name?.toLowerCase()
        : formData.product?.toLowerCase()) &&
      String(item.category) === String(formData.category) &&
      item.item_type === formData.item_type
    );
    if (duplicate) {
      alert('A menu item with this name, category, and type already exists.');
      return;
    }

    // 3. Build payload as before
    const selectedCategory = categories.find(cat => String(cat.id) === String(formData.category));
    const categoryName = selectedCategory ? selectedCategory.category_name : '';
    const payload = {
      name: isBeverage
        ? availableProducts.find(p => String(p.id) === String(formData.product))?.name
        : formData.product,
      product: isBeverage ? formData.product : null,
      description: formData.description,
      price: formData.price,
      is_available: formData.is_available,
      category: null,
      item_type: formData.item_type,
      category_name: categoryName,
    };

    setLoading(true);
    try {
      if (selectedItem) {
        await updateMenuItem(selectedItem.id, payload);
        alert('✅ Menu item updated successfully!');
      } else {
        await createMenuItem(payload);
        alert('✅ Menu item created successfully!');
      }
      refreshMenu();
      closeModal();
      clearSelection();
    } catch (error) {
      console.error('❌ Error saving menu item:', error);
      const backendErrors = error.response?.data;
      let message = '❌ Error saving menu item.';
      if (backendErrors) {
        if (typeof backendErrors === 'string') {
          message = backendErrors;
        } else if (typeof backendErrors === 'object') {
          message = Object.entries(backendErrors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join('\n');
        }
      }
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'item_type' ? { category: '' } : {}),
    }));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 max-h-[80vh] overflow-y-auto"
    >
      {/* Item Type */}
      {!forcebeverageOnly && (
        <div>
          <label className="block mb-1">Item Type</label>
          <select
            name="item_type"
            value={formData.item_type}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Item Type --</option>
            <option value="food">Food</option>
            <option value="beverage">Beverage</option>
          </select>
        </div>
      )}
      {/* Category */}
      <div>
        <label className="block mb-1">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          required
          className="w-full p-2 border rounded"
        >
          <option value="">-- Select Category --</option>
          {filteredCategories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.category_name}
            </option>
          ))}
        </select>
      </div>
      {/* Product */}
      <div>
        <label className="block mb-1">Product</label>
        {isBeverage ? (
          <select
            name="product"
            value={formData.product}
            onChange={handleInputChange}
            required
            className="w-full p-2 border rounded"
          >
            <option value="">-- Select Beverage Product --</option>
            {availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.product_name || product.name}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            name="product"
            value={formData.product}
            onChange={handleInputChange}
            placeholder="Enter food item name"
            required
            className="w-full p-2 border rounded"
          />
        )}
      </div>
      {/* Description */}
      <div>
        <label className="block mb-1">Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          className="w-full p-2 border rounded"
        />
      </div>
      {/* Price */}
      <div>
        <label className="block mb-1">Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
          className="w-full p-2 border rounded"
        />
      </div>
      {/* Availability */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          name="is_available"
          checked={formData.is_available}
          onChange={handleInputChange}
        />
        <label>Available</label>
      </div>
      {/* Buttons */}
      <div className="flex justify-between gap-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? 'Saving...' : selectedItem ? 'Update' : 'Create'}
        </button>
        <button
          type="button"
          onClick={() => {
            clearSelection();
            closeModal();
          }}
          className="flex-1 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
