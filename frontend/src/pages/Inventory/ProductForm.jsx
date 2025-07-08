import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const AddProductForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const branchId = user?.branch || null;

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState('');
  const [allowedToAdd, setAllowedToAdd] = useState(false);
  const [products, setProducts] = useState([]);
  const [isNewName, setIsNewName] = useState(true);
  const [errors, setErrors] = useState(null);

  const initialFormData = {
    name: '',
    category: '',
    price_per_unit: '',
    quantityType: '',
    bottles_per_carton: '',
    carton_quantity: '',
    bottle_quantity: '',
    unit_quantity: '',
    minimum_threshold: '',
    running_out: false,
    receipt_image: null,
  };

  const [formData, setFormData] = useState(initialFormData);

  // Load item types, categories, and existing products on mount
  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, productRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(),
          axios.get('http://localhost:8000/api/inventory/inventory/', {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access')}`,
            },
          }),
        ]);
        setItemTypes(itemTypeData);
        setCategories(categoryData);
        setExistingProducts(productRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  // Update allowedToAdd based on selected item type
  useEffect(() => {
    const selectedItem = itemTypes.find((i) => i.id.toString() === selectedItemType);
    setAllowedToAdd(
      selectedItem && ['beverage', 'drink'].includes(selectedItem.type_name.toLowerCase())
    );
    // Reset category when item type changes
    setFormData((prev) => ({ ...prev, category: '' }));
  }, [selectedItemType, itemTypes]);

  // Auto calculate bottle_quantity when carton quantities change
  useEffect(() => {
    if (formData.quantityType === 'carton') {
      const bottles =
        (Number(formData.bottles_per_carton) || 0) * (Number(formData.carton_quantity) || 0);
      setFormData((prev) => ({ ...prev, bottle_quantity: bottles.toString() }));
    }
  }, [formData.bottles_per_carton, formData.carton_quantity, formData.quantityType]);

  // Validate form fields before adding product
  const validateForm = () => {
    let err = {};

    if (!formData.name.trim()) err.name = 'Product name is required.';
    if (!formData.category) err.category = 'Category is required.';
    if (!formData.price_per_unit) err.price_per_unit = 'Price per unit is required.';
    else if (isNaN(Number(formData.price_per_unit)) || Number(formData.price_per_unit) < 0)
      err.price_per_unit = 'Price per unit must be a non-negative number.';
    if (!formData.quantityType) err.quantityType = 'Quantity type is required.';

    if (formData.quantityType === 'carton') {
      if (!formData.bottles_per_carton || Number(formData.bottles_per_carton) <= 0)
        err.bottles_per_carton = 'Bottles per carton must be greater than 0.';
      if (!formData.carton_quantity || Number(formData.carton_quantity) < 0)
        err.carton_quantity = 'Carton quantity must be 0 or more.';
    } else if (formData.quantityType === 'bottle') {
      if (formData.bottle_quantity === '' || Number(formData.bottle_quantity) < 0)
        err.bottle_quantity = 'Bottle quantity must be 0 or more.';
    } else if (formData.quantityType === 'unit') {
      if (formData.unit_quantity === '' || Number(formData.unit_quantity) < 0)
        err.unit_quantity = 'Unit quantity must be 0 or more.';
    }

    if (formData.minimum_threshold === '' || Number(formData.minimum_threshold) < 0)
      err.minimum_threshold = 'Minimum threshold must be 0 or more.';

    setErrors(err);

    return Object.keys(err).length === 0;
  };

  // Handle add product to the products batch list
  const handleAddToList = () => {
    setErrors(null);

    if (!validateForm()) {
      return;
    }

    if (!branchId) {
      alert('Branch info not found. Please login again.');
      return;
    }

    const trimmedName = formData.name.trim();
    const isDuplicate = products.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert('Duplicate product name in this batch.');
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: trimmedName,
      category: Number(formData.category),
      price_per_unit: parseFloat(formData.price_per_unit).toFixed(2),
      quantityType: formData.quantityType,
      uses_carton: formData.quantityType === 'carton',
      bottles_per_carton:
        formData.quantityType === 'carton' ? Number(formData.bottles_per_carton) : 0,
      carton_quantity: Number(formData.carton_quantity) || 0,
      bottle_quantity: Number(formData.bottle_quantity) || 0,
      unit_quantity: parseFloat(formData.unit_quantity) || 0,
      minimum_threshold: parseFloat(formData.minimum_threshold) || 0,
      running_out: Boolean(formData.running_out),
      branch_id: branchId,
      receipt_image: formData.receipt_image,
    };

    setProducts((prev) => [...prev, newProduct]);
    setFormData(initialFormData);
    setIsNewName(true);
  };

  // Submit all products with their stock info to backend
  const handleSubmitAll = async () => {
    if (products.length === 0) {
      alert('Please add at least one product.');
      return;
    }

    try {
      for (const product of products) {
        const productFormData = new FormData();
        productFormData.append('name', product.name);
        productFormData.append('category_id', product.category);
        productFormData.append('price_per_unit', product.price_per_unit);
        productFormData.append('uses_carton', product.uses_carton ? 'true' : 'false');
        productFormData.append('bottles_per_carton', product.bottles_per_carton);
        if (product.receipt_image) {
          productFormData.append('receipt_image', product.receipt_image);
        }

        // Create Product
        const productResponse = await axios.post(
          'http://localhost:8000/api/inventory/inventory/',
          productFormData,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access')}`,
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        const createdProduct = productResponse.data;

        // Create Stock linked to Product and Branch
        await axios.post(
          'http://localhost:8000/api/inventory/stocks/',
          {
            carton_quantity: product.carton_quantity,
            bottle_quantity: product.bottle_quantity,
            unit_quantity: product.unit_quantity,
            branch_id: product.branch_id,
            product_id: createdProduct.id,
            minimum_threshold: product.minimum_threshold,
            running_out: product.running_out,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access')}`,
            },
          }
        );
      }

      alert('Products and stock submitted successfully!');
      setProducts([]);
      setSelectedItemType('');
      setAllowedToAdd(false);
      navigate('/branch-manager/inventory');
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      alert('Error: ' + JSON.stringify(err.response?.data || err.message));
    }
  };

  // Handle changes for product name selection (existing or new)
  const handleNameSelect = (e) => {
    const selectedName = e.target.value;
    if (selectedName === '__new') {
      setIsNewName(true);
      setFormData((prev) => ({ ...prev, name: '' }));
    } else {
      setIsNewName(false);
      setFormData((prev) => ({ ...prev, name: selectedName }));
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Products</h1>

      <div className="mb-4">
        <label className="block font-semibold mb-1">Branch ID</label>
        <input
          type="text"
          value={branchId || ''}
          readOnly
          className="border p-2 w-full bg-gray-100"
        />
      </div>

      <div className="mb-4">
        <label className="block font-semibold">Receipt Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) =>
            setFormData((prev) => ({ ...prev, receipt_image: e.target.files[0] }))
          }
          className="border p-2 w-full"
        />
      </div>

      <select
        value={selectedItemType}
        onChange={(e) => setSelectedItemType(e.target.value)}
        className="border p-2 w-full mb-4"
      >
        <option value="">Select Item Type</option>
        {itemTypes.map((item) => (
          <option key={item.id} value={item.id}>
            {item.type_name}
          </option>
        ))}
      </select>

      {allowedToAdd ? (
        <div className="space-y-4">
          <label className="block font-semibold">Product Name</label>
          <select
            value={isNewName ? '__new' : formData.name}
            onChange={handleNameSelect}
            className="border p-2 w-full"
          >
            <option value="__new">+ Add New Product Name</option>
            {existingProducts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>

          {isNewName && (
            <input
              type="text"
              placeholder="Enter New Product Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`border p-2 w-full ${
                errors?.name ? 'border-red-500' : ''
              }`}
            />
          )}
          {errors?.name && (
            <p className="text-red-500 text-sm">{errors.name}</p>
          )}

          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`border p-2 w-full ${
              errors?.category ? 'border-red-500' : ''
            }`}
          >
            <option value="">Select Category</option>
            {categories
              .filter((cat) => cat.item_type.id === parseInt(selectedItemType))
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
          </select>
          {errors?.category && (
            <p className="text-red-500 text-sm">{errors.category}</p>
          )}

          <input
            type="number"
            placeholder="Unit Price"
            value={formData.price_per_unit}
            onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
            className={`border p-2 w-full ${
              errors?.price_per_unit ? 'border-red-500' : ''
            }`}
          />
          {errors?.price_per_unit && (
            <p className="text-red-500 text-sm">{errors.price_per_unit}</p>
          )}

          <div>
            <label className="block font-semibold">Quantity Type</label>
            {['carton', 'bottle', 'unit'].map((type) => (
              <label key={type} className="inline-flex items-center mr-4">
                <input
                  type="radio"
                  name="quantityType"
                  value={type}
                  checked={formData.quantityType === type}
                  onChange={(e) => setFormData({ ...formData, quantityType: e.target.value })}
                />
                <span className="ml-2 capitalize">By {type}</span>
              </label>
            ))}
            {errors?.quantityType && (
              <p className="text-red-500 text-sm">{errors.quantityType}</p>
            )}
          </div>

          {formData.quantityType === 'carton' && (
            <>
              <input
                type="number"
                placeholder="Bottles per Carton"
                value={formData.bottles_per_carton}
                onChange={(e) =>
                  setFormData({ ...formData, bottles_per_carton: e.target.value })
                }
                className={`border p-2 w-full ${
                  errors?.bottles_per_carton ? 'border-red-500' : ''
                }`}
              />
              {errors?.bottles_per_carton && (
                <p className="text-red-500 text-sm">{errors.bottles_per_carton}</p>
              )}
              <input
                type="number"
                placeholder="Carton Quantity"
                value={formData.carton_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, carton_quantity: e.target.value })
                }
                className={`border p-2 w-full ${
                  errors?.carton_quantity ? 'border-red-500' : ''
                }`}
              />
              {errors?.carton_quantity && (
                <p className="text-red-500 text-sm">{errors.carton_quantity}</p>
              )}
              <input
                type="number"
                value={formData.bottle_quantity}
                readOnly
                className="border p-2 w-full bg-gray-100"
                aria-label="Calculated bottle quantity"
              />
            </>
          )}

          {formData.quantityType === 'bottle' && (
            <>
              <input
                type="number"
                placeholder="Bottle Quantity"
                value={formData.bottle_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, bottle_quantity: e.target.value })
                }
                className={`border p-2 w-full ${
                  errors?.bottle_quantity ? 'border-red-500' : ''
                }`}
              />
              {errors?.bottle_quantity && (
                <p className="text-red-500 text-sm">{errors.bottle_quantity}</p>
              )}
            </>
          )}

          {formData.quantityType === 'unit' && (
            <>
              <input
                type="number"
                step="0.01"
                placeholder="Unit Quantity (e.g., 0.00)"
                value={formData.unit_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, unit_quantity: e.target.value })
                }
                className={`border p-2 w-full ${
                  errors?.unit_quantity ? 'border-red-500' : ''
                }`}
              />
              {errors?.unit_quantity && (
                <p className="text-red-500 text-sm">{errors.unit_quantity}</p>
              )}
            </>
          )}

          <input
            type="number"
            step="0.01"
            placeholder="Minimum Threshold"
            value={formData.minimum_threshold}
            onChange={(e) =>
              setFormData({ ...formData, minimum_threshold: e.target.value })
            }
            className={`border p-2 w-full ${
              errors?.minimum_threshold ? 'border-red-500' : ''
            }`}
          />
          {errors?.minimum_threshold && (
            <p className="text-red-500 text-sm">{errors.minimum_threshold}</p>
          )}

          <label className="inline-flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.running_out}
              onChange={(e) => setFormData({ ...formData, running_out: e.target.checked })}
            />
            <span>Running Out</span>
          </label>

          <button
            type="button"
            onClick={handleAddToList}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            + Add Product to List
          </button>
        </div>
      ) : (
        <div className="text-red-600">Only beverages or drinks allowed.</div>
      )}

      {products.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">Products in Queue:</h2>
          <ul className="space-y-2 border p-2 max-h-64 overflow-auto">
            {products.map((p, idx) => (
              <li key={p.id} className="bg-gray-100 rounded p-2 flex justify-between items-center">
                <span>
                  {idx + 1}. {p.name} – Price: ${p.price_per_unit}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProducts((prev) => prev.filter((prod) => prod.id !== p.id))
                  }
                  className="text-red-600 hover:underline"
                  aria-label={`Remove product ${p.name}`}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={handleSubmitAll}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
            disabled={products.length === 0}
          >
            Submit All
          </button>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
