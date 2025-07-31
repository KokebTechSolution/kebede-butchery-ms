import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axiosInstance from '../../api/axiosInstance';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const initialFormData = {
  name: '',
  category: '',
  base_unit_price: '',
  base_unit: '',
  input_unit: '',
  input_quantity: '',
  conversion_amount: '',
  minimum_threshold_base_units: '',
  description: '',
  receipt_image: null,
};

const AddProductForm = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const branchId = user?.branch || null;
  const { t } = useTranslation();

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [units, setUnits] = useState([]);
  const [errors, setErrors] = useState({}); // ensure errors is always an object
  const [selectedItemType, setSelectedItemType] = useState('');
  const [products, setProducts] = useState([]);
  const [isNewProduct, setIsNewProduct] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [batchProducts, setBatchProducts] = useState([]);

  const [formData, setFormData] = useState(initialFormData);
  const [calculatedBaseUnits, setCalculatedBaseUnits] = useState('');
  const prevIsNewProduct = useRef(isNewProduct);

  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, unitRes, productRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(),
          axiosInstance.get('inventory/productunits/'),
          axiosInstance.get('inventory/products/'),
        ]);
        setItemTypes(itemTypeData);
        setCategories(categoryData);
        setUnits(unitRes.data);
        setProducts(productRes.data);
        console.log('Products loaded from /api/inventory/products/', productRes.data);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    // Calculate total in base units
    const qty = parseFloat(formData.input_quantity) || 0;
    const conv = parseFloat(formData.conversion_amount) || 1;
    const calculated = qty * conv;
    setCalculatedBaseUnits(calculated);
    console.log(`[FRONTEND DEBUG] Calculation: ${qty} × ${conv} = ${calculated}`);
  }, [formData.input_quantity, formData.conversion_amount]);

  useEffect(() => {
    if (isNewProduct && !prevIsNewProduct.current) {
      setFormData({ ...initialFormData, name: '' });
    }
    prevIsNewProduct.current = isNewProduct;
  }, [isNewProduct]);

  // Prevent duplicate product names with enhanced checking
  const isDuplicateName = (name) => {
    if (!name || !name.trim()) return false;
    const trimmedName = name.trim().toLowerCase();
    return products.some(product => 
      product.name.trim().toLowerCase() === trimmedName
    );
  };

  const getDuplicateProductInfo = (name) => {
    if (!name || !name.trim()) return null;
    const trimmedName = name.trim().toLowerCase();
    return products.find(product => 
      product.name.trim().toLowerCase() === trimmedName
    );
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (isDuplicateName(formData.name)) {
      newErrors.name = 'Product name already exists';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.base_unit_price || parseFloat(formData.base_unit_price) <= 0) {
      newErrors.base_unit_price = 'Valid base unit price is required';
    }

    if (!formData.base_unit) {
      newErrors.base_unit = 'Base unit is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reloadProducts = async () => {
    try {
      const productRes = await axiosInstance.get('inventory/products/');
      setProducts(productRes.data);
    } catch (error) {
      console.error('Error reloading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage('');
    setSubmitError('');

    try {
      const productRes = await axiosInstance.get('inventory/products/');
      setProducts(productRes.data);
      console.log('Products loaded from /api/inventory/products/', productRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }

    // Check for duplicates in existing products
    const checkBatchDuplicates = (productName) => {
      return batchProducts.some(product => 
        product.name.trim().toLowerCase() === productName.trim().toLowerCase()
      );
    };

    const checkExistingDuplicates = (productName) => {
      return products.some(product => 
        product.name.trim().toLowerCase() === productName.trim().toLowerCase()
      );
    };

    const handleAddToBatch = (e) => {
      e.preventDefault();
      if (!validateForm()) return;

      const productName = formData.name.trim();
      
      // Check for duplicates in batch
      if (checkBatchDuplicates(productName)) {
        setSubmitError('This product is already in the batch');
        return;
      }

      // Check for duplicates in existing products
      if (checkExistingDuplicates(productName)) {
        setSubmitError('This product already exists in the system');
        return;
      }

      const newProduct = {
        ...formData,
        name: productName,
        calculated_base_units: calculatedBaseUnits,
        branch_id: branchId
      };

      setBatchProducts(prev => [...prev, newProduct]);
      setFormData({
        ...initialFormData,
        category: formData.category,
        base_unit: formData.base_unit,
        input_unit: formData.input_unit,
        conversion_amount: formData.conversion_amount,
        minimum_threshold_base_units: formData.minimum_threshold_base_units,
      });
      setCalculatedBaseUnits('');
      setSubmitMessage('Product added to batch');
      setSubmitError('');
    };

    const handleRemoveFromBatch = (idx) => {
      setBatchProducts(prev => prev.filter((_, i) => i !== idx));
    };

    const handleClearBatch = () => {
      setBatchProducts([]);
      setSubmitMessage('Batch cleared');
    };

    const handleBatchSubmit = async () => {
      if (batchProducts.length === 0) {
        setSubmitError('No products in batch to submit');
        return;
      }

      setIsSubmitting(true);
      setSubmitMessage('');
      setSubmitError('');

      try {
        const promises = batchProducts.map(product => 
          axiosInstance.post('inventory/products/', {
            name: product.name,
            category: product.category,
            base_unit_price: parseFloat(product.base_unit_price),
            base_unit: product.base_unit,
            input_unit: product.input_unit,
            input_quantity: parseFloat(product.input_quantity),
            conversion_amount: parseFloat(product.conversion_amount),
            minimum_threshold_base_units: parseFloat(product.minimum_threshold_base_units),
            description: product.description,
            branch_id: branchId,
            calculated_base_units: product.calculated_base_units
          })
        );

        await Promise.all(promises);
        
        setSubmitMessage(`Successfully created ${batchProducts.length} products`);
        setBatchProducts([]);
        await reloadProducts();
        
        // Reset form
        setFormData(initialFormData);
        setCalculatedBaseUnits('');
        
      } catch (error) {
        console.error('Error creating products:', error);
        setSubmitError(error.response?.data?.message || 'Failed to create products');
      } finally {
        setIsSubmitting(false);
      }
    };

    const handleInputChange = (e) => {
      const { name, value, type, files } = e.target;
      
      if (type === 'file') {
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }));
      }

      // Clear error for this field
      if (errors[name]) {
        setErrors(prev => ({
          ...prev,
          [name]: ''
        }));
      }
    };

    const handleConfirmedSubmit = async () => {
      setIsSubmitting(true);
      setSubmitMessage('');
      setSubmitError('');

      try {
        const response = await axiosInstance.post(
          'inventory/products/',
          {
            name: formData.name.trim(),
            category: formData.category,
            base_unit_price: parseFloat(formData.base_unit_price),
            base_unit: formData.base_unit,
            input_unit: formData.input_unit,
            input_quantity: parseFloat(formData.input_quantity),
            conversion_amount: parseFloat(formData.conversion_amount),
            minimum_threshold_base_units: parseFloat(formData.minimum_threshold_base_units),
            description: formData.description,
            branch_id: branchId,
            calculated_base_units: calculatedBaseUnits
          }
        );

        setSubmitMessage('Product created successfully!');
        setFormData(initialFormData);
        setCalculatedBaseUnits('');
        await reloadProducts();
        
        // Navigate to product list after successful creation
        setTimeout(() => {
          navigate('/inventory');
        }, 2000);
        
      } catch (error) {
        console.error('Error creating product:', error);
        setSubmitError(error.response?.data?.message || 'Failed to create product');
      } finally {
        setIsSubmitting(false);
        setShowConfirmModal(false);
      }
    };

  // After loading categories, itemTypes, and units, add debug logs
  useEffect(() => {
    console.log('Loaded itemTypes:', itemTypes);
    console.log('Loaded categories:', categories);
    console.log('Loaded units:', units);
  }, [itemTypes, categories, units]);

  // Add debug logging for form data changes
  useEffect(() => {
    console.log('Form data changed:', formData);
  }, [formData]);

  return (
    <div className="p-4 max-w-3xl mx-auto h-[90vh] overflow-y-auto">
      {console.log('Rendering modal?', showConfirmModal)}
      <h1 className="text-2xl font-bold mb-4">{t('add_new_product')}</h1>
      <p className="mb-2 text-gray-600">{t('add_multiple_products_instruction') || 'Add multiple products to the list below, then submit all at once.'}</p>
      
      {/* Debug Section - Remove in production */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info (Remove in production)</h3>
        <div className="text-sm text-yellow-700 space-y-1">
          <div><strong>Categories loaded:</strong> {categories.length}</div>
          <div><strong>Item Types loaded:</strong> {itemTypes.length}</div>
          <div><strong>Selected Item Type:</strong> {formData.item_type || 'None'}</div>
          <div><strong>Selected Category:</strong> {formData.category || 'None'}</div>
          <div><strong>Available Categories for Item Type:</strong> {
            formData.item_type 
              ? categories.filter((cat) => {
                  const catItemTypeId = cat.item_type?.id || cat.item_type;
                  return String(catItemTypeId) === String(formData.item_type);
                }).length
              : 'N/A'
          }</div>
          <div><strong>Form Data:</strong> {JSON.stringify(formData, null, 2)}</div>
        </div>
      </div>
      
      <form onSubmit={handleAddToBatch} className="space-y-4">
        {submitMessage && (
          <div className="bg-green-100 text-green-800 p-2 rounded text-center font-semibold">{submitMessage}</div>
        )}
        {submitError && (
          <div className="bg-red-100 text-red-800 p-2 rounded text-center font-semibold">{submitError}</div>
        )}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-200 text-red-800 p-2 rounded text-center font-semibold mb-2">
            {t('please_fix_errors')}
            <ul className="text-left mt-1">
              {Object.entries(errors).map(([key, val]) => (
                <li key={key}>{val}</li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <label className="block font-semibold mb-1">{t('item_type')}</label>
          <select
            name="item_type"
            value={formData.item_type}
            onChange={e => {
              setSelectedItemType(e.target.value);
              setFormData(prev => ({ ...prev, item_type: e.target.value, category: '' })); // Only reset category
            }}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
          >
            <option value="">{t('select_item_type')}</option>
            {itemTypes.length > 0 ? (
              itemTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.type_name}
                </option>
              ))
            ) : (
              <option value="" disabled>{t('no_item_types_available') || 'No item types available'}</option>
            )}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('product_name')}</label>
          <select
            value={isNewProduct ? '__new' : formData.name}
            onChange={(e) => {
              if (e.target.value === '__new') {
                setIsNewProduct(true);
                setFormData((prev) => ({ ...prev, name: '' }));
              } else {
                setIsNewProduct(false);
                setFormData((prev) => ({ ...prev, name: e.target.value }));
              }
            }}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
          >
            <option value="__new">+ {t('add_new_product')}</option>
            {products.length > 0 ? (
              products.map((p) => (
                <option key={p.id} value={p.name}>{p.name}</option>
              ))
            ) : (
              <option value="" disabled>{t('no_products_available') || 'No products available'}</option>
            )}
          </select>
          {isNewProduct && (
        <input
          type="text"
          name="name"
              placeholder={t('enter_new_product_name')}
          value={formData.name}
              onChange={handleInputChange}
              className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm mt-2 ${errors?.name ? 'border-red-500' : ''}`}
              autoFocus
              disabled={false}
            />
          )}
          {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('category')}</label>
        <select
          name="category"
          value={formData.category}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.category ? 'border-red-500' : ''}`}
            disabled={!formData.item_type || categories.length === 0}
          >
            <option value="">
              {!formData.item_type 
                ? t('select_item_type_first') || 'Select item type first'
                : categories.filter((cat) => {
                    // Handle both nested object and direct ID formats
                    const catItemTypeId = cat.item_type?.id || cat.item_type;
                    return String(catItemTypeId) === String(formData.item_type);
                  }).length === 0
                ? t('no_categories_for_type') || 'No categories for this item type'
                : t('select_category') || 'Select category'
              }
            </option>
            {formData.item_type && categories.length > 0 && 
              categories
                .filter((cat) => {
                  // Handle both nested object and direct ID formats
                  const catItemTypeId = cat.item_type?.id || cat.item_type;
                  return String(catItemTypeId) === String(formData.item_type);
                })
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
            </option>
                ))
            }
        </select>
          {formData.item_type && categories.filter((cat) => {
            const catItemTypeId = cat.item_type?.id || cat.item_type;
            return String(catItemTypeId) === String(formData.item_type);
          }).length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              {t('no_categories_for_item_type') || 'No categories available for this item type. Please add categories in the admin panel.'}
            </p>
          )}
          {categories.length === 0 && (
            <p className="text-red-500 text-sm mt-1">
              {t('no_categories_available') || 'No categories available. Please add categories in the admin panel.'}
            </p>
          )}
          {errors?.category && <p className="text-red-500 text-sm">{errors.category}</p>}
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('base_unit')}</label>
        <select
            name="base_unit"
            value={formData.base_unit}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.base_unit ? 'border-red-500' : ''}`}
            disabled={units.length === 0}
          >
            <option value="">{units.length === 0 ? t('loading_units') : t('select_unit')}</option>
            {units.length > 0 && units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.unit_name}</option>
          ))}
        </select>
          {errors?.base_unit && <p className="text-red-500 text-sm">{errors.base_unit}</p>}
        </div>
        {/* Add Price per unit input here */}
        <div>
          <label className="block font-semibold mb-1">{t('base_unit_price') || 'Price per unit'}</label>
          <input
            type="number"
            name="base_unit_price"
            value={formData.base_unit_price}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.base_unit_price ? 'border-red-500' : ''}`}
            min="0"
            step="0.01"
            placeholder={t('enter_price_per_unit') || 'Enter price per unit'}
          />
          {errors?.base_unit_price && <p className="text-red-500 text-sm">{errors.base_unit_price}</p>}
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('input_unit')}</label>
        <select
            name="input_unit"
            value={formData.input_unit}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.input_unit ? 'border-red-500' : ''}`}
            disabled={units.length === 0}
          >
            <option value="">{units.length === 0 ? t('loading_units') : t('select_unit')}</option>
            {units.length > 0 && units.map((unit) => (
              <option key={unit.id} value={unit.id}>{unit.unit_name}</option>
            ))}
        </select>
          {errors?.input_unit && <p className="text-red-500 text-sm">{errors.input_unit}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('input_quantity')}</label>
          <input
            type="number"
            name="input_quantity"
            value={formData.input_quantity}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.input_quantity ? 'border-red-500' : ''}`}
          />
          {errors?.input_quantity && <p className="text-red-500 text-sm">{errors.input_quantity}</p>}
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('conversion_amount')}</label>
          <input
            type="number"
            name="conversion_amount"
            value={formData.conversion_amount}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.conversion_amount ? 'border-red-500' : ''}`}
          />
          {errors?.conversion_amount && <p className="text-red-500 text-sm">{errors.conversion_amount}</p>}
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('calculated_base_units')}</label>
        <input
          type="number"
            value={calculatedBaseUnits}
            readOnly
            className="border p-2 w-full bg-gray-100 rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
        />
      </div>
      <div>
          <label className="block font-semibold mb-1">{t('minimum_threshold_base_units')}</label>
        <input
          type="number"
            name="minimum_threshold_base_units"
            value={formData.minimum_threshold_base_units}
            onChange={handleInputChange}
            className={`border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm ${errors?.minimum_threshold_base_units ? 'border-red-500' : ''}`}
          />
          {errors?.minimum_threshold_base_units && <p className="text-red-500 text-sm">{errors.minimum_threshold_base_units}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('description')}</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('receipt_image')}</label>
          <input
            type="file"
            name="receipt_image"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, receipt_image: e.target.files[0] })}
            className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-200 text-base sm:text-sm"
        />
      </div>
      <button
        type="submit"
          className={`bg-blue-600 text-white px-4 py-2 rounded mt-4 w-full rounded-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        disabled={isSubmitting}
      >
          {t('add_product_to_list')}
      </button>
    </form>
      {/* Batch list display */}
      <section id="batch-list-section" className="mt-6">
        {batchProducts.length > 0 && (
          <div>
            <h2 className="text-lg font-bold mb-2">{t('products_in_queue')}</h2>
            <table className="min-w-full border mb-2">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-1">{t('product_name')}</th>
                  <th className="border px-2 py-1">{t('description')}</th>
                  <th className="border px-2 py-1">{t('category')}</th>
                  <th className="border px-2 py-1">{t('base_unit_price')}</th>
                  <th className="border px-2 py-1">{t('base_unit')}</th>
                  <th className="border px-2 py-1">{t('input_unit')}</th>
                  <th className="border px-2 py-1">{t('input_quantity')}</th>
                  <th className="border px-2 py-1">{t('conversion_amount')}</th>
                  <th className="border px-2 py-1">{t('minimum_threshold_base_units')}</th>
                  <th className="border px-2 py-1">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {batchProducts.map((p, idx) => (
                  <tr key={idx} className="text-center">
                    <td className="border px-2 py-1">{p.name || 'N/A'}</td>
                    <td className="border px-2 py-1">{p.description || 'N/A'}</td>
                    <td className="border px-2 py-1">{categories.find(c => String(c.id) === String(p.category || p.category_id))?.category_name || 'N/A'}</td>
                    <td className="border px-2 py-1">{p.base_unit_price || 'N/A'}</td>
                    <td className="border px-2 py-1">{units.find(u => String(u.id) === String(p.base_unit || p.base_unit_id))?.unit_name || 'N/A'}</td>
                    <td className="border px-2 py-1">{units.find(u => String(u.id) === String(p.input_unit))?.unit_name || 'N/A'}</td>
                    <td className="border px-2 py-1">{p.input_quantity || 'N/A'}</td>
                    <td className="border px-2 py-1">{p.conversion_amount || 'N/A'}</td>
                    <td className="border px-2 py-1">{p.minimum_threshold_base_units || 'N/A'}</td>
                    <td className="border px-2 py-1">
                      <button onClick={() => handleRemoveFromBatch(idx)} className="text-red-500 hover:underline ml-2">{t('remove')}</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex gap-2 mb-2">
              <button onClick={handleClearBatch} className="bg-gray-300 text-gray-800 px-3 py-1 rounded hover:bg-gray-400">{t('clear_all')}</button>
              <button
                onClick={() => setShowBatchConfirm(true)}
                className={`bg-green-600 text-white px-4 py-2 rounded w-full ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isSubmitting || batchProducts.length === 0}
              >
                {isSubmitting ? t('submitting') : t('submit_all')}
              </button>
            </div>
          </div>
        )}
      </section>
      {/* Confirmation dialog for batch submit */}
      {showBatchConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close modal"
              onClick={() => setShowBatchConfirm(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">{t('confirm_product_details')}</h2>
            <p className="mb-2">{t('confirm_batch_submit_instruction') || 'Are you sure you want to submit all products in the list?'}</p>
            <ul className="mb-4">
              {batchProducts.map((p, idx) => (
                <li key={idx} className="mb-2 border-b pb-2">
                  <div><strong>{t('product_name')}:</strong> {p.name || 'N/A'}</div>
                  <div><strong>{t('description')}:</strong> {p.description || 'N/A'}</div>
                  <div><strong>{t('category')}:</strong> {categories.find(c => String(c.id) === String(p.category || p.category_id))?.category_name || 'N/A'}</div>
                  <div><strong>{t('base_unit_price')}:</strong> {p.base_unit_price || 'N/A'}</div>
                  <div><strong>{t('base_unit')}:</strong> {units.find(u => String(u.id) === String(p.base_unit || p.base_unit_id))?.unit_name || 'N/A'}</div>
                  <div><strong>{t('input_unit')}:</strong> {units.find(u => String(u.id) === String(p.input_unit))?.unit_name || 'N/A'}</div>
                  <div><strong>{t('input_quantity')}:</strong> {p.input_quantity || 'N/A'}</div>
                  <div><strong>{t('conversion_amount')}:</strong> {p.conversion_amount || 'N/A'}</div>
                  <div><strong>{t('minimum_threshold_base_units')}:</strong> {p.minimum_threshold_base_units || 'N/A'}</div>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={handleBatchSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('submitting') : t('confirm')}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={() => setShowBatchConfirm(false)}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative">
            <button
              className="absolute top-2 right-2 text-2xl text-gray-500 hover:text-gray-700 focus:outline-none"
              aria-label="Close modal"
              onClick={() => setShowConfirmModal(false)}
            >
              &times;
            </button>
            <h2 className="text-xl font-bold mb-4">{t('confirm_product_details')}</h2>
            <div className="mb-4 space-y-2 text-sm">
              <div><strong>{t('product_name')}:</strong> {formData.name}</div>
              <div><strong>{t('item_type')}:</strong> {itemTypes.find(i => String(i.id) === String(formData.item_type))?.type_name || ''}</div>
              <div><strong>{t('category')}:</strong> {categories.find(c => String(c.id) === String(formData.category))?.category_name || ''}</div>
              <div><strong>{t('base_unit')}:</strong> {units.find(u => String(u.id) === String(formData.base_unit))?.unit_name || ''}</div>
              <div><strong>{t('input_unit')}:</strong> {units.find(u => String(u.id) === String(formData.input_unit))?.unit_name || ''}</div>
              <div><strong>{t('input_quantity')}:</strong> {formData.input_quantity}</div>
              <div><strong>{t('conversion_amount')}:</strong> {formData.conversion_amount}</div>
              <div><strong>{t('calculated_base_units')}:</strong> {calculatedBaseUnits}</div>
              <div><strong>{t('minimum_threshold_base_units')}:</strong> {formData.minimum_threshold_base_units}</div>
              <div><strong>{t('price')}:</strong> {formData.base_unit_price}</div>
              <div><strong>{t('description')}:</strong> {formData.description}</div>
              {formData.receipt_image && <div><strong>{t('receipt_image')}:</strong> {formData.receipt_image.name}</div>}
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? t('submitting') : t('confirm')}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded w-full sm:w-auto"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
