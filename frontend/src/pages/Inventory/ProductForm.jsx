import React, { useState, useEffect } from 'react';
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

  const [formData, setFormData] = useState(initialFormData);
  const [calculatedBaseUnits, setCalculatedBaseUnits] = useState('');

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

  // Prefill fields when an existing product is selected
  useEffect(() => {
    if (!isNewProduct && formData.name) {
      const selectedProduct = products.find((p) => p.name === formData.name);
      if (selectedProduct) {
        setFormData((prev) => ({
          ...prev,
          // Pre-fill fields from the selected product
          category: selectedProduct.category?.id || '',
          base_unit_price: selectedProduct.base_unit_price || '',
          base_unit: selectedProduct.base_unit || '',
          description: selectedProduct.description || '',
          // Do not pre-fill stock fields (input_unit, input_quantity, conversion_amount, minimum_threshold_base_units)
        }));
        // Optionally, set selectedItemType to match the product's category's item_type
        if (selectedProduct.category?.item_type?.id) {
          setSelectedItemType(String(selectedProduct.category.item_type.id));
        }
      }
    } else if (isNewProduct) {
      setFormData((prev) => ({
        ...initialFormData,
        name: '',
      }));
    }
    // eslint-disable-next-line
  }, [isNewProduct, formData.name]);

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

  // Actual API submission logic, extracted from handleSubmit
  const handleConfirmedSubmit = async () => {
    setIsSubmitting(true);
    const csrfToken = getCookie('csrftoken');
    try {
      // Create Product
      const productFormData = new FormData();
      productFormData.append('name', formData.name);
      productFormData.append('category_id', formData.category);
      productFormData.append('base_unit_price', formData.base_unit_price);
      productFormData.append('base_unit', formData.base_unit);
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
      // Create ProductMeasurement (conversion)
      await axios.post(
        'http://localhost:8000/api/inventory/productmeasurements/',
        {
          product_id: createdProduct.id,
          from_unit_id: formData.input_unit,
          to_unit_id: formData.base_unit,
          amount_per: formData.conversion_amount,
          is_default_sales_unit: true,
        },
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
            value={selectedItemType}
            onChange={(e) => {
              setSelectedItemType(e.target.value);
              setFormData({ ...formData, category: '' });
            }}
            className="border p-2 w-full"
          >
            <option value="">{t('select_item_type')}</option>
            {itemTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.type_name}
              </option>
            ))}
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
            className="border p-2 w-full"
          >
            <option value="__new">+ {t('add_new_product')}</option>
            {products.map((p) => (
              <option key={p.id} value={p.name}>{p.name}</option>
            ))}
          </select>
          {/* Show the input always when adding new, and make sure it's enabled */}
          {isNewProduct && (
            <input
              type="text"
              placeholder={t('enter_new_product_name')}
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              className={`border p-2 w-full mt-2 ${errors?.name ? 'border-red-500' : ''}`}
              autoFocus
              disabled={false}
            />
          )}
          {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('category')}</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`border p-2 w-full ${errors?.category ? 'border-red-500' : ''}`}
          >
            <option value="">{t('select_category')}</option>
            {categories && categories.length > 0 ? (
              categories
                .filter((cat) => cat.item_type && String(cat.item_type.id) === String(selectedItemType))
                .map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))
            ) : (
              <option value="" disabled>{t('no_categories_available')}</option>
            )}
          </select>
          {categories.filter((cat) => cat.item_type && String(cat.item_type.id) === String(selectedItemType)).length === 0 && (
            <p className="text-gray-500 text-sm mt-1">{t('no_categories_for_item_type')}</p>
          )}
          {errors?.category && <p className="text-red-500 text-sm">{errors.category}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('base_unit')}</label>
          <select
            value={formData.base_unit}
            onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
            className={`border p-2 w-full ${errors?.base_unit ? 'border-red-500' : ''}`}
          >
            <option value="">{t('select_unit')}</option>
            {units && units.length > 0 ? (
              units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_name}
                </option>
              ))
            ) : (
              <option value="" disabled>{t('no_units_available')}</option>
            )}
          </select>
          {errors?.base_unit && <p className="text-red-500 text-sm">{errors.base_unit}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('input_unit')}</label>
          <select
            value={formData.input_unit}
            onChange={(e) => setFormData({ ...formData, input_unit: e.target.value })}
            className={`border p-2 w-full ${errors?.input_unit ? 'border-red-500' : ''}`}
          >
            <option value="">{t('select_unit')}</option>
            {units && units.length > 0 ? (
              units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_name}
                </option>
              ))
            ) : (
              <option value="" disabled>{t('no_units_available')}</option>
            )}
          </select>
          {errors?.input_unit && <p className="text-red-500 text-sm">{errors.input_unit}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('input_quantity')}</label>
          <input
            type="number"
            value={formData.input_quantity}
            onChange={(e) => setFormData({ ...formData, input_quantity: e.target.value })}
            className={`border p-2 w-full ${errors?.input_quantity ? 'border-red-500' : ''}`}
          />
          {errors?.input_quantity && <p className="text-red-500 text-sm">{errors.input_quantity}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('conversion_amount')}</label>
          <input
            type="number"
            value={formData.conversion_amount}
            onChange={(e) => setFormData({ ...formData, conversion_amount: e.target.value })}
            className={`border p-2 w-full ${errors?.conversion_amount ? 'border-red-500' : ''}`}
          />
          {errors?.conversion_amount && <p className="text-red-500 text-sm">{errors.conversion_amount}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('calculated_base_units')}</label>
          <input
            type="number"
            value={calculatedBaseUnits}
            readOnly
            className="border p-2 w-full bg-gray-100"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('minimum_threshold_base_units')}</label>
          <input
            type="number"
            value={formData.minimum_threshold_base_units}
            onChange={(e) => setFormData({ ...formData, minimum_threshold_base_units: e.target.value })}
            className={`border p-2 w-full ${errors?.minimum_threshold_base_units ? 'border-red-500' : ''}`}
          />
          {errors?.minimum_threshold_base_units && <p className="text-red-500 text-sm">{errors.minimum_threshold_base_units}</p>}
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="border p-2 w-full"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">{t('receipt_image')}</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFormData({ ...formData, receipt_image: e.target.files[0] })}
            className="border p-2 w-full"
          />
        </div>
        <button
          type="submit"
          className={`bg-green-600 text-white px-4 py-2 rounded mt-4 w-full`}
          // disabled={isSubmitting}
        >
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </form>
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-lg w-full">
            <h2 className="text-xl font-bold mb-4">{t('confirm_product_details')}</h2>
            <div className="mb-4 space-y-2">
              <div><strong>{t('product_name')}:</strong> {formData.name}</div>
              <div><strong>{t('item_type')}:</strong> {itemTypes.find(i => String(i.id) === String(selectedItemType))?.type_name || ''}</div>
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
            <div className="flex justify-end space-x-4">
              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting}
              >
                {t('confirm')}
              </button>
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
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
