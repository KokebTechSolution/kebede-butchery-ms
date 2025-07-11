import React, { useEffect, useState } from 'react';
import axios from 'axios';

const EditInventoryForm = ({ product, categories, itemTypes, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: product.name || '',
    category: product.category || '',
    price_per_unit: product.price_per_unit || '',
    quantityType: product.uses_carton
      ? 'carton'
      : product.bottle_quantity
      ? 'bottle'
      : 'unit',
    bottles_per_carton: product.bottles_per_carton || '',
    carton_quantity: product.carton_quantity || '',
    bottle_quantity: product.bottle_quantity || '',
    unit_quantity: product.unit_quantity || '',
    minimum_threshold: product.minimum_threshold || '',
    running_out: product.running_out || false,
  });

  const [selectedItemTypeId, setSelectedItemTypeId] = useState(product.item_type || '');
  const [allowedToEdit, setAllowedToEdit] = useState(false);

  // Update bottle_quantity if carton quantity or bottles_per_carton changes
  useEffect(() => {
    if (formData.quantityType === 'carton') {
      const bottles = (Number(formData.bottles_per_carton) || 0) * (Number(formData.carton_quantity) || 0);
      setFormData(prev => ({ ...prev, bottle_quantity: bottles.toString() }));
    }
  }, [formData.bottles_per_carton, formData.carton_quantity, formData.quantityType]);

  // Enable editing only for beverage or drink item types
  useEffect(() => {
    const selectedItem = itemTypes.find(item => item.id.toString() === selectedItemTypeId.toString());
    setAllowedToEdit(selectedItem && ['beverage', 'drink'].includes(selectedItem?.type_name?.toLowerCase()));
  }, [selectedItemTypeId]);

  // *** New effect: automatically toggle running_out based on thresholds ***
  useEffect(() => {
    const minThreshold = Number(formData.minimum_threshold);
    const cartonQty = Number(formData.carton_quantity);
    const bottleQty = Number(formData.bottle_quantity);

    if (formData.quantityType === 'carton') {
      setFormData(prev => ({
        ...prev,
        running_out: minThreshold >= cartonQty,
      }));
    } else if (formData.quantityType === 'bottle') {
      setFormData(prev => ({
        ...prev,
        running_out: minThreshold >= bottleQty,
      }));
    } 
    // For unit or other quantityType you can add logic here if needed
  }, [formData.minimum_threshold, formData.carton_quantity, formData.bottle_quantity, formData.quantityType]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:8000/api/inventory/inventory/${product.id}/`, {
        name: formData.name,
        category: Number(formData.category),
        item_type: Number(selectedItemTypeId),
        price_per_unit: parseFloat(formData.price_per_unit),
        uses_carton: formData.quantityType === 'carton',
        bottles_per_carton: Number(formData.bottles_per_carton),
        carton_quantity: Number(formData.carton_quantity),
        bottle_quantity: Number(formData.bottle_quantity),
        unit_quantity: formData.unit_quantity || '0.00',
        minimum_threshold: formData.minimum_threshold || '1.00',
        running_out: Boolean(formData.running_out),
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access')}`,
          'Content-Type': 'application/json',
        },
      });

      alert('Product updated successfully!');
      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error updating product:', err.response?.data || err.message);
      alert('Failed to update product:\n' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      <select value={selectedItemTypeId} onChange={e => setSelectedItemTypeId(e.target.value)} className="border p-2 w-full">
        <option value="">Select Item Type</option>
        {itemTypes.map(item => (
          <option key={item.id} value={item.id}>{item.type_name}</option>
        ))}
      </select>

      {allowedToEdit ? (
        <>
          <input type="text" placeholder="Product Name" name="name" value={formData.name} onChange={handleChange} className="border p-2 w-full" />

          <select name="category" value={formData.category} onChange={handleChange} className="border p-2 w-full">
            <option value="">Select Category</option>
            {categories.filter(cat => cat.item_type === parseInt(selectedItemTypeId)).map(category => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>

          <input type="number" name="price_per_unit" placeholder="Unit Price" value={formData.price_per_unit} onChange={handleChange} className="border p-2 w-full" />

          <div>
            <label className="block font-semibold mb-1">Quantity Type</label>
            <label className="inline-flex items-center mr-4">
              <input type="radio" name="quantityType" value="carton" checked={formData.quantityType === 'carton'} onChange={handleChange} /> <span className="ml-2">By Carton</span>
            </label>
            <label className="inline-flex items-center mr-4">
              <input type="radio" name="quantityType" value="bottle" checked={formData.quantityType === 'bottle'} onChange={handleChange} /> <span className="ml-2">By Bottle</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="quantityType" value="unit" checked={formData.quantityType === 'unit'} onChange={handleChange} /> <span className="ml-2">By Unit</span>
            </label>
          </div>

          {formData.quantityType === 'carton' && (
            <>
              <input type="number" name="bottles_per_carton" placeholder="Bottles per Carton" value={formData.bottles_per_carton} onChange={handleChange} className="border p-2 w-full" />
              <input type="number" name="carton_quantity" placeholder="Carton Quantity" value={formData.carton_quantity} onChange={handleChange} className="border p-2 w-full" />
              <input type="number" name="bottle_quantity" value={formData.bottle_quantity} readOnly className="border p-2 w-full bg-gray-100" />
            </>
          )}

          {formData.quantityType === 'bottle' && (
            <input type="number" name="bottle_quantity" placeholder="Bottle Quantity" value={formData.bottle_quantity} onChange={handleChange} className="border p-2 w-full" />
          )}

          {formData.quantityType === 'unit' && (
            <input type="text" name="unit_quantity" placeholder="Unit Quantity (e.g., 0.00)" value={formData.unit_quantity} onChange={handleChange} className="border p-2 w-full" />
          )}

          <input type="text" name="minimum_threshold" placeholder="Minimum Threshold (e.g., 1.00)" value={formData.minimum_threshold} onChange={handleChange} className="border p-2 w-full" />

          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" name="running_out" checked={formData.running_out} onChange={handleChange} />
            <span>Running Out</span>
          </label>

          <div className="flex justify-end space-x-4">
            <button type="button" onClick={onClose} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Save Changes</button>
          </div>
        </>
      ) : (
        <div className="text-red-600 font-medium">Only Beverage or Drink items can be edited.</div>
      )}
    </form>
  );
};

export default EditInventoryForm;
