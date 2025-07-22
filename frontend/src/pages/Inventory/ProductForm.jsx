import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useRef } from 'react';

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
  const [existingProducts, setExistingProducts] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState('');
  const [allowedToAdd, setAllowedToAdd] = useState(false);
  const [products, setProducts] = useState([]);
  const [isNewName, setIsNewName] = useState(true);
  const [errors, setErrors] = useState(null);
  const [measurements, setMeasurements] = useState([
    { from_unit: '', to_unit: '', amount_per: '', is_default_sales_unit: false }
  ]);
  const [productUnits, setProductUnits] = useState([]); // Added for base unit selection
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  const initialFormData = {
    name: '',
    category: '',
    base_unit_id: '',
    base_unit_price: '',
    description: '',
    volume_per_base_unit_ml: '',
    minimum_threshold: '',
    running_out: false,
    receipt_image: null,
    initial_quantity: '', // NEW: for stock creation
  };

  const [formData, setFormData] = useState(initialFormData);

  const [totalShotsPerBottle, setTotalShotsPerBottle] = useState('');
  const [totalShotsPerLiter, setTotalShotsPerLiter] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, productRes, unitRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(),
          axios.get('http://localhost:8000/api/inventory/inventory/', { withCredentials: true }),
          axios.get('http://localhost:8000/api/inventory/productunits/', { withCredentials: true }),
        ]);
        setItemTypes(itemTypeData);
        setCategories(categoryData);
        setExistingProducts(productRes.data);
        setProductUnits(unitRes.data); // <-- This must be set!
      } catch (error) {
        console.error('Error loading data:', error);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    const selectedItem = itemTypes.find((i) => i.id.toString() === selectedItemType);
    setAllowedToAdd(
      selectedItem && ['beverage', 'beverages'].includes(selectedItem.type_name.toLowerCase())
    );
    setFormData((prev) => ({ ...prev, category: '' }));
  }, [selectedItemType, itemTypes]);

  useEffect(() => {
    if (formData.quantityType === 'carton') {
      const bottles =
        (Number(formData.bottles_per_carton) || 0) * (Number(formData.carton_quantity) || 0);
      setFormData((prev) => ({ ...prev, bottle_quantity: bottles.toString() }));
    }
  }, [formData.bottles_per_carton, formData.carton_quantity, formData.quantityType]);

  useEffect(() => {
    if (formData.quantityType === 'bottle') {
      const totalShots =
        (Number(formData.bottle_quantity) || 0) * (Number(formData.shot_per_bottle) || 0);
      setTotalShotsPerBottle(totalShots ? totalShots.toString() : '');
    } else {
      setTotalShotsPerBottle('');
    }
    if (formData.quantityType === 'unit') {
      const totalShots =
        (Number(formData.unit_quantity) || 0) * (Number(formData.shot_per_liter) || 0);
      setTotalShotsPerLiter(totalShots ? totalShots.toString() : '');
    } else {
      setTotalShotsPerLiter('');
    }
  }, [formData.quantityType, formData.bottle_quantity, formData.shot_per_bottle, formData.unit_quantity, formData.shot_per_liter]);

  // Measurement handlers
  const handleMeasurementChange = (idx, field, value) => {
    setMeasurements(measurements =>
      measurements.map((m, i) =>
        i === idx ? { ...m, [field]: value } : m
      )
    );
  };

  const addMeasurementRow = () => {
    setMeasurements([...measurements, { from_unit: '', to_unit: '', amount_per: '', is_default_sales_unit: false }]);
  };

  const removeMeasurementRow = (idx) => {
    setMeasurements(measurements.filter((_, i) => i !== idx));
  };

  const validateForm = () => {
    let err = {};

    if (!formData.name.trim()) err.name = t('product_name_required');
    if (!formData.category) err.category = t('category_required');
    if (!formData.base_unit_id) err.base_unit_id = t('base_unit_required');
    if (!formData.base_unit_price) err.base_unit_price = t('base_unit_price_required');
    else if (isNaN(Number(formData.base_unit_price)) || Number(formData.base_unit_price) < 0)
      err.base_unit_price = t('base_unit_price_must_be_positive');
    if (formData.minimum_threshold === '' || Number(formData.minimum_threshold) < 0)
      err.minimum_threshold = t('minimum_threshold_non_negative');
    if (!formData.initial_quantity || isNaN(Number(formData.initial_quantity)) || Number(formData.initial_quantity) < 0)
      err.initial_quantity = t('initial_quantity_required');

    // Validate measurements
    if (
      measurements.length === 0 ||
      measurements.some(m => !m.from_unit || !m.to_unit || m.amount_per === '')
    ) {
      err.measurements = 'Please add at least one valid measurement type, amount, and quantity.';
    }
    const types = measurements.map(m => m.from_unit);
    if (new Set(types).size !== types.length) {
      err.measurements = 'Duplicate measurement types are not allowed.';
    }

    if (
      formData.category && // only if category is selected
      categories.find(cat => cat.id === parseInt(formData.category))?.item_type?.type_name?.toLowerCase() === 'beverage' &&
      !formData.base_unit_id
    ) {
      err.base_unit_id = 'Base unit is required for beverages.';
    }

    setErrors(err);

    return Object.keys(err).length === 0;
  };

  const handleAddToList = () => {
    setErrors(null);
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    if (!branchId) {
      alert(t('branch_info_missing'));
      return;
    }

    const trimmedName = formData.name.trim();
    const isDuplicate = products.some(
      (p) => p.name.toLowerCase() === trimmedName.toLowerCase()
    );

    if (isDuplicate) {
      alert(t('duplicate_product_name'));
      return;
    }

    const newProduct = {
      id: Date.now(),
      name: trimmedName,
      category_id: Number(formData.category),
      base_unit_id: formData.base_unit_id ? Number(formData.base_unit_id) : null,
      base_unit_price: formData.base_unit_price ? parseFloat(formData.base_unit_price) : null,
      description: formData.description || '',
      volume_per_base_unit_ml: formData.volume_per_base_unit_ml || null,
      receipt_image: formData.receipt_image,
      measurements: measurements.map(m => ({
        from_unit: parseInt(m.from_unit),
        to_unit: parseInt(m.to_unit),
        amount_per: m.amount_per,
        is_default_sales_unit: m.is_default_sales_unit || false
      })),
      minimum_threshold: parseFloat(formData.minimum_threshold) || 0,
      running_out: Boolean(formData.running_out),
      branch_id: branchId,
      initial_quantity: formData.initial_quantity,
    };

    setProducts((prev) => [...prev, newProduct]);
    setFormData(initialFormData);
    setIsNewName(true);
    setMeasurements([{ from_unit: '', to_unit: '', amount_per: '', is_default_sales_unit: false }]);
  };

  const handleSubmitAll = async () => {
    setSuccessMessage('');
    setErrors(null);
    if (products.length === 0) {
      setErrors({ submit: t('add_at_least_one_product') });
      return;
    }
    setShowConfirm(false);
    setLoading(true);

    const csrfToken = getCookie('csrftoken');

    try {
      for (const product of products) {
        const productFormData = new FormData();
        productFormData.append('name', product.name);
        productFormData.append('category_id', product.category_id);
        productFormData.append('base_unit_id', product.base_unit_id || '');
        productFormData.append('base_unit_price', product.base_unit_price || '');
        productFormData.append('description', product.description || '');
        productFormData.append('volume_per_base_unit_ml', product.volume_per_base_unit_ml || '');
        productFormData.append('minimum_threshold', product.minimum_threshold);
        productFormData.append('running_out', product.running_out ? 'true' : 'false');
        if (product.receipt_image) {
          productFormData.append('receipt_image', product.receipt_image);
        }
        productFormData.append('measurements', JSON.stringify(product.measurements));

        const productResponse = await axios.post(
          'http://localhost:8000/api/inventory/inventory/',
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

        await axios.post(
          'http://localhost:8000/api/inventory/stocks/',
          {
            product_id: createdProduct.id,
            branch_id: product.branch_id,
            quantity: Number(product.initial_quantity),
            minimum_threshold_base_units: Number(product.minimum_threshold) || 0,
            running_out: product.running_out,
          },
          {
            withCredentials: true,
            headers: {
              'X-CSRFToken': csrfToken,
            },
          }
        );
      }

      setSuccessMessage(t('submit_success'));
      setProducts([]);
      setSelectedItemType('');
      setAllowedToAdd(false);
      setFormData(initialFormData);
      setMeasurements([{ from_unit: '', to_unit: '', amount_per: '', is_default_sales_unit: false }]);
      setTimeout(() => setSuccessMessage(''), 4000);
      navigate('/branch-manager/inventory');
    } catch (err) {
      const backendErrors = err.response?.data;
      setErrors(backendErrors || { submit: err.message });
    } finally {
      setLoading(false);
    }
  };

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
    <div className="p-4 max-w-3xl mx-auto h-[90vh] overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">{t('add_new_products')}</h1>
      {successMessage && <div className="bg-green-100 text-green-800 p-2 rounded mb-2">{successMessage}</div>}
      {errors?.submit && <div className="bg-red-100 text-red-800 p-2 rounded mb-2">{errors.submit}</div>}
      <div className="mb-4">
        <label className="block font-semibold mb-1">{t('branch_id')}</label>
        <input
          type="text"
          value={branchId || ''}
          readOnly
          className="border p-2 w-full bg-gray-100"
        />
      </div>
      <div className="mb-4">
        <label className="block font-semibold">{t('receipt_image')}</label>
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
          <label className="block font-semibold">{t('product_name')}</label>
          <select
            value={isNewName ? '__new' : formData.name}
            onChange={handleNameSelect}
            className="border p-2 w-full"
          >
            <option value="__new">+ {t('add_new_product_name')}</option>
            {existingProducts.map((p) => (
              <option key={p.id} value={p.name}>
                {p.name}
              </option>
            ))}
          </select>
          {isNewName && (
            <input
              type="text"
              placeholder={t('enter_new_product_name')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`border p-2 w-full ${errors?.name ? 'border-red-500' : ''}`}
            />
          )}
          {errors?.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className={`border p-2 w-full ${errors?.category ? 'border-red-500' : ''}`}
          >
            <option value="">{t('select_category')}</option>
            {categories
              .filter((cat) => cat.item_type.id === parseInt(selectedItemType))
              .map((category) => (
                <option key={category.id} value={category.id}>
                  {category.category_name}
                </option>
              ))}
          </select>
          {errors?.category && <p className="text-red-500 text-sm">{errors.category}</p>}
          {/* Base Unit */}
          <label className="block font-semibold">{t('base_unit')}</label>
          <select
            value={formData.base_unit_id || ''}
            onChange={e => setFormData({ ...formData, base_unit_id: e.target.value })}
            className={`border p-2 w-full ${errors?.base_unit_id ? 'border-red-500' : ''}`}
          >
            <option value="">No Base Unit</option>
            {productUnits.map(unit => (
              <option key={unit.id} value={unit.id}>
                {unit.unit_name}
              </option>
            ))}
          </select>
          {errors?.base_unit_id && <p className="text-red-500 text-sm">{errors.base_unit_id}</p>}
          {/* Base Unit Price */}
          <input
            type="number"
            step="0.01"
            placeholder={t('base_unit_price')}
            value={formData.base_unit_price}
            onChange={e => setFormData({ ...formData, base_unit_price: e.target.value })}
            className={`border p-2 w-full ${errors?.base_unit_price ? 'border-red-500' : ''}`}
          />
          {errors?.base_unit_price && <p className="text-red-500 text-sm">{errors.base_unit_price}</p>}
          {/* Volume per Base Unit (for liquids) */}
          {(() => {
            const selectedBaseUnit = productUnits.find(u => u.id === Number(formData.base_unit_id));
            if (selectedBaseUnit && selectedBaseUnit.is_liquid_unit) {
              return (
                <input
                  type="number"
                  step="0.01"
                  placeholder={t('volume_per_base_unit_ml')}
                  value={formData.volume_per_base_unit_ml}
                  onChange={e => setFormData({ ...formData, volume_per_base_unit_ml: e.target.value })}
                  className="border p-2 w-full"
                />
              );
            }
            return null;
          })()}
          {/* Description */}
          <textarea
            placeholder={t('description')}
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            className="border p-2 w-full"
          />
          {/* Initial Quantity */}
          <input
            type="number"
            step="0.01"
            placeholder={t('initial_quantity')}
            value={formData.initial_quantity}
            onChange={e => setFormData({ ...formData, initial_quantity: e.target.value })}
            className={`border p-2 w-full ${errors?.initial_quantity ? 'border-red-500' : ''}`}
          />
          {errors?.initial_quantity && <p className="text-red-500 text-sm">{errors.initial_quantity}</p>}
          {/* Measurement section */}
          <div className="mb-4">
            <label className="block font-semibold mb-1">Measurements</label>
            {measurements.map((m, idx) => (
              <div key={idx} className="flex gap-2 mb-2">
                <select
                  value={m.from_unit}
                  onChange={e => handleMeasurementChange(idx, 'from_unit', e.target.value)}
                  className="border p-2"
                  required
                >
                  <option value="">From Unit</option>
                  {productUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </option>
                  ))}
                </select>
                <select
                  value={m.to_unit}
                  onChange={e => handleMeasurementChange(idx, 'to_unit', e.target.value)}
                  className="border p-2"
                  required
                >
                  <option value="">To Unit</option>
                  {productUnits.map(unit => (
                    <option key={unit.id} value={unit.id}>
                      {unit.unit_name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={m.amount_per}
                  onChange={e => handleMeasurementChange(idx, 'amount_per', e.target.value)}
                  placeholder="Amount per"
                  className="border p-2"
                  required
                />
                <label>
                  <input
                    type="checkbox"
                    checked={m.is_default_sales_unit || false}
                    onChange={e => handleMeasurementChange(idx, 'is_default_sales_unit', e.target.checked)}
                  />
                  Default Sales Unit
                </label>
                <button type="button" onClick={() => removeMeasurementRow(idx)}>
                  Remove
                </button>
              </div>
            ))}
            <button type="button" onClick={addMeasurementRow} className="bg-blue-500 text-white px-2 py-1 rounded">
              + Add Measurement
            </button>
            {errors?.measurements && <p className="text-red-500 text-sm">{errors.measurements}</p>}
          </div>
          <input
            type="number"
            step="0.01"
            placeholder={t('minimum_threshold')}
            value={formData.minimum_threshold}
            onChange={(e) =>
              setFormData({ ...formData, minimum_threshold: e.target.value })
            }
            className={`border p-2 w-full ${errors?.minimum_threshold ? 'border-red-500' : ''}`}
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
            <span>{t('running_out')}</span>
          </label>
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
            disabled={loading}
          >
            + {t('add_product_to_list')}
          </button>
        </div>
      ) : (
        <div className="text-red-600">{t('only_beverages_allowed')}</div>
      )}
      {showConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">{t('confirm_submission')}</h2>
            <p className="mb-4">{t('are_you_sure_submit')}</p>
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 px-4 py-2 rounded"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                {t('cancel')}
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSubmitAll}
                disabled={loading}
              >
                {loading ? t('submitting') : t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
      {products.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">{t('products_in_queue')}</h2>
          <ul className="space-y-2 border p-2 max-h-64 overflow-auto">
            {products.map((p, idx) => (
              <li key={p.id} className="bg-gray-100 rounded p-2 flex justify-between items-center">
                <span>
                  {idx + 1}. {p.name} – {t('price')}: ${p.base_unit_price} – {t('initial_quantity')}: {p.initial_quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setProducts((prev) => prev.filter((prod) => prod.id !== p.id))}
                  className="text-red-600 hover:underline"
                  aria-label={`${t('remove_product')} ${p.name}`}
                  disabled={loading}
                >
                  {t('remove')}
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowConfirm(true)}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded"
            disabled={products.length === 0 || loading}
          >
            {loading ? t('submitting') : t('submit_all')}
          </button>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
