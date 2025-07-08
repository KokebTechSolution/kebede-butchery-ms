import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItemTypes, fetchCategories } from '../../api/inventory';
import axios from 'axios';

const AddProductForm = () => {
  const navigate = useNavigate();

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState('');
  const [allowedToAdd, setAllowedToAdd] = useState(false);
  const [receiptImage, setReceiptImage] = useState(null);
  const [products, setProducts] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price_per_unit: '',
    quantityType: '', // 'carton' | 'bottle' | 'unit'
    bottles_per_carton: '',
    carton_quantity: '',
    bottle_quantity: '',
    unit_quantity: '',
    minimum_threshold: '',
    running_out: false,
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        const itemTypeData = await fetchItemTypes();
        const categoryData = await fetchCategories();
        setItemTypes(itemTypeData);
        setCategories(categoryData);
      } catch (err) {
        console.error('Error loading form data:', err);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (formData.quantityType === 'carton') {
      const bottles = (Number(formData.bottles_per_carton) || 0) * (Number(formData.carton_quantity) || 0);
      setFormData(prev => ({ ...prev, bottle_quantity: bottles.toString() }));
    }
  }, [formData.bottles_per_carton, formData.carton_quantity, formData.quantityType]);

  const handleItemTypeChange = (e) => {
    const selectedId = e.target.value;
    setSelectedItemType(selectedId);

    const selectedItem = itemTypes.find(item => item.id.toString() === selectedId);
    setAllowedToAdd(selectedItem && ['beverage', 'drink'].includes(selectedItem.type_name.toLowerCase()));
  };

  const handleAddToList = () => {
    if (!formData.name.trim() || !formData.category || !formData.price_per_unit || isNaN(Number(formData.price_per_unit)) || !formData.quantityType) {
      alert('Please complete all required fields.');
      return;
    }

    const newProduct = {
      ...formData,
      id: Date.now(),
      category: Number(formData.category),
      price_per_unit: parseFloat(formData.price_per_unit).toFixed(2),
      bottles_per_carton: formData.bottles_per_carton ? Number(formData.bottles_per_carton) : 0,
      carton_quantity: formData.carton_quantity ? Number(formData.carton_quantity) : 0,
      bottle_quantity: formData.bottle_quantity ? Number(formData.bottle_quantity) : 0,
      unit_quantity: formData.unit_quantity || '0.00',
      minimum_threshold: formData.minimum_threshold || '1.00',
      running_out: Boolean(formData.running_out),
      uses_carton: formData.quantityType === 'carton'
    };

    setProducts([...products, newProduct]);
    setFormData({
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
    });
  };

  const handleSubmitAll = async () => {
    try {
      if (products.length === 0) {
        alert('Please add at least one product before submitting.');
        return;
      }

      for (const product of products) {
        const productFormData = new FormData();

        productFormData.append('name', product.name);
        productFormData.append('category', product.category);
        productFormData.append('price_per_unit', product.price_per_unit);
        productFormData.append('uses_carton', product.uses_carton ? 'true' : 'false');
        productFormData.append('bottles_per_carton', product.bottles_per_carton);
        productFormData.append('carton_quantity', product.carton_quantity);
        productFormData.append('bottle_quantity', product.bottle_quantity);
        productFormData.append('unit_quantity', product.unit_quantity);
        productFormData.append('minimum_threshold', product.minimum_threshold);
        productFormData.append('running_out', product.running_out ? 'true' : 'false');

        if (receiptImage) {
          productFormData.append('receipt_image', receiptImage);
        }

        await axios.post('http://localhost:8000/api/inventory/inventory/', productFormData, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access')}`,
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      alert('All products submitted successfully!');
      setProducts([]);
      setReceiptImage(null);
      setSelectedItemType('');
      setAllowedToAdd(false);
      navigate('/branch-manager/inventory');
    } catch (err) {
      console.error('Submission error:', err.response?.data || err.message);
      alert('Error submitting data:\n' + JSON.stringify(err.response?.data || err.message));
    }
  };

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Add New Products (Batch)</h1>

      <div className="mb-4">
        <label className="block mb-1 font-semibold">Upload Receipt Image</label>
        <input type="file" accept="image/*" onChange={e => setReceiptImage(e.target.files[0])} className="border p-2 w-full" />
      </div>

      <select value={selectedItemType} onChange={handleItemTypeChange} className="border p-2 w-full mb-4">
        <option value="">Select Item Type</option>
        {itemTypes.map(item => <option key={item.id} value={item.id}>{item.type_name}</option>)}
      </select>

      {allowedToAdd ? (
        <div className="space-y-4">
          <input type="text" placeholder="Product Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="border p-2 w-full" />

          <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="border p-2 w-full">
            <option value="">Select Category</option>
            {categories.filter(cat => cat.item_type === parseInt(selectedItemType)).map(category => (
              <option key={category.id} value={category.id}>{category.category_name}</option>
            ))}
          </select>

          <input type="number" placeholder="Unit Price" value={formData.price_per_unit} onChange={e => setFormData({ ...formData, price_per_unit: e.target.value })} className="border p-2 w-full" />

          <div>
            <label className="block font-semibold mb-1">Quantity Type</label>
            <label className="inline-flex items-center mr-4">
              <input type="radio" name="quantityType" value="carton" checked={formData.quantityType === 'carton'} onChange={e => setFormData({ ...formData, quantityType: e.target.value })} /> <span className="ml-2">By Carton</span>
            </label>
            <label className="inline-flex items-center mr-4">
              <input type="radio" name="quantityType" value="bottle" checked={formData.quantityType === 'bottle'} onChange={e => setFormData({ ...formData, quantityType: e.target.value })} /> <span className="ml-2">By Bottle</span>
            </label>
            <label className="inline-flex items-center">
              <input type="radio" name="quantityType" value="unit" checked={formData.quantityType === 'unit'} onChange={e => setFormData({ ...formData, quantityType: e.target.value })} /> <span className="ml-2">By Unit</span>
            </label>
          </div>

          {formData.quantityType === 'carton' && (
            <>
              <input type="number" placeholder="Bottles per Carton" value={formData.bottles_per_carton} onChange={e => setFormData({ ...formData, bottles_per_carton: e.target.value })} className="border p-2 w-full" />
              <input type="number" placeholder="Carton Quantity" value={formData.carton_quantity} onChange={e => setFormData({ ...formData, carton_quantity: e.target.value })} className="border p-2 w-full" />
              <input type="number" value={formData.bottle_quantity} readOnly className="border p-2 w-full bg-gray-100" />
            </>
          )}

          {formData.quantityType === 'bottle' && (
            <input type="number" placeholder="Bottle Quantity" value={formData.bottle_quantity} onChange={e => setFormData({ ...formData, bottle_quantity: e.target.value })} className="border p-2 w-full" />
          )}

          {formData.quantityType === 'unit' && (
            <input type="text" placeholder="Unit Quantity (e.g., 0.00)" value={formData.unit_quantity} onChange={e => setFormData({ ...formData, unit_quantity: e.target.value })} className="border p-2 w-full" />
          )}

          <input type="text" placeholder="Minimum Threshold (e.g., 1.00)" value={formData.minimum_threshold} onChange={e => setFormData({ ...formData, minimum_threshold: e.target.value })} className="border p-2 w-full" />

          <label className="inline-flex items-center space-x-2">
            <input type="checkbox" checked={formData.running_out} onChange={e => setFormData({ ...formData, running_out: e.target.checked })} />
            <span>Running Out</span>
          </label>

          <button type="button" onClick={handleAddToList} className="bg-green-600 text-white px-4 py-2 rounded">+ Add Product to List</button>
        </div>
      ) : (
        <div className="text-red-600 font-medium">Product addition allowed only for Beverages or Drinks.</div>
      )}

      {products.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold mb-2">Products to Submit:</h2>
          <ul className="space-y-2 max-h-64 overflow-auto border p-2 rounded">
            {products.map((product, index) => (
              <li key={product.id} className="p-2 bg-gray-100 rounded shadow-sm">
                {index + 1}. {product.name} — Category ID: {product.category} — Price: ${product.price_per_unit}
              </li>
            ))}
          </ul>
          <button onClick={handleSubmitAll} className="mt-4 bg-blue-600 text-white px-6 py-2 rounded">Submit All with Receipt</button>
        </div>
      )}
    </div>
  );
};

export default AddProductForm;
