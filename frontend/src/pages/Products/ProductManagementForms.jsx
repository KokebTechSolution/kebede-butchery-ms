import React, { useState } from 'react';
import axiosInstance from '../../api/axiosInstance';

const ProductManagementForms = ({ onSuccess, onCancel }) => {
  const [activeForm, setActiveForm] = useState('bulk-edit');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Bulk Edit Form
  const [bulkEditData, setBulkEditData] = useState({
    selectedProducts: [],
    updateField: '',
    newValue: '',
    category: '',
    is_active: true
  });

  // Import Form
  const [importData, setImportData] = useState({
    csvFile: null,
    hasHeaders: true,
    delimiter: ','
  });

  // Export Form
  const [exportData, setExportData] = useState({
    format: 'csv',
    includeStock: true,
    includePrices: true,
    category: 'all'
  });

  // Advanced Filter Form
  const [filterData, setFilterData] = useState({
    category: '',
    minPrice: '',
    maxPrice: '',
    minStock: '',
    maxStock: '',
    isActive: 'all',
    dateFrom: '',
    dateTo: ''
  });

  const handleBulkEdit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.post('inventory/products/bulk-update/', bulkEditData);
      setSuccess('Products updated successfully!');
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update products');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', importData.csvFile);
      formData.append('has_headers', importData.hasHeaders);
      formData.append('delimiter', importData.delimiter);

      const response = await axiosInstance.post('inventory/products/import/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Products imported successfully!');
      onSuccess(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to import products');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('inventory/products/export/', {
        params: exportData,
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `products_export.${exportData.format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      setSuccess('Export completed successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export products');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get('inventory/products/', {
        params: filterData
      });
      onSuccess(response.data);
      setSuccess('Filter applied successfully!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to apply filter');
    } finally {
      setLoading(false);
    }
  };

  const renderBulkEditForm = () => (
    <form onSubmit={handleBulkEdit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Select Products
        </label>
        <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto">
          <div className="space-y-2">
            {/* This would be populated with actual product checkboxes */}
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Product 1
            </label>
            <label className="flex items-center">
              <input type="checkbox" className="mr-2" />
              Product 2
            </label>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Update Field
          </label>
          <select
            value={bulkEditData.updateField}
            onChange={(e) => setBulkEditData(prev => ({ ...prev, updateField: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">Select Field</option>
            <option value="category">Category</option>
            <option value="price_per_unit">Price per Unit</option>
            <option value="is_active">Active Status</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            New Value
          </label>
          <input
            type="text"
            value={bulkEditData.newValue}
            onChange={(e) => setBulkEditData(prev => ({ ...prev, newValue: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="Enter new value"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          checked={bulkEditData.is_active}
          onChange={(e) => setBulkEditData(prev => ({ ...prev, is_active: e.target.checked }))}
          className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
        />
        <label className="text-sm text-gray-700">Set as Active</label>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Products'}
        </button>
      </div>
    </form>
  );

  const renderImportForm = () => (
    <form onSubmit={handleImport} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          CSV File
        </label>
        <input
          type="file"
          accept=".csv"
          onChange={(e) => setImportData(prev => ({ ...prev, csvFile: e.target.files[0] }))}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Delimiter
          </label>
          <select
            value={importData.delimiter}
            onChange={(e) => setImportData(prev => ({ ...prev, delimiter: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value=",">Comma (,)</option>
            <option value=";">Semicolon (;)</option>
            <option value="\t">Tab</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={importData.hasHeaders}
            onChange={(e) => setImportData(prev => ({ ...prev, hasHeaders: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">File has headers</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {loading ? 'Importing...' : 'Import Products'}
        </button>
      </div>
    </form>
  );

  const renderExportForm = () => (
    <form onSubmit={handleExport} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Export Format
          </label>
          <select
            value={exportData.format}
            onChange={(e) => setExportData(prev => ({ ...prev, format: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="csv">CSV</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="json">JSON</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category Filter
          </label>
          <select
            value={exportData.category}
            onChange={(e) => setExportData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All Categories</option>
            <option value="food">Food</option>
            <option value="beverage">Beverage</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={exportData.includeStock}
            onChange={(e) => setExportData(prev => ({ ...prev, includeStock: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">Include stock information</label>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={exportData.includePrices}
            onChange={(e) => setExportData(prev => ({ ...prev, includePrices: e.target.checked }))}
            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
          />
          <label className="text-sm text-gray-700">Include price information</label>
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {loading ? 'Exporting...' : 'Export Products'}
        </button>
      </div>
    </form>
  );

  const renderFilterForm = () => (
    <form onSubmit={handleFilter} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={filterData.category}
            onChange={(e) => setFilterData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="">All Categories</option>
            <option value="food">Food</option>
            <option value="beverage">Beverage</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            value={filterData.isActive}
            onChange={(e) => setFilterData(prev => ({ ...prev, isActive: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option value="all">All</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Price
          </label>
          <input
            type="number"
            value={filterData.minPrice}
            onChange={(e) => setFilterData(prev => ({ ...prev, minPrice: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0.00"
            step="0.01"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Price
          </label>
          <input
            type="number"
            value={filterData.maxPrice}
            onChange={(e) => setFilterData(prev => ({ ...prev, maxPrice: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="1000.00"
            step="0.01"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Min Stock
          </label>
          <input
            type="number"
            value={filterData.minStock}
            onChange={(e) => setFilterData(prev => ({ ...prev, minStock: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="0"
            min="0"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Max Stock
          </label>
          <input
            type="number"
            value={filterData.maxStock}
            onChange={(e) => setFilterData(prev => ({ ...prev, maxStock: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
            placeholder="1000"
            min="0"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date From
          </label>
          <input
            type="date"
            value={filterData.dateFrom}
            onChange={(e) => setFilterData(prev => ({ ...prev, dateFrom: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date To
          </label>
          <input
            type="date"
            value={filterData.dateTo}
            onChange={(e) => setFilterData(prev => ({ ...prev, dateTo: e.target.value }))}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => setFilterData({
            category: '',
            minPrice: '',
            maxPrice: '',
            minStock: '',
            maxStock: '',
            isActive: 'all',
            dateFrom: '',
            dateTo: ''
          })}
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
        >
          Clear Filters
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
        >
          {loading ? 'Filtering...' : 'Apply Filters'}
        </button>
      </div>
    </form>
  );

  return (
    <div className="bg-white rounded-xl shadow-xl p-6">
      {/* Form Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setActiveForm('bulk-edit')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeForm === 'bulk-edit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Bulk Edit
        </button>
        <button
          onClick={() => setActiveForm('import')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeForm === 'import'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Import
        </button>
        <button
          onClick={() => setActiveForm('export')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeForm === 'export'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Export
        </button>
        <button
          onClick={() => setActiveForm('filter')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeForm === 'filter'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Advanced Filter
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="mt-6">
        {activeForm === 'bulk-edit' && renderBulkEditForm()}
        {activeForm === 'import' && renderImportForm()}
        {activeForm === 'export' && renderExportForm()}
        {activeForm === 'filter' && renderFilterForm()}
      </div>
    </div>
  );
};

export default ProductManagementForms; 