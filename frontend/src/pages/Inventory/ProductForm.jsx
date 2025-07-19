import React, { useState, useEffect } from 'react';
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

const AddProductForm = ({ onSuccess, onCancel }) => {
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
    shot_per_bottle: '',
    shot_per_liter: '',
  };

  const [formData, setFormData] = useState(initialFormData);

  const [totalShotsPerBottle, setTotalShotsPerBottle] = useState('');
  const [totalShotsPerLiter, setTotalShotsPerLiter] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [itemTypeData, categoryData, productRes] = await Promise.all([
          fetchItemTypes(),
          fetchCategories(),
          axios.get('http://localhost:8000/api/inventory/inventory/', {
            withCredentials: true,
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

  const validateForm = () => {
    let err = {};

    if (!formData.name.trim()) err.name = t('product_name_required');
    if (!formData.category) err.category = t('category_required');
    if (!formData.price_per_unit) err.price_per_unit = t('price_required');
    else if (isNaN(Number(formData.price_per_unit)) || Number(formData.price_per_unit) < 0)
      err.price_per_unit = t('price_must_be_positive');
    if (!formData.quantityType) err.quantityType = t('quantity_type_required');

    if (formData.quantityType === 'carton') {
      if (!formData.bottles_per_carton || Number(formData.bottles_per_carton) <= 0)
        err.bottles_per_carton = t('bottles_per_carton_positive');
      if (!formData.carton_quantity || Number(formData.carton_quantity) < 0)
        err.carton_quantity = t('carton_quantity_non_negative');
    } else if (formData.quantityType === 'bottle') {
      if (formData.bottle_quantity === '' || Number(formData.bottle_quantity) < 0)
        err.bottle_quantity = t('bottle_quantity_non_negative');
      if (!formData.shot_per_bottle || Number(formData.shot_per_bottle) < 0)
        err.shot_per_bottle = t('shots_per_bottle_non_negative');
    } else if (formData.quantityType === 'unit') {
      if (formData.unit_quantity === '' || Number(formData.unit_quantity) < 0)
        err.unit_quantity = t('unit_quantity_non_negative');
      if (!formData.shot_per_liter || Number(formData.shot_per_liter) < 0)
        err.shot_per_liter = t('shots_per_liter_non_negative');
    }

    if (formData.minimum_threshold === '' || Number(formData.minimum_threshold) < 0)
      err.minimum_threshold = t('minimum_threshold_non_negative');

    setErrors(err);

    return Object.keys(err).length === 0;
  };

  const handleAddToList = () => {
    setErrors(null);

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
      shot_per_bottle: formData.shot_per_bottle || '',
      shot_per_liter: formData.shot_per_liter || '',
    };

    setProducts((prev) => [...prev, newProduct]);
    setFormData(initialFormData);
    setIsNewName(true);
    setTotalShotsPerBottle('');
    setTotalShotsPerLiter('');
  };

  const handleSubmitAll = async () => {
    if (products.length === 0) {
      alert(t('add_at_least_one_product'));
      return;
    }

    const csrfToken = getCookie('csrftoken');

    try {
      for (const product of products) {
        // Step 1: Create Product with proper backend model structure
        const productFormData = new FormData();
        productFormData.append('name', product.name);
        productFormData.append('category_id', product.category);
        productFormData.append('base_unit', product.quantityType); // Map quantityType to base_unit
        productFormData.append('price_per_unit', product.price_per_unit);
        if (product.receipt_image) {
          productFormData.append('receipt_image', product.receipt_image);
        }

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

        // Step 2: Create Stock with StockUnit
        await axios.post(
          'http://localhost:8000/api/inventory/stocks/',
          {
            product_id: createdProduct.id,
            branch_id: product.branch_id,
            minimum_threshold: product.minimum_threshold,
            running_out: product.running_out,
            // StockUnit data
            unit_type: product.quantityType,
            quantity: product.quantityType === 'carton' ? product.carton_quantity : 
                     product.quantityType === 'bottle' ? product.bottle_quantity : 
                     product.unit_quantity,
          },
          {
            withCredentials: true,
            headers: {
              'X-CSRFToken': csrfToken,
            },
          }
        );
      }

      alert(t('submit_success'));
      setProducts([]);
      setSelectedItemType('');
      setAllowedToAdd(false);
      
      // Call onSuccess callback instead of navigating
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('Submit error:', err.response?.data || err.message);
      alert(t('submit_error') + ': ' + JSON.stringify(err.response?.data || err.message));
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
    <div className="p-4 max-w-3xl mx-auto overflow-y-auto">
      <h1 className="text-2xl font-bold mb-4">{t('add_new_products')}</h1>

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
        <option value="">{t('select_item_type')}</option>
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

          <input
            type="number"
            placeholder={t('unit_price')}
            value={formData.price_per_unit}
            onChange={(e) => setFormData({ ...formData, price_per_unit: e.target.value })}
            className={`border p-2 w-full ${errors?.price_per_unit ? 'border-red-500' : ''}`}
          />
          {errors?.price_per_unit && (
            <p className="text-red-500 text-sm">{errors.price_per_unit}</p>
          )}

          <div>
            <label className="block font-semibold">{t('quantity_type')}</label>
            {['carton', 'bottle', 'unit'].map((type) => (
              <label key={type} className="inline-flex items-center mr-4">
                <input
                  type="radio"
                  name="quantityType"
                  value={type}
                  checked={formData.quantityType === type}
                  onChange={(e) => setFormData({ ...formData, quantityType: e.target.value })}
                />
                <span className="ml-2 capitalize">{t(type)}</span>
              </label>
            ))}
            {errors?.quantityType && (
              <p className="text-red-500 text-sm">{errors.quantityType}</p>
            )}
          </div>

          {/* Carton fields */}
          {formData.quantityType === 'carton' && (
            <>
              <input
                type="number"
                placeholder={t('bottles_per_carton')}
                value={formData.bottles_per_carton}
                onChange={(e) =>
                  setFormData({ ...formData, bottles_per_carton: e.target.value })
                }
                className={`border p-2 w-full ${errors?.bottles_per_carton ? 'border-red-500' : ''}`}
              />
              {errors?.bottles_per_carton && (
                <p className="text-red-500 text-sm">{errors.bottles_per_carton}</p>
              )}
              <input
                type="number"
                placeholder={t('carton_quantity')}
                value={formData.carton_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, carton_quantity: e.target.value })
                }
                className={`border p-2 w-full ${errors?.carton_quantity ? 'border-red-500' : ''}`}
              />
              {errors?.carton_quantity && (
                <p className="text-red-500 text-sm">{errors.carton_quantity}</p>
              )}
              <input
                type="number"
                value={formData.bottle_quantity}
                readOnly
                className="border p-2 w-full bg-gray-100"
                aria-label={t('calculated_bottle_quantity')}
                placeholder={t('total_bottles')}
              />
            </>
          )}

          {/* Bottle fields */}
          {formData.quantityType === 'bottle' && (
            <>
              <input
                type="number"
                placeholder={t('bottle_quantity')}
                value={formData.bottle_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, bottle_quantity: e.target.value })
                }
                className={`border p-2 w-full ${errors?.bottle_quantity ? 'border-red-500' : ''}`}
              />
              {errors?.bottle_quantity && (
                <p className="text-red-500 text-sm">{errors.bottle_quantity}</p>
              )}
              <input
                type="number"
                placeholder={t('shots_per_bottle')}
                value={formData.shot_per_bottle}
                onChange={(e) =>
                  setFormData({ ...formData, shot_per_bottle: e.target.value })
                }
                className={`border p-2 w-full ${errors?.shot_per_bottle ? 'border-red-500' : ''}`}
              />
              {errors?.shot_per_bottle && (
                <p className="text-red-500 text-sm">{errors.shot_per_bottle}</p>
              )}
              <input
                type="number"
                value={totalShotsPerBottle}
                readOnly
                className="border p-2 w-full bg-gray-100"
                aria-label={t('calculated_shots_per_bottle')}
                placeholder={t('total_shots')}
              />
            </>
          )}

          {/* Unit fields */}
          {formData.quantityType === 'unit' && (
            <>
              <input
                type="number"
                step="0.01"
                placeholder={t('liter_quantity')}
                value={formData.unit_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, unit_quantity: e.target.value })
                }
                className={`border p-2 w-full ${errors?.unit_quantity ? 'border-red-500' : ''}`}
              />
              {errors?.unit_quantity && (
                <p className="text-red-500 text-sm">{errors.unit_quantity}</p>
              )}
              <input
                type="number"
                placeholder={t('shots_per_liter')}
                value={formData.shot_per_liter}
                onChange={(e) =>
                  setFormData({ ...formData, shot_per_liter: e.target.value })
                }
                className={`border p-2 w-full ${errors?.shot_per_liter ? 'border-red-500' : ''}`}
              />
              {errors?.shot_per_liter && (
                <p className="text-red-500 text-sm">{errors.shot_per_liter}</p>
              )}
              <input
                type="number"
                value={totalShotsPerLiter}
                readOnly
                className="border p-2 w-full bg-gray-100"
                aria-label={t('calculated_shots_per_liter')}
                placeholder={t('total_shots')}
              />
            </>
          )}

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
            onClick={handleAddToList}
            className="bg-green-600 text-white px-4 py-2 rounded mt-4"
          >
            + {t('add_product_to_list')}
          </button>
        </div>
      ) : (
        <div className="text-red-600">{t('only_beverages_allowed')}</div>
      )}

      {products.length > 0 && (
        <div className="mt-6">
          <h2 className="font-bold text-lg mb-2">{t('products_in_queue')}</h2>
          <ul className="space-y-2 border p-2 max-h-64 overflow-auto">
            {products.map((p, idx) => (
              <li key={p.id} className="bg-gray-100 rounded p-2 flex justify-between items-center">
                <span>
                  {idx + 1}. {p.name} – {t('price')}: ${p.price_per_unit}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setProducts((prev) => prev.filter((prod) => prod.id !== p.id))
                  }
                  className="text-red-600 hover:underline"
                  aria-label={`${t('remove_product')} ${p.name}`}
                >
                  {t('remove')}
                </button>
              </li>
            ))}
          </ul>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={handleSubmitAll}
              className="bg-blue-600 text-white px-6 py-2 rounded"
              disabled={products.length === 0}
            >
              {t('submit_all')}
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="bg-gray-500 text-white px-6 py-2 rounded"
              >
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
