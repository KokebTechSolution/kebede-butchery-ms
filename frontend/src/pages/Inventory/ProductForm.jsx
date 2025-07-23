import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

// Helper to get CSRF token from cookies
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

  const [formData, setFormData] = useState(initialFormData);
  const [calculatedBaseUnits, setCalculatedBaseUnits] = useState('');
  const prevIsNewProduct = useRef(isNewProduct);

  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, unitRes, productRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(),
          axios.get('http://localhost:8000/api/inventory/productunits/', { withCredentials: true }),
          axios.get('http://localhost:8000/api/inventory/products/', { withCredentials: true }),
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
    setCalculatedBaseUnits(qty * conv);
  }, [formData.input_quantity, formData.conversion_amount]);

  useEffect(() => {
    if (isNewProduct && !prevIsNewProduct.current) {
      setFormData({ ...initialFormData, name: '' });
    }
    prevIsNewProduct.current = isNewProduct;
  }, [isNewProduct]);

  // Prevent duplicate product names
  const isDuplicateName = (name) => {
    return products.some((p) => p.name.trim().toLowerCase() === name.trim().toLowerCase());
  };

  const validateForm = () => {
    let err = {};
    if (!formData.name.trim()) err.name = t('product_name_required');
    if (isNewProduct && isDuplicateName(formData.name)) err.name = t('duplicate_product_name');
    if (!formData.category) err.category = t('category_required');
    if (!formData.base_unit_price) err.base_unit_price = t('price_required');
    else if (isNaN(Number(formData.base_unit_price)) || Number(formData.base_unit_price) < 0)
      err.base_unit_price = t('price_must_be_positive');
    if (!formData.base_unit) err.base_unit = t('unit_required');
    if (!formData.input_unit) err.input_unit = t('input_unit_required');
    if (!formData.input_quantity) err.input_quantity = t('input_quantity_required');
    if (!formData.conversion_amount) err.conversion_amount = t('conversion_amount_required');
    if (!formData.minimum_threshold_base_units) err.minimum_threshold_base_units = t('minimum_threshold_required');
    setErrors(err);
    console.log('Validation errors:', err, 'Form data:', formData); // <-- Debug log
    return Object.keys(err).length === 0;
  };

  // Helper to reload products after adding
  const reloadProducts = async () => {
    try {
      const productRes = await axios.get('http://localhost:8000/api/inventory/products/', { withCredentials: true });
      setProducts(productRes.data);
      console.log('Products reloaded from /api/inventory/products/', productRes.data);
    } catch (error) {
      console.error('Error reloading products:', error);
    }
  };

  const handleSubmit = async (e) => {
    console.log('Submit button clicked');
    e.preventDefault();
    setErrors({});
    setSubmitMessage('');
    setSubmitError('');
    const valid = validateForm();
    console.log('Validation result:', valid, errors, formData);
    if (!valid) return;
    console.log('Validation passed, showing modal');
    setShowConfirmModal(true);
  };

  // 1. Add live validation on input change
  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    let newValue = files ? files[0] : value;
    console.log('handleInputChange:', name, newValue); // Debug log
    setFormData((prev) => ({ ...prev, [name]: newValue }));
    // Validate this field only
    let err = { ...errors };
    switch (name) {
      case 'name':
        if (!value.trim()) err.name = t('product_name_required');
        else if (isNewProduct && isDuplicateName(value)) err.name = t('duplicate_product_name');
        else delete err.name;
        break;
      case 'category':
        if (!value) err.category = t('category_required');
        else delete err.category;
        break;
      case 'base_unit_price':
        if (!value) err.base_unit_price = t('price_required');
        else if (isNaN(Number(value)) || Number(value) < 0) err.base_unit_price = t('price_must_be_positive');
        else delete err.base_unit_price;
        break;
      case 'base_unit':
        if (!value) err.base_unit = t('unit_required');
        else delete err.base_unit;
        break;
      case 'input_unit':
        if (!value) err.input_unit = t('input_unit_required');
        else delete err.input_unit;
        break;
      case 'input_quantity':
        if (!value) err.input_quantity = t('input_quantity_required');
        else delete err.input_quantity;
        break;
      case 'conversion_amount':
        if (!value) err.conversion_amount = t('conversion_amount_required');
        else delete err.conversion_amount;
        break;
      case 'minimum_threshold_base_units':
        if (!value) err.minimum_threshold_base_units = t('minimum_threshold_required');
        else delete err.minimum_threshold_base_units;
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
      // Create Product
      const productFormData = new FormData();
      productFormData.append('name', formData.name);
      productFormData.append('category_id', parseInt(formData.category)); // use 'category_id' and ensure integer
      productFormData.append('base_unit_id', parseInt(formData.base_unit)); // use 'base_unit_id' and ensure integer
      productFormData.append('base_unit_price', formData.base_unit_price);
      productFormData.append('description', formData.description);
      if (formData.receipt_image) {
        productFormData.append('receipt_image', formData.receipt_image);
      }
      const productResponse = await axios.post(
        'http://localhost:8000/api/inventory/products/',
        productFormData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'multipart/form-data',
            'X-CSRFToken': csrfToken,
          },
        }
      );
      const createdProduct = productResponse.data;
      console.log('Created product:', createdProduct);
      if (!createdProduct.id) {
        setSubmitError('Product creation failed: No product ID returned.');
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }
      // Defensive check for required measurement fields
      const measurementPayload = {
        product_id: createdProduct.id,
        from_unit_id: formData.input_unit,
        to_unit_id: formData.base_unit,
        amount_per: formData.conversion_amount,
        is_default_sales_unit: true,
      };
      console.log('Created product:', createdProduct);
      console.log('About to create ProductMeasurement with:', measurementPayload);
      if (!measurementPayload.product_id || isNaN(Number(measurementPayload.product_id)) || Number(measurementPayload.product_id) <= 0) {
        setSubmitError('Invalid or missing product_id for product measurement.');
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }
      if (!measurementPayload.from_unit_id || !measurementPayload.to_unit_id || !measurementPayload.amount_per) {
        setSubmitError('Missing required fields for product measurement (check product_id, from_unit_id, to_unit_id, amount_per).');
        setIsSubmitting(false);
        setShowConfirmModal(false);
        return;
      }
      // Create ProductMeasurement (conversion)
      await axios.post(
        'http://localhost:8000/api/inventory/productmeasurements/',
        measurementPayload,
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrfToken,
          },
        }
      );
      // Create Stock
      await axios.post(
        'http://localhost:8000/api/inventory/stocks/',
        {
          product_id: createdProduct.id,
          branch_id: branchId,
          quantity_in_base_units: calculatedBaseUnits,
          minimum_threshold_base_units: formData.minimum_threshold_base_units,
        },
        {
          withCredentials: true,
          headers: {
            'X-CSRFToken': csrfToken,
          },
        }
      );
      alert(t('submit_success'));
      setSubmitMessage(t('submit_success'));
      setFormData(initialFormData);
      setCalculatedBaseUnits('');
      setIsNewProduct(true);
      await reloadProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => {
        setSubmitMessage('');
        navigate('/branch-manager/inventory');
      }, 2000);
    } catch (err) {
      console.error('Submit error', err.response?.data || err.message);
      setSubmitError(t('submit_error') + ': ' + JSON.stringify(err.response?.data || err.message));
      window.scrollTo({ top: 0, behavior: 'smooth' });
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

  return (
    <div className="p-4 max-w-3xl mx-auto h-[90vh] overflow-y-auto">
      {console.log('Rendering modal?', showConfirmModal)}
      <h1 className="text-2xl font-bold mb-4">{t('add_new_product')}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
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
            disabled={!formData.item_type}
          >
            <option value="">{formData.item_type ? t('select_category') : t('select_item_type_first')}</option>
            {formData.item_type && categories.length > 0 ? (
              categories
                .filter((cat) => {
                  if (cat.item_type && typeof cat.item_type === 'object') {
                    return String(cat.item_type.id) === String(formData.item_type);
                  }
                  return String(cat.item_type) === String(formData.item_type);
                })
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))
            ) : null}
          </select>
          {formData.item_type && categories.filter((cat) => {
            if (cat.item_type && typeof cat.item_type === 'object') {
              return String(cat.item_type.id) === String(formData.item_type);
            }
            return String(cat.item_type) === String(formData.item_type);
          }).length === 0 && (
            <p className="text-gray-500 text-sm mt-1">{t('no_categories_for_item_type')}</p>
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
          className={`bg-green-600 text-white px-4 py-2 rounded mt-4 w-full rounded-md ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>
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
