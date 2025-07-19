import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  fetchItemTypes, 
  fetchCategories, 
  getProductById, 
  updateProduct, 
  updateStock,
  fetchStocks 
} from '../../api/inventory';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const EditProductForm = () => {
  const navigate = useNavigate();
  const { productId } = useParams();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [product, setProduct] = useState(null);
  const [stock, setStock] = useState(null);
  const [errors, setErrors] = useState({});

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    base_unit: 'bottle',
    price_per_unit: '',
    receipt_image: null,
    quantity: '',
    minimum_threshold: '',
    running_out: false,
  });

  useEffect(() => {
    loadData();
  }, [productId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [itemTypeData, categoryData, productData] = await Promise.all([
        fetchItemTypes(),
        fetchCategories(),
        getProductById(productId),
      ]);

      setItemTypes(itemTypeData);
      setCategories(categoryData);
      setProduct(productData);

      // Load stock data
      try {
        const stocks = await fetchStocks();
        const productStock = stocks.find(s => s.product === parseInt(productId) && s.branch === user?.branch);
        if (productStock) {
          setStock(productStock);
          // Find the stock unit for the base unit
          const stockUnit = productStock.units?.find(u => u.unit_type === productData.base_unit);
          if (stockUnit) {
            setFormData(prev => ({
              ...prev,
              quantity: stockUnit.quantity.toString(),
              minimum_threshold: productStock.minimum_threshold.toString(),
              running_out: productStock.running_out,
            }));
          }
        }
      } catch (error) {
        console.error('Error loading stock data:', error);
      }

      // Set form data from product
      setFormData({
        name: productData.name,
        category: productData.category.id,
        base_unit: productData.base_unit,
        price_per_unit: productData.price_per_unit,
        receipt_image: null, // Don't pre-fill image
        quantity: '',
        minimum_threshold: '',
        running_out: false,
      });

    } catch (error) {
      console.error('Error loading data:', error);
      alert(t('error_loading_product'));
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let err = {};

    if (!formData.name.trim()) err.name = t('product_name_required');
    if (!formData.category) err.category = t('category_required');
    if (!formData.price_per_unit) err.price_per_unit = t('price_required');
    else if (isNaN(Number(formData.price_per_unit)) || Number(formData.price_per_unit) < 0)
      err.price_per_unit = t('price_must_be_positive');
    if (!formData.base_unit) err.base_unit = t('base_unit_required');

    // Stock validation
    if (formData.quantity === '' || Number(formData.quantity) < 0)
      err.quantity = t('quantity_non_negative');
    if (formData.minimum_threshold === '' || Number(formData.minimum_threshold) < 0)
      err.minimum_threshold = t('minimum_threshold_non_negative');

    setErrors(err);
    return Object.keys(err).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);

    try {
      // Update product
      const productUpdateData = {
        name: formData.name,
        category_id: formData.category,
        base_unit: formData.base_unit,
        price_per_unit: formData.price_per_unit,
        receipt_image: formData.receipt_image,
      };

      await updateProduct(productId, productUpdateData);

      // Update stock if it exists
      if (stock) {
        const stockUpdateData = {
          minimum_threshold: formData.minimum_threshold,
          running_out: formData.running_out,
        };

        await updateStock(stock.id, stockUpdateData);
      }

      alert(t('product_updated_successfully'));
      navigate('/branch-manager/inventory');
    } catch (error) {
      console.error('Error updating product:', error);
      alert(t('error_updating_product') + ': ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">{t('product_not_found')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto min-h-screen bg-gray-50">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t('edit_product')}</h1>
          <button
            onClick={() => navigate('/branch-manager/inventory')}
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
          >
            {t('back_to_inventory')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4 text-blue-800">{t('product_information')}</h3>
            
            {/* Product Name */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('product_name')}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.name ? 'border-red-500' : ''
                }`}
              />
              {errors?.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Category */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('category')}</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.category ? 'border-red-500' : ''
                }`}
              >
                <option value="">{t('select_category')}</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.category_name}
                  </option>
                ))}
              </select>
              {errors?.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>

            {/* Base Unit */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('base_unit')}</label>
              <select
                name="base_unit"
                value={formData.base_unit}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.base_unit ? 'border-red-500' : ''
                }`}
              >
                <option value="bottle">{t('bottle')}</option>
                <option value="carton">{t('carton')}</option>
                <option value="litre">{t('litre')}</option>
                <option value="unit">{t('unit')}</option>
                <option value="shot">{t('shot')}</option>
              </select>
              {errors?.base_unit && <p className="text-red-500 text-sm mt-1">{errors.base_unit}</p>}
            </div>

            {/* Price */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('unit_price')}</label>
              <input
                type="number"
                step="0.01"
                name="price_per_unit"
                value={formData.price_per_unit}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.price_per_unit ? 'border-red-500' : ''
                }`}
              />
              {errors?.price_per_unit && (
                <p className="text-red-500 text-sm mt-1">{errors.price_per_unit}</p>
              )}
            </div>

            {/* Receipt Image */}
            <div>
              <label className="block font-semibold mb-2 text-gray-700">{t('receipt_image')}</label>
              <input
                type="file"
                name="receipt_image"
                accept="image/*"
                onChange={handleInputChange}
                className="border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {product.receipt_image && (
                <p className="text-sm text-gray-600 mt-1">
                  {t('current_image')}: {product.receipt_image}
                </p>
              )}
            </div>
          </div>

          {/* Stock Information */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-4 text-gray-800">{t('stock_information')}</h3>
            
            {/* Quantity */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('current_quantity')}</label>
              <input
                type="number"
                step="0.01"
                name="quantity"
                value={formData.quantity}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.quantity ? 'border-red-500' : ''
                }`}
              />
              {errors?.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
            </div>

            {/* Minimum Threshold */}
            <div className="mb-4">
              <label className="block font-semibold mb-2 text-gray-700">{t('minimum_threshold')}</label>
              <input
                type="number"
                step="0.01"
                name="minimum_threshold"
                value={formData.minimum_threshold}
                onChange={handleInputChange}
                className={`border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors?.minimum_threshold ? 'border-red-500' : ''
                }`}
              />
              {errors?.minimum_threshold && (
                <p className="text-red-500 text-sm mt-1">{errors.minimum_threshold}</p>
              )}
            </div>

            {/* Running Out Checkbox */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="running_out"
                name="running_out"
                checked={formData.running_out}
                onChange={handleInputChange}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="running_out" className="text-gray-700">{t('running_out')}</label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/branch-manager/inventory')}
              className="bg-gray-500 text-white px-6 py-3 rounded-md hover:bg-gray-600 transition-colors duration-200 font-semibold"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors duration-200 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {t('saving')}
                </span>
              ) : (
                t('save_changes')
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProductForm; 