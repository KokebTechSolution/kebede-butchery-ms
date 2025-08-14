import React, { useState, useEffect } from 'react';
import {
  createMenuItem,
  updateMenuItem,
  fetchMenuCategories,
  syncMenuCategoriesWithInventory,
  fetchMenuItems,
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
    product: '',
    description: '',
    price: '',
    is_available: true,
    category: '',
    item_type: '',
  });

  const [categories, setCategories] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [existingMenuItems, setExistingMenuItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedProductPrice, setSelectedProductPrice] = useState('');

  // Calculate isBeverage early so it can be used in useEffect
  const isBeverage = forcebeverageOnly || formData.item_type?.toLowerCase() === 'beverage';

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('🔄 Loading menu form data...');
        await syncMenuCategoriesWithInventory();
        console.log('✅ Synced categories with inventory');
        
        const [categories, products, menuItems] = await Promise.all([
          fetchMenuCategories(),
          fetchAvailableProducts(),
          fetchMenuItems(),
        ]);
        
        console.log('📊 Categories loaded:', categories);
        console.log('📊 Products loaded:', products);
        console.log('📊 Products type:', typeof products);
        console.log('📊 Products is array:', Array.isArray(products));
        console.log('📊 Menu items loaded:', menuItems);
        
        setCategories(categories);
        setAvailableProducts(Array.isArray(products) ? products : []);
        setExistingMenuItems(menuItems);
      } catch (error) {
        console.error('❌ Error loading data:', error);
        setError('Failed to load data.');
      }
    };
    loadData();
  }, []);

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
    setError('');
  }, [selectedItem]);

  // Fetch product price when product is selected
  useEffect(() => {
    const fetchProductPrice = async () => {
      if (formData.product && isBeverage) {
        try {
          const selectedProduct = Array.isArray(availableProducts) ? availableProducts.find(
            (p) => String(p.id) === String(formData.product)
          ) : null;
          if (selectedProduct) {
            setSelectedProductPrice(selectedProduct.base_unit_price || 'N/A');
          } else {
            setSelectedProductPrice('');
          }
        } catch (error) {
          console.error('Error fetching product price:', error);
          setSelectedProductPrice('Error loading price');
        }
      } else {
        setSelectedProductPrice('');
      }
    };

    fetchProductPrice();
  }, [formData.product, availableProducts, isBeverage]);

  // Check if menu item already exists
  const checkExistingMenuItem = (productName, categoryId, itemType) => {
    if (!selectedItem) { // Only check for new items, not when editing
      const existing = existingMenuItems.find(item => 
        item.name?.toLowerCase() === productName?.toLowerCase() &&
        String(item.category) === String(categoryId) &&
        item.item_type?.toLowerCase() === itemType?.toLowerCase()
      );
      return existing;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      let productName = '';
      let productId = null;
      if (isBeverage) {
        const selectedProduct = Array.isArray(availableProducts) ? availableProducts.find(
          (p) => String(p.id) === String(formData.product)
        ) : null;
        if (!selectedProduct) {
          setError('Please select a valid beverage product.');
          setLoading(false);
          return;
        }
        productName = selectedProduct.name;
        productId = selectedProduct.id;
      } else {
        if (!formData.product) {
          setError('Please enter a product name for food item.');
          setLoading(false);
          return;
        }
        productName = formData.product;
      }
      if (!formData.category) {
        setError('Please select a category.');
        setLoading(false);
        return;
      }
      if (!formData.price || isNaN(formData.price) || Number(formData.price) <= 0) {
        setError('Please enter a valid price.');
        setLoading(false);
        return;
      }
      if (!formData.item_type) {
        setError('Please select an item type.');
        setLoading(false);
        return;
      }

      // Check for existing menu item (only for new items)
      if (!selectedItem) {
        const existingItem = checkExistingMenuItem(productName, formData.category, formData.item_type);
        if (existingItem) {
          setError(`A menu item with the name "${productName}" already exists in this category. Please use a different name or edit the existing item.`);
          setLoading(false);
          return;
        }
      }

      const payload = {
        name: productName,
        product: isBeverage ? productId : null,
        description: formData.description,
        price: formData.price,
        is_available: formData.is_available,
        category: formData.category,
        item_type: formData.item_type,
      };
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
      setFormData({
        product: '',
        description: '',
        price: '',
        is_available: true,
        category: '',
        item_type: '',
      });
    } catch (error) {
      setError('❌ Error saving menu item. Please try again.');
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
    setError('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 p-4 max-h-[80vh] overflow-y-auto touch-manipulation"
    >
      {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
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
          {categories.length === 0 ? (
            <option disabled>No categories available</option>
          ) : (
            categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name || cat.category_name}
              </option>
            ))
          )}
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
            {Array.isArray(availableProducts) ? availableProducts.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            )) : (
              <option value="">Loading products...</option>
            )}
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
      {/* Product Base Price (Read-only for beverages) */}
      {isBeverage && formData.product && selectedProductPrice && (
        <div>
          <label className="block mb-1 text-sm text-gray-600">Product Base Price (Reference)</label>
          <input
            type="text"
            value={`$${selectedProductPrice}`}
            readOnly
            className="w-full p-2 border rounded bg-gray-100 text-gray-700"
            placeholder="Product base price will appear here"
          />
          <p className="text-xs text-gray-500 mt-1">
            This is the base unit price from inventory. Set your menu price above.
          </p>
        </div>
      )}
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
        <label className="block mb-1">Menu Price</label>
        <input
          type="number"
          name="price"
          value={formData.price}
          onChange={handleInputChange}
          required
          className="w-full p-2 border rounded"
          placeholder="Enter menu price"
        />
        {isBeverage && selectedProductPrice && formData.price && (
          <p className="text-xs text-gray-500 mt-1">
            {Number(formData.price) > Number(selectedProductPrice) 
              ? `Markup: $${(Number(formData.price) - Number(selectedProductPrice)).toFixed(2)}`
              : Number(formData.price) < Number(selectedProductPrice)
              ? `Discount: $${(Number(selectedProductPrice) - Number(formData.price)).toFixed(2)}`
              : 'Price matches base price'
            }
          </p>
        )}
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
            setFormData({
              product: '',
              description: '',
              price: '',
              is_available: true,
              category: '',
              item_type: '',
            });
            setError('');
          }}
          className="flex-1 bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400 cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default MenuForm;
