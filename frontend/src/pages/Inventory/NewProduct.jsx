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

const NewItemPage = ({ onClose, onSuccess }) => {
  const csrfToken = getCookie('csrftoken');

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedItemType, setSelectedItemType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedUnit, setSelectedUnit] = useState('');
  const [inputQuantity, setInputQuantity] = useState('');
  const [pricePerUnit, setPricePerUnit] = useState('');
  const [productName, setProductName] = useState('');

  const [newItemType, setNewItemType] = useState('');
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [itemTypeRes, categoryRes, unitsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/inventory/itemtypes/', { withCredentials: true }),
          axios.get('http://localhost:8000/api/inventory/categories/', { withCredentials: true }),
          axios.get('http://localhost:8000/api/inventory/productunits/', { withCredentials: true }),
        ]);
        setItemTypes(itemTypeRes.data);
        setCategories(categoryRes.data);
        setUnits(unitsRes.data);
      } catch (err) {
        console.error('Error loading data', err);
      }
    };
    loadData();
    
    // Cleanup function to prevent any side effects
    return () => {
      setIsSubmitting(false);
    };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🔄 Form submit triggered manually by user');
    
    // Prevent multiple submissions
    if (isSubmitting) {
      console.log('⚠️ Form submission already in progress, ignoring...');
      return;
    }
    
    if (!selectedItemType || !selectedCategory || !productName.trim()) {
      console.log('⚠️ Form validation failed - missing required fields');
      alert('Please fill in product name, item type, and category');
      return;
    }

    if (!inputQuantity || !selectedUnit || !pricePerUnit) {
      console.log('⚠️ Form validation failed - missing stock details');
      alert('Please fill in all stock details (quantity, unit, and price)');
      return;
    }

    console.log('✅ Form validation passed, proceeding with submission');
    setIsSubmitting(true);
    
    try {
      // Get the selected item type and category objects
      const selectedItemTypeObj = itemTypes.find(it => it.id.toString() === selectedItemType);
      const selectedCategoryObj = categories.find(cat => cat.id.toString() === selectedCategory);
      const selectedUnitObj = units.find(unit => unit.id.toString() === selectedUnit);
      
      if (!selectedItemTypeObj || !selectedCategoryObj || !selectedUnitObj) {
        throw new Error('Selected data not found');
      }

      // Create the product first
      const productData = {
        name: productName.trim(),
        category: selectedCategoryObj.id,
        item_type: selectedItemTypeObj.id,
        base_unit_price: parseFloat(pricePerUnit),
        base_unit: selectedUnitObj.id,
        input_unit: selectedUnitObj.id,
        conversion_amount: 1.0, // 1:1 conversion for now
        is_active: true
      };

      console.log('📤 Creating product with:', productData);
      
      const productResponse = await axios.post(
        'http://localhost:8000/api/inventory/products/',
        productData,
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );

      const newProduct = productResponse.data;
      console.log('✅ Product created:', newProduct);

      // Now create the stock for this product
      const stockData = {
        product: newProduct.id,
        branch: 1, // Default branch - you might want to get this from user context
        input_quantity: parseFloat(inputQuantity),
        calculated_base_units: parseFloat(inputQuantity), // Same as input for 1:1 conversion
        minimum_threshold_base_units: parseFloat(inputQuantity) * 0.1, // 10% of initial quantity
      };

      console.log('📤 Creating stock with:', stockData);
      
      const stockResponse = await axios.post(
        'http://localhost:8000/api/inventory/stocks/',
        stockData,
        {
          headers: { 'X-CSRFToken': csrfToken },
          withCredentials: true,
        }
      );

      const newStock = stockResponse.data;
      console.log('✅ Stock created:', newStock);
      
      // Show success message
      alert(`Product "${newProduct.name}" created successfully with ${inputQuantity} ${selectedUnitObj.unit_name} in stock!`);
      
      // Reset form
      setProductName('');
      setSelectedItemType('');
      setSelectedCategory('');
      setSelectedUnit('');
      setInputQuantity('');
      setPricePerUnit('');
      
      // Call the appropriate callback
      if (onSuccess) {
        console.log('🔒 Calling onSuccess callback');
        onSuccess({ 
          product: newProduct,
          stock: newStock,
          selectedItemType, 
          selectedCategory, 
          inputQuantity, 
          selectedUnit, 
          pricePerUnit 
        });
      } else if (onClose) {
        console.log('🔒 Calling onClose callback');
        onClose();
      }
      
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(`Submission failed: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
      console.log('✅ Form submission completed');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-bold mb-4">Add New Product</h1>

      <form 
        onSubmit={handleSubmit} 
        className="space-y-4"
        autoComplete="off"
      >
        {/* Product Name */}
        <div>
          <label className="block mb-1 font-semibold">Product Name</label>
          <input
            type="text"
            placeholder="Enter product name"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            required
            className="border p-2 w-full rounded"
          />
        </div>

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
                {it.display_name || it.type_name}
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

        {/* Input Quantity */}
        <div>
          <label className="block mb-1 font-semibold">Initial Stock Quantity</label>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Enter quantity"
              value={inputQuantity}
              onChange={(e) => setInputQuantity(e.target.value)}
              min="0"
              step="0.01"
              required
              className="border p-2 flex-1 rounded"
            />
            <select
              value={selectedUnit}
              onChange={(e) => setSelectedUnit(e.target.value)}
              required
              className="border p-2 rounded"
            >
              <option value="">Unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Price per Unit */}
        <div>
          <label className="block mb-1 font-semibold">Price per Unit (ETB)</label>
          <input
            type="number"
            placeholder="Enter price per unit"
            value={pricePerUnit}
            onChange={(e) => setPricePerUnit(e.target.value)}
            min="0"
            step="0.01"
            required
            className="border p-2 w-full rounded"
          />
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-4 py-2 rounded flex-1 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSubmitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={() => onClose && onClose()}
            disabled={isSubmitting}
            className="bg-gray-300 text-black px-4 py-2 rounded flex-1 hover:bg-gray-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewItemPage;
