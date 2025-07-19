import React, { useState, useEffect } from 'react';
import {
  createMenuItem,
  updateMenuItem,
  fetchMenuCategories,
  fetchAvailableProducts,
} from '../../api/menu';

// CSS styles for the modal
const modalStyles = `
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }
  
  .modal-content {
    background: white;
    padding: 2rem;
    border-radius: 8px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
  }
  
  .form-group {
    margin-bottom: 1rem;
  }
  
  .form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
  }
  
  .form-group input,
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
  }
  
  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 1.5rem;
  }
  
  .form-actions button {
    flex: 1;
    padding: 0.75rem;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }
  
  .form-actions button[type="submit"] {
    background-color: #007bff;
    color: white;
  }
  
  .form-actions button[type="button"] {
    background-color: #6c757d;
    color: white;
  }
  
  .error-message {
    background-color: #f8d7da;
    color: #721c24;
    padding: 0.75rem;
    border-radius: 4px;
    margin-bottom: 1rem;
  }
`;

const MenuForm = ({
  refreshMenu,
  selectedItem,
  clearSelection,
  closeModal,
  forcebeverageOnly,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    item_type: 'food',
    category: '',
    is_available: true,
    product: '',
  });

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load categories based on item type
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await fetchMenuCategories(formData.item_type);
        setCategories(cats);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Failed to load categories');
      }
    };
    loadCategories();
  }, [formData.item_type]);

  // Load products when category changes (only for beverages)
  useEffect(() => {
    const loadProducts = async () => {
      if (formData.item_type === 'beverage' && formData.category) {
        try {
          const prods = await fetchAvailableProducts(formData.category);
          setProducts(prods);
        } catch (error) {
          console.error('Error loading products:', error);
        }
      } else {
        setProducts([]);
      }
    };
    loadProducts();
  }, [formData.category, formData.item_type]);

  // Load selected item data
  useEffect(() => {
    if (selectedItem) {
      setFormData({
        name: selectedItem.name || '',
        description: selectedItem.description || '',
        price: selectedItem.price || '',
        item_type: selectedItem.item_type || 'food',
        category: selectedItem.category?.id || '',
        is_available: selectedItem.is_available !== false,
        product: selectedItem.product?.id || '',
      });
    }
  }, [selectedItem]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // For beverages, get the product name from the selected product
      let itemName = formData.name;
      if (formData.item_type === 'beverage' && formData.product) {
        const selectedProduct = products.find(p => p.id === parseInt(formData.product));
        if (selectedProduct) {
          itemName = selectedProduct.name;
        }
      }

      // Prepare the data according to our backend model structure
      const submitData = {
        name: itemName,
        description: formData.description,
        price: parseFloat(formData.price),
        item_type: formData.item_type,
        category_id: parseInt(formData.category), // Send category_id
        is_available: formData.is_available,
        product: formData.item_type === 'beverage' && formData.product ? parseInt(formData.product) : null,
      };

      console.log('=== MENU ITEM SUBMISSION DEBUG ===');
      console.log('Form Data:', formData);
      console.log('Submit Data:', submitData);
      console.log('Selected Item:', selectedItem);
      console.log('Is Edit Mode:', !!selectedItem);

      if (selectedItem) {
        console.log('Updating menu item with ID:', selectedItem.id);
        const result = await updateMenuItem(selectedItem.id, submitData);
        console.log('Update result:', result);
      } else {
        console.log('Creating new menu item');
        const result = await createMenuItem(submitData);
        console.log('Create result:', result);
      }

      console.log('=== SUBMISSION SUCCESSFUL ===');
      refreshMenu();
      closeModal();
      clearSelection();
    } catch (error) {
      console.error('=== MENU ITEM SUBMISSION ERROR ===');
      console.error('Error object:', error);
      console.error('Error response:', error.response);
      console.error('Error status:', error.response?.status);
      console.error('Error data:', error.response?.data);
      console.error('Error message:', error.message);
      
      let errorMessage = 'Failed to save menu item';
      
      if (error.response?.status === 401) {
        errorMessage = 'Authentication failed. Please log in again.';
      } else if (error.response?.status === 400) {
        errorMessage = `Validation error: ${JSON.stringify(error.response.data)}`;
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      // Reset category and product when item type changes
      ...(name === 'item_type' ? { category: '', product: '' } : {}),
      // Reset product when category changes
      ...(name === 'category' ? { product: '' } : {}),
    }));
  };

  const isBeverage = formData.item_type === 'beverage';

  return (
    <>
      <style>{modalStyles}</style>
      <div className="modal-overlay">
        <div className="modal-content">
          <h2>{selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          
          {error && <div className="error-message">{error}</div>}
          
          <form onSubmit={handleSubmit}>
            {/* 1. Item Type - TOP INPUT */}
            <div className="form-group">
              <label>Item Type *</label>
              <select
                name="item_type"
                value={formData.item_type}
                onChange={handleInputChange}
                disabled={forcebeverageOnly}
                required
              >
                <option value="food">Food</option>
                <option value="beverage">Beverage</option>
              </select>
            </div>

            {/* 2. Category */}
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Category</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Product Name - Different behavior for Food vs Beverage */}
            <div className="form-group">
              <label>Product Name *</label>
              {isBeverage ? (
                // For Beverage: Dropdown to select from existing inventory products
                <>
                  <select
                    name="product"
                    value={formData.product}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select Beverage Product</option>
                    {products.map(product => (
                      <option key={product.id} value={product.id}>
                        {product.name} - {product.base_unit} (${product.price_per_unit})
                      </option>
                    ))}
                  </select>
                  {formData.product && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#666' }}>
                      <strong>Menu Name:</strong> {products.find(p => p.id === parseInt(formData.product))?.name}
                    </div>
                  )}
                </>
              ) : (
                // For Food: Free text input to register new food items
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter food item name"
                  required
                />
              )}
            </div>

            {/* 4. Display Name (for beverages) - REMOVED - Redundant since product name is available */}
            {/* {isBeverage && (
              <div className="form-group">
                <label>Display Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter display name for menu"
                  required
                />
              </div>
            )} */}

            {/* 5. Description */}
            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter item description"
              />
            </div>

            {/* 6. Price */}
            <div className="form-group">
              <label>Price *</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                step="0.01"
                min="0"
                placeholder="Enter price"
                required
              />
            </div>

            {/* 7. Availability */}
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  name="is_available"
                  checked={formData.is_available}
                  onChange={handleInputChange}
                />
                Available
              </label>
            </div>

            <div className="form-actions">
              <button type="button" onClick={closeModal} disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}>
                {loading ? 'Saving...' : (selectedItem ? 'Update' : 'Create')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default MenuForm;
