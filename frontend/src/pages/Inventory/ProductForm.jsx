import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';

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

const initialFormData = {
  name: '',
  category: '',
  item_type: '',
  base_unit_price: '',
  base_unit: '',
  input_unit: '',
  input_quantity: '',
  conversion_amount: '',
  minimum_threshold_input_units: '',
  description: '',
};

const AddProductForm = () => {
  const { user } = useAuth();
  const branchId = user?.branch || null;
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({});
  const [selectedItemType, setSelectedItemType] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [formData, setFormData] = useState({
    ...initialFormData,
    item_type: ''
  });
  const [calculatedBaseUnits, setCalculatedBaseUnits] = useState('');
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryData, setNewCategoryData] = useState({ name: '', item_type: '' });
  const [showAddUnitModal, setShowAddUnitModal] = useState(false);
  const [newUnitData, setNewUnitData] = useState({ name: '', is_liquid_unit: false });
  const [showAddItemTypeModal, setShowAddItemTypeModal] = useState(false);
  const [newItemTypeData, setNewItemTypeData] = useState({ name: '', description: '' });

  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, unitRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(), // Use inventory categories for inventory form
          axios.get('http://localhost:8000/api/inventory/productunits/', { withCredentials: true }),
        ]);
        setItemTypes(itemTypeData);
        setCategories(categoryData);
        setUnits(unitRes.data);
        // Find beverage item type and set it as default
        const beverageType = itemTypeData.find(type => 
          type.type_name?.toLowerCase().includes('beverage')
        );
        if (beverageType) {
          setSelectedItemType(beverageType.id);
          setFormData(prev => ({ ...prev, item_type: beverageType.id }));
        }
      } catch (error) {
        console.error('Error loading data:', error);
        if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
          setSubmitError('Cannot connect to server. Please make sure the backend is running.');
        } else {
          setSubmitError(`Error loading data: ${error.message}`);
        }
      } finally {
      }
    }
    loadData();
  }, []);

  // Calculate base units when input quantity or conversion amount changes
  useEffect(() => {
    if (formData.input_quantity && formData.conversion_amount) {
      const calculated = parseFloat(formData.input_quantity) * parseFloat(formData.conversion_amount);
      setCalculatedBaseUnits(calculated.toFixed(2));
    } else {
      setCalculatedBaseUnits('');
    }
  }, [formData.input_quantity, formData.conversion_amount]);

  // The useEffect for isNewProduct is removed as per the edit hint.

  // Validate the entire form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.item_type) newErrors.item_type = 'Item type is required';
    if (!formData.name?.trim()) newErrors.name = 'Product name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.base_unit_price) newErrors.base_unit_price = 'Price is required';
    if (!formData.base_unit) newErrors.base_unit = 'Base unit is required';
    if (!formData.input_unit) newErrors.input_unit = 'Input unit is required';
    if (!formData.input_quantity) newErrors.input_quantity = 'Input quantity is required';
    if (!formData.conversion_amount) newErrors.conversion_amount = 'Conversion amount is required';
    // Minimum threshold is optional - removed from required validation
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔍 Form submit triggered');
    console.log('🔍 Form data:', formData);
    console.log('🔍 Errors before validation:', errors);
    
    setErrors({});
    setSubmitMessage('');
    setSubmitError('');
    
    const valid = validateForm();
    console.log('🔍 Form validation result:', valid);
    console.log('🔍 Errors after validation:', errors);
    
    if (!valid) {
      console.log('❌ Form validation failed, not showing confirmation modal');
      return;
    }
    
    console.log('✅ Form validation passed, showing confirmation modal');
    setShowConfirmModal(true);
  };

  // Handle input changes and validation
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = files ? files[0] : value;
    setFormData((prev) => ({ ...prev, [name]: newValue }));

    // Validate this field only
    let err = { ...errors };
    switch (name) {
      case 'item_type':
        if (!value) err.item_type = 'Item type is required';
        else delete err.item_type;
        break;
      case 'name':
        if (!value.trim()) err.name = 'Product name is required';
        else delete err.name;
        break;
      case 'category':
        if (!value) err.category = 'Category is required';
        else delete err.category;
        break;
      case 'base_unit_price':
        if (!value) err.base_unit_price = 'Price is required';
        else if (isNaN(Number(value)) || Number(value) < 0) err.base_unit_price = 'Price must be positive';
        else delete err.base_unit_price;
        break;
      case 'base_unit':
        if (!value) err.base_unit = 'Base unit is required';
        else delete err.base_unit;
        break;
      case 'input_unit':
        if (!value) err.input_unit = 'Input unit is required';
        else delete err.input_unit;
        break;
      case 'input_quantity':
        if (!value) err.input_quantity = 'Input quantity is required';
        else delete err.input_quantity;
        break;
      case 'conversion_amount':
        if (!value) err.conversion_amount = 'Conversion amount is required';
        else delete err.conversion_amount;
        break;
      case 'minimum_threshold_input_units':
        // Minimum threshold is optional, so no validation error if empty
        if (!value && value !== '') delete err.minimum_threshold_input_units;
        break;
      default:
        break;
    }
    setErrors(err);
  };

  // Actual API submission logic, extracted from handleSubmit
  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    const csrfToken = getCookie('csrftoken');
    try {
      // Create Product with initial stock in a single request
      const productData = {
        name: formData.name,
        category_id: parseInt(formData.category),
        item_type_id: parseInt(formData.item_type),
        base_unit_id: parseInt(formData.base_unit),
        input_unit_id: parseInt(formData.input_unit),
        conversion_amount: parseFloat(formData.conversion_amount),
        base_unit_price: parseFloat(formData.base_unit_price),
        description: formData.description || '',
        is_active: true,
        // Include initial stock data for the backend to create stock automatically
        initial_stock: {
          branch_id: branchId || 1, // Default to branch 1 if no user branch
          input_quantity: parseFloat(formData.input_quantity),
          minimum_threshold_input_units: parseFloat(formData.minimum_threshold_input_units) || 0
        }
      };

      console.log('🔍 DEBUG: Form data being sent:', formData);
      console.log('🔍 DEBUG: Product data being sent to API:', productData);
      console.log('🔍 DEBUG: CSRF Token:', csrfToken);

      const productResponse = await axios.post(
        'http://localhost:8000/api/inventory/products/',
        productData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
        }
      );

      const createdProduct = productResponse.data;
      console.log('✅ Product created successfully:', createdProduct);

      if (!createdProduct.id) {
        setSubmitError('Product creation failed: No product ID returned.');
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }

      setSubmitMessage(`✅ Product "${formData.name}" created successfully!`);
      setFormData(initialFormData);
      setCalculatedBaseUnits('');
      
      // Close modal and refresh the parent component
      setTimeout(() => {
        setSubmitMessage('');
        setShowConfirmModal(false);
        // Trigger refresh in parent component
        if (window.refreshInventoryData) {
          window.refreshInventoryData();
        }
      }, 2000);
      
    } catch (err) {
      console.error('❌ Submit error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      let errorMessage = 'Failed to create product: ';
      
      if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else if (err.response?.data?.name) {
        errorMessage += err.response.data.name[0];
      } else if (err.response?.data?.category_id) {
        errorMessage += err.response.data.category_id[0];
      } else if (err.response?.data?.item_type_id) {
        errorMessage += err.response.data.item_type_id[0];
      } else if (err.response?.data?.base_unit_id) {
        errorMessage += err.response.data.base_unit_id[0];
      } else if (err.response?.data?.input_unit_id) {
        errorMessage += err.response.data.input_unit_id[0];
      } else if (err.response?.data?.conversion_amount) {
        errorMessage += err.response.data.conversion_amount[0];
      } else if (err.response?.data?.base_unit_price) {
        errorMessage += err.response.data.base_unit_price[0];
      } else if (err.response?.data) {
        // Show all validation errors
        const errors = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += errors;
      } else {
        errorMessage += err.message;
      }
      
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const reloadCategories = async () => {
    try {
      const categoryData = await fetchCategories();
      setCategories(categoryData);
    } catch (error) {
      console.error('Error reloading categories:', error);
      setSubmitError('Failed to reload categories.');
    }
  };

  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitMessage('');
    setSubmitError('');
    const valid = true; // No specific validation for category name
    if (!valid) return;

    const csrfToken = getCookie('csrftoken');
    try {
      const categoryData = {
        category_name: newCategoryData.name,
        item_type_id: parseInt(newCategoryData.item_type),
        is_active: true,
      };

      const response = await axios.post(
        'http://localhost:8000/api/inventory/categories/',
        categoryData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
        }
      );

      const createdCategory = response.data;
      console.log('✅ Category created successfully:', createdCategory);
      setCategories(prev => [...prev, createdCategory]);
      setShowAddCategoryModal(false);
      setNewCategoryData({ name: '', item_type: '' });
      setSubmitMessage(`✅ Category "${createdCategory.category_name}" created successfully!`);

      // Trigger refresh in parent component
      if (window.refreshInventoryData) {
        window.refreshInventoryData();
      }

    } catch (err) {
      console.error('❌ Category creation error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      let errorMessage = 'Failed to create category: ';
      
      if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else if (err.response?.data?.name) {
        errorMessage += err.response.data.name[0];
      } else if (err.response?.data?.item_type_id) {
        errorMessage += err.response.data.item_type_id[0];
      } else if (err.response?.data) {
        // Show all validation errors
        const errors = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += errors;
      } else {
        errorMessage += err.message;
      }
      
      setSubmitError(errorMessage);
    }
  };

  const reloadUnits = async () => {
    try {
      const unitData = await axios.get('http://localhost:8000/api/inventory/productunits/', { withCredentials: true });
      setUnits(unitData.data);
    } catch (error) {
      console.error('Error reloading units:', error);
      setSubmitError('Failed to reload units.');
    }
  };

  const handleAddUnitSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitMessage('');
    setSubmitError('');
    const valid = true; // No specific validation for unit name
    if (!valid) return;

    const csrfToken = getCookie('csrftoken');
    try {
      const unitData = {
        unit_name: newUnitData.name,
        is_liquid_unit: newUnitData.is_liquid_unit,
        is_active: true,
      };

      const response = await axios.post(
        'http://localhost:8000/api/inventory/productunits/',
        unitData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
        }
      );

      const createdUnit = response.data;
      console.log('✅ Unit created successfully:', createdUnit);
      setUnits(prev => [...prev, createdUnit]);
      setShowAddUnitModal(false);
      setNewUnitData({ name: '', is_liquid_unit: false });
      setSubmitMessage(`✅ Unit "${createdUnit.unit_name}" created successfully!`);

      // Trigger refresh in parent component
      if (window.refreshInventoryData) {
        window.refreshInventoryData();
      }

    } catch (err) {
      console.error('❌ Unit creation error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      let errorMessage = 'Failed to create unit: ';
      
      if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else if (err.response?.data?.name) {
        errorMessage += err.response.data.name[0];
      } else if (err.response?.data) {
        // Show all validation errors
        const errors = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += errors;
      } else {
        errorMessage += err.message;
      }
      
      setSubmitError(errorMessage);
    }
  };

  const reloadItemTypes = async () => {
    try {
      const itemTypeData = await fetchItemTypes();
      setItemTypes(itemTypeData);
    } catch (error) {
      console.error('Error reloading item types:', error);
      setSubmitError('Failed to reload item types.');
    }
  };

  const handleAddItemTypeSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitMessage('');
    setSubmitError('');
    const valid = true; // No specific validation for item type name
    if (!valid) return;

    const csrfToken = getCookie('csrftoken');
    try {
      const itemTypeData = {
        type_name: newItemTypeData.name,
        description: newItemTypeData.description || '',
        is_active: true,
      };

      const response = await axios.post(
        'http://localhost:8000/api/inventory/itemtypes/',
        itemTypeData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
        }
      );

      const createdItemType = response.data;
      console.log('✅ Item type created successfully:', createdItemType);
      setItemTypes(prev => [...prev, createdItemType]);
      setShowAddItemTypeModal(false);
      setNewItemTypeData({ name: '', description: '' });
      setSubmitMessage(`✅ Item type "${createdItemType.type_name}" created successfully!`);

      // Trigger refresh in parent component
      if (window.refreshInventoryData) {
        window.refreshInventoryData();
      }

    } catch (err) {
      console.error('❌ Item type creation error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        headers: err.response?.headers
      });
      
      let errorMessage = 'Failed to create item type: ';
      
      if (err.response?.data?.detail) {
        errorMessage += err.response.data.detail;
      } else if (err.response?.data?.name) {
        errorMessage += err.response.data.name[0];
      } else if (err.response?.data) {
        // Show all validation errors
        const errors = Object.entries(err.response.data)
          .map(([field, messages]) => `${field}: ${Array.isArray(messages) ? messages.join(', ') : messages}`)
          .join('; ');
        errorMessage += errors;
      } else {
        errorMessage += err.message;
      }
      
      setSubmitError(errorMessage);
    }
  };


  return (
    <div className="p-4 max-w-3xl mx-auto h-[90vh] overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Product</h1>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {submitMessage && (
          <div className="bg-green-100 text-green-800 p-2 rounded text-center font-semibold">{submitMessage}</div>
        )}
        {submitError && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-center font-semibold">{submitError}</div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-200 text-red-800 p-2 rounded text-center font-semibold mb-2">
            Please fix the following errors:
            <ul className="text-left mt-1">
              {Object.entries(errors).map(([key, val]) => (
                <li key={key}>{val}</li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <label className="block font-semibold mb-1">Item Type</label>
          <select
            name="item_type"
            value={formData.item_type}
            onChange={e => {
              setSelectedItemType(e.target.value);
              setFormData(prev => ({ ...prev, item_type: e.target.value, category: '' }));
            }}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
          >
            <option value="">Select item type</option>
            {itemTypes.length > 0 ? (
              itemTypes
                .sort((a, b) => {
                  if (a.type_name?.toLowerCase().includes('beverage')) return -1;
                  if (b.type_name?.toLowerCase().includes('beverage')) return 1;
                  return a.type_name?.localeCompare(b.type_name);
                })
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.type_name}
                  </option>
                ))
            ) : (
              <option value="" disabled>No item types available</option>
            )}
          </select>
          
          {/* Add Item Type Button */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => {
                setNewItemTypeData({ name: '', description: '' });
                setShowAddItemTypeModal(true);
              }}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 text-sm"
            >
              ➕ Add New Item Type
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Product Name</label>
          <input
            type="text"
            name="name"
            placeholder="Enter new product name"
            value={formData.name}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.name ? 'border-red-500' : ''}`}
          />
          {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.category ? 'border-red-500' : ''}`}
            disabled={!formData.item_type || categories.length === 0}
          >
            <option value="">
              {!formData.item_type 
                ? 'Select item type first'
                : categories.filter((cat) => parseInt(cat.item_type?.id || cat.item_type_id) === parseInt(formData.item_type)).length === 0
                ? 'No categories for this item type'
                : 'Select category'
              }
            </option>
            {formData.item_type && categories.length > 0 && 
              categories
                .filter((cat) => {
                  // Filter inventory categories by item_type.id (since item_type is an object)
                  const catTypeId = parseInt(cat.item_type?.id || cat.item_type_id);
                  const formTypeId = parseInt(formData.item_type);
                  return catTypeId === formTypeId;
                })
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))
            }
          </select>
          
          {/* Category count and status */}
          {formData.item_type && (
            <div className="text-sm text-gray-600 mt-1">
              <span className="text-gray-600">
                {categories.filter((cat) => parseInt(cat.item_type?.id || cat.item_type_id) === parseInt(formData.item_type)).length} categories available
              </span>
            </div>
          )}
          
          {formData.item_type && categories.filter((cat) => parseInt(cat.item_type?.id || cat.item_type_id) === parseInt(formData.item_type)).length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-2">
              <p className="text-yellow-800 text-sm">
                <strong>No categories available for this item type.</strong>
                <br />
                Please create a category first using the button below.
              </p>
            </div>
          )}
          
          {/* Add Category Button */}
          <div className="flex justify-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => {
                setNewCategoryData({ name: '', item_type: formData.item_type });
                setShowAddCategoryModal(true);
              }}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
              disabled={!formData.item_type}
            >
              ➕ Add New Category
            </button>
            
            <button
              type="button"
              onClick={reloadCategories}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
            >
              🔄 Refresh Categories
            </button>
          </div>
          
          {errors?.category && <p className="text-red-500 text-sm">{errors.category}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Base Unit</label>
          <select
            name="base_unit"
            value={formData.base_unit}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.base_unit ? 'border-red-500' : ''}`}
          >
            <option value="">Select base unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_name}
              </option>
            ))}
          </select>
          {errors?.base_unit && <p className="text-red-500 text-sm">{errors.base_unit}</p>}
          
          {/* Add Unit Button */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => {
                setNewUnitData({ name: '', is_liquid_unit: false });
                setShowAddUnitModal(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              ➕ Add New Unit
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Base Unit Price (ETB)</label>
          <input
            type="number"
            name="base_unit_price"
            value={formData.base_unit_price}
            onChange={handleInputChange}
            placeholder="Enter price per base unit"
            step="0.01"
            min="0"
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.base_unit_price ? 'border-red-500' : ''}`}
          />
          {errors?.base_unit_price && <p className="text-red-500 text-sm">{errors.base_unit_price}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Input Unit</label>
          <select
            name="input_unit"
            value={formData.input_unit}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.input_unit ? 'border-red-500' : ''}`}
          >
            <option value="">Select input unit</option>
            {units.map((unit) => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_name}
              </option>
            ))}
          </select>
          {errors?.input_unit && <p className="text-red-500 text-sm">{errors.input_unit}</p>}
          
          {/* Add Unit Button */}
          <div className="flex justify-center mt-2">
            <button
              type="button"
              onClick={() => {
                setNewUnitData({ name: '', is_liquid_unit: false });
                setShowAddUnitModal(true);
              }}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 text-sm"
            >
              ➕ Add New Unit
            </button>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Input Quantity</label>
          <input
            type="number"
            name="input_quantity"
            value={formData.input_quantity}
            onChange={handleInputChange}
            placeholder="Enter quantity in input units"
            step="0.01"
            min="0"
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.input_quantity ? 'border-red-500' : ''}`}
          />
          {errors?.input_quantity && <p className="text-red-500 text-sm">{errors.input_quantity}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Conversion Amount</label>
          <input
            type="number"
            name="conversion_amount"
            value={formData.conversion_amount}
            onChange={handleInputChange}
            placeholder="How many base units in one input unit"
            step="0.01"
            min="0"
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.conversion_amount ? 'border-red-500' : ''}`}
          />
          {errors?.conversion_amount && <p className="text-red-500 text-sm">{errors.conversion_amount}</p>}
        </div>

        {/* Measurement Creation Section */}
        <div className="bg-blue-50 border border-blue-200 rounded p-4">
          <h3 className="font-semibold text-blue-900 mb-3">📏 Create Unit Conversion</h3>
          <p className="text-sm text-blue-800 mb-3">
            This will create a measurement conversion between your input unit and base unit.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            <div className="text-center">
              <span className="font-medium">Input Unit:</span>
              <div className="text-blue-600">
                {units.find(u => u.id === parseInt(formData.input_unit))?.unit_name || 'Not selected'}
              </div>
            </div>
            <div className="text-center">
              <span className="font-medium">Conversion:</span>
              <div className="text-green-600 font-bold">
                {formData.conversion_amount || '0'} : 1
              </div>
            </div>
            <div className="text-center">
              <span className="font-medium">Base Unit:</span>
              <div className="text-blue-600">
                {units.find(u => u.id === parseInt(formData.base_unit))?.unit_name || 'Not selected'}
              </div>
            </div>
          </div>
          
          <div className="mt-3 text-center">
            <span className="text-sm text-gray-600">
              {formData.input_unit && formData.base_unit && formData.conversion_amount ? 
                `1 ${units.find(u => u.id === parseInt(formData.input_unit))?.unit_name} = ${formData.conversion_amount} ${units.find(u => u.id === parseInt(formData.base_unit))?.unit_name}` :
                'Select units and conversion amount to see the relationship'
              }
            </span>
          </div>
        </div>

        <div>
          <label className="block font-semibold mb-1">Calculated Base Units</label>
          <input
            type="number"
            value={calculatedBaseUnits}
            readOnly
            className="border p-2 w-full bg-gray-100 rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
          />
        </div>

        <div>
          <label className="block font-semibold mb-1">Minimum Threshold (Input Units)</label>
          <input
            type="number"
            name="minimum_threshold_input_units"
            value={formData.minimum_threshold_input_units}
            onChange={handleInputChange}
            placeholder="Enter minimum stock level in input units (e.g., 2 cartons)"
            step="0.01"
            min="0"
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.minimum_threshold_input_units ? 'border-red-500' : ''}`}
          />
          {errors?.minimum_threshold_input_units && <p className="text-red-500 text-sm">{errors.minimum_threshold_input_units}</p>}
        </div>

        <div>
          <label className="block font-semibold mb-1">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter product description (optional)"
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 rounded text-white font-medium ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isSubmitting ? 'Creating Product...' : 'Create Product'}
          </button>
          
          {/* Test button to see if form submission works */}
          <button
            type="button"
            onClick={() => {
              console.log('🔍 Test button clicked');
              console.log('🔍 Current form data:', formData);
              console.log('🔍 Current errors:', errors);
            }}
            className="px-6 py-2 rounded text-white font-medium bg-gray-600 hover:bg-gray-700"
          >
            Test Form
          </button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Product Creation</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to create the product "{formData.name}"?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-2 rounded text-white ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? 'Creating...' : 'Create Product'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategorySubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Category Name</label>
                <input
                  type="text"
                  name="category_name"
                  value={newCategoryData.name}
                  onChange={(e) => setNewCategoryData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter new category name"
                  className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.name ? 'border-red-500' : ''}`}
                />
                {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div>
                <label className="block font-semibold mb-1">Item Type</label>
                <select
                  name="item_type"
                  value={newCategoryData.item_type}
                  onChange={(e) => setNewCategoryData(prev => ({ ...prev, item_type: e.target.value }))}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
                  disabled={itemTypes.length === 0}
                >
                  <option value="">Select item type</option>
                  {itemTypes.length > 0 && (
                    itemTypes
                      .sort((a, b) => {
                        if (a.type_name?.toLowerCase().includes('beverage')) return -1;
                        if (b.type_name?.toLowerCase().includes('beverage')) return 1;
                        return a.type_name?.localeCompare(b.type_name);
                      })
                      .map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.type_name}
                        </option>
                      ))
                  )}
                </select>
                {errors?.item_type && <p className="text-red-500 text-sm">{errors.item_type}</p>}
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddCategoryModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 rounded text-white ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Unit Modal */}
      {showAddUnitModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Unit</h3>
            <form onSubmit={handleAddUnitSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Unit Name</label>
                <input
                  type="text"
                  name="unit_name"
                  value={newUnitData.name}
                  onChange={(e) => setNewUnitData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter new unit name"
                  className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.name ? 'border-red-500' : ''}`}
                />
                {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div>
                <label className="block font-semibold mb-1">Is Liquid Unit</label>
                <select
                  name="is_liquid_unit"
                  value={newUnitData.is_liquid_unit ? 'true' : 'false'}
                  onChange={(e) => setNewUnitData(prev => ({ ...prev, is_liquid_unit: e.target.value === 'true' }))}
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
                >
                  <option value="false">No</option>
                  <option value="true">Yes</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddUnitModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 rounded text-white ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add Unit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Type Modal */}
      {showAddItemTypeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Add New Item Type</h3>
            <form onSubmit={handleAddItemTypeSubmit} className="space-y-4">
              <div>
                <label className="block font-semibold mb-1">Item Type Name</label>
                <input
                  type="text"
                  name="type_name"
                  value={newItemTypeData.name}
                  onChange={(e) => setNewItemTypeData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter new item type name"
                  className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.name ? 'border-red-500' : ''}`}
                />
                {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
              </div>
              <div>
                <label className="block font-semibold mb-1">Description</label>
                <textarea
                  name="description"
                  value={newItemTypeData.description}
                  onChange={(e) => setNewItemTypeData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter item type description (optional)"
                  className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
                  rows="3"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddItemTypeModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`flex-1 px-4 py-2 rounded text-white ${
                    isSubmitting 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? 'Adding...' : 'Add Item Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;