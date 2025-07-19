import React, { useState, useEffect } from 'react';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import { useTranslation } from 'react-i18next';

const EditProductModal = ({ product, onSave, onCancel }) => {
  const { t } = useTranslation();
  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    id: product.id,
    name: product.name,
    category_id: '',
    item_type_id: '',
    price_per_unit: product.price_per_unit,
    base_unit: product.base_unit
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [itemTypeData, categoryData] = await Promise.all([
        fetchItemTypes(),
        fetchCategories(),
      ]);
      setItemTypes(itemTypeData);
      setCategories(categoryData);
      
      // Find the current category and item type IDs
      const currentCategory = categoryData.find(cat => cat.category_name === product.category);
      const currentItemType = itemTypeData.find(type => type.type_name === product.item_type);
      
      if (currentCategory) {
        setFormData(prev => ({
          ...prev,
          category_id: currentCategory.id,
          item_type_id: currentCategory.item_type.id
        }));
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = t('product_name_required');
    }
    if (!formData.category_id) {
      newErrors.category_id = t('category_required');
    }
    if (!formData.price_per_unit || formData.price_per_unit <= 0) {
      newErrors.price_per_unit = t('valid_price_required');
    }
    if (!formData.base_unit) {
      newErrors.base_unit = t('base_unit_required');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  const handleCategoryChange = (e) => {
    const categoryId = parseInt(e.target.value);
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      item_type_id: selectedCategory ? selectedCategory.item_type.id : ''
    }));
  };

  const filteredCategories = categories.filter(cat => 
    !formData.item_type_id || cat.item_type.id === formData.item_type_id
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('product_name')}
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className={`border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? 'border-red-500' : ''
          }`}
        />
        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('item_type')}
        </label>
        <select
          value={formData.item_type_id}
          onChange={(e) => {
            const itemTypeId = parseInt(e.target.value);
            setFormData(prev => ({
              ...prev,
              item_type_id: itemTypeId,
              category_id: '' // Reset category when item type changes
            }));
          }}
          className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">{t('select_item_type')}</option>
          {itemTypes.map((itemType) => (
            <option key={itemType.id} value={itemType.id}>
              {itemType.type_name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('category')}
        </label>
        <select
          value={formData.category_id}
          onChange={handleCategoryChange}
          className={`border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.category_id ? 'border-red-500' : ''
          }`}
          disabled={!formData.item_type_id}
        >
          <option value="">{t('select_category')}</option>
          {filteredCategories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.category_name}
            </option>
          ))}
        </select>
        {errors.category_id && <p className="text-red-500 text-xs mt-1">{errors.category_id}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('base_unit')}
        </label>
        <select
          value={formData.base_unit}
          onChange={(e) => setFormData({ ...formData, base_unit: e.target.value })}
          className={`border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.base_unit ? 'border-red-500' : ''
          }`}
        >
          <option value="carton">{t('carton')}</option>
          <option value="bottle">{t('bottle')}</option>
          <option value="litre">{t('litre')}</option>
          <option value="unit">{t('unit')}</option>
          <option value="shot">{t('shot')}</option>
        </select>
        {errors.base_unit && <p className="text-red-500 text-xs mt-1">{errors.base_unit}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {t('price_per_unit')}
        </label>
        <input
          type="number"
          step="0.01"
          value={formData.price_per_unit}
          onChange={(e) => setFormData({ ...formData, price_per_unit: parseFloat(e.target.value) || 0 })}
          className={`border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.price_per_unit ? 'border-red-500' : ''
          }`}
        />
        {errors.price_per_unit && <p className="text-red-500 text-xs mt-1">{errors.price_per_unit}</p>}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
        >
          {t('save_changes')}
        </button>
      </div>
    </form>
  );
};

export default EditProductModal; 