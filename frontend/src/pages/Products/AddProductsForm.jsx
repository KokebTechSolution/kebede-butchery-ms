import React, { useState, useEffect } from 'react';
import axiosInstance from '../../api/axiosInstance';
import { Package, Save, X, ArrowRight, ArrowLeft } from 'lucide-react';

const AddProductsForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    type_id: '',
    unit: '',
    price_per_unit: '',
    stock_qty: '',
    branch_id: '',
    is_active: true,
    expiration_date: '',
  });

  const [itemTypes, setItemTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  useEffect(() => {
    loadFormData();
  }, []);

  const loadFormData = async () => {
    try {
      setLoading(true);
      
      // Load item types
      const typesResponse = await axiosInstance.get('inventory/item-types/');
      setItemTypes(typesResponse.data);
      
      // Load categories
      const categoriesResponse = await axiosInstance.get('inventory/categories/');
      setCategories(categoriesResponse.data);
      
      // Load branches
      const branchesResponse = await axiosInstance.get('branches/');
      setBranches(branchesResponse.data);
      
    } catch (err) {
      console.error('Error loading form data:', err);
      setError('Failed to load form options.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (['type_id', 'price_per_unit', 'stock_qty', 'branch_id'].includes(name) ? Number(value) : value),
    }));
  };

  const validateForm = () => {
    const requiredFields = ['name', 'category', 'type_id', 'unit', 'price_per_unit', 'stock_qty', 'expiration_date', 'branch_id'];
    const missingFields = requiredFields.filter(field => !formData[field]);
    
    if (missingFields.length > 0) {
      setError(`Please fill all required fields: ${missingFields.join(', ')}`);
      return false;
    }
    
    if (formData.price_per_unit <= 0) {
      setError('Price per unit must be greater than 0');
      return false;
    }
    
    if (formData.stock_qty <= 0) {
      setError('Stock quantity must be greater than 0');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);

    try {
      const newProduct = await axiosInstance.post('inventory/products/', formData);
      onSuccess(newProduct.data);
    } catch (err) {
      console.error('Error creating product:', err.response?.data || err);

      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          setError(errorMessages);
        } else {
          setError(errorData);
        }
      } else {
        setError(err.message || 'An error occurred while creating the product.');
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && (!formData.name || !formData.category || !formData.type_id)) {
      setError('Please fill in the basic product information first.');
      return;
    }
    if (step === 2 && (!formData.unit || !formData.price_per_unit || !formData.stock_qty)) {
      setError('Please fill in the pricing and stock information first.');
      return;
    }
    setStep(step + 1);
    setError(null);
  };

  const prevStep = () => {
    setStep(step - 1);
    setError(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading form options...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Package className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Add New Product</h2>
          <p className="text-sm text-gray-600">Fill in the product details below</p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className={`flex items-center ${step >= 1 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              1
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">Basic Info</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${step >= 2 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              2
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">Pricing & Stock</span>
          </div>
          <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-green-500' : 'bg-gray-200'}`}></div>
          <div className={`flex items-center ${step >= 3 ? 'text-green-600' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 3 ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
            }`}>
              3
            </div>
            <span className="ml-2 text-sm font-medium hidden sm:inline">Final Details</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-red-600" />
          </div>
          <div className="text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step 1: Basic Product Information */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                  <Package className="w-3 h-3 text-blue-600" />
                </div>
                Basic Product Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter product name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type_id"
                    value={formData.type_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select Item Type</option>
                    {itemTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.type_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Enter product description"
                    value={formData.description}
                    onChange={handleChange}
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories
                      .filter(cat => !formData.type_id || cat.item_type === formData.type_id)
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.category_name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Branch <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="branch_id"
                    value={formData.branch_id}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  >
                    <option value="">Select Branch</option>
                    {Array.isArray(branches) && branches.map((branch) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Pricing and Stock Information */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Package className="w-3 h-3 text-green-600" />
                </div>
                Pricing & Stock Information
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="unit"
                    placeholder="e.g., kg, pieces, liters"
                    value={formData.unit}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per Unit <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price_per_unit"
                    placeholder="0.00"
                    value={formData.price_per_unit}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock_qty"
                    placeholder="0"
                    value={formData.stock_qty}
                    onChange={handleChange}
                    min="0"
                    step="1"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="expiration_date"
                    value={formData.expiration_date}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                    required
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Final Details */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-3 h-3 text-purple-600" />
                </div>
                Final Details & Confirmation
              </h3>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label className="text-sm text-gray-700">Active Product</label>
                </div>

                {/* Summary */}
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <h4 className="font-medium text-gray-800 mb-3">Product Summary</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div><span className="font-medium">Name:</span> {formData.name}</div>
                    <div><span className="font-medium">Category:</span> {categories.find(c => c.id === formData.category)?.category_name}</div>
                    <div><span className="font-medium">Type:</span> {itemTypes.find(t => t.id === formData.type_id)?.type_name}</div>
                    <div><span className="font-medium">Unit:</span> {formData.unit}</div>
                    <div><span className="font-medium">Price:</span> ETB {Number(formData.price_per_unit || 0).toFixed(2)}</div>
                    <div><span className="font-medium">Stock:</span> {formData.stock_qty}</div>
                    <div><span className="font-medium">Branch:</span> {branches.find(b => b.id === formData.branch_id)?.name}</div>
                    <div><span className="font-medium">Expires:</span> {formData.expiration_date}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4 border-t border-gray-200">
          <div className="flex gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>
            )}
          </div>

          <div className="flex gap-3">
            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Create Product
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </form>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default AddProductsForm;
