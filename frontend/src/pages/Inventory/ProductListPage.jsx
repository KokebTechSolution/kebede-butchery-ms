import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  fetchInventory,
  fetchCategories,
  fetchItemTypes,
  fetchStocks,
  fetchBranches,
} from '../../api/inventory';
import AddInventoryForm from './ProductForm';
import NewProduct from './NewProduct';
import EditInventoryForm from './EditInventoryForm';
import axios from 'axios';
import { FaSearch, FaTimes, FaEdit, FaPlus, FaBoxes } from 'react-icons/fa';

const ProductListPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const branchManagerBranchId = user?.branch || null;

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingStock, setRestockingStock] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
  const [restockError, setRestockError] = useState('');

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        inventoryData,
        categoryData,
        itemTypeData,
        stockData,
        branchesData,
      ] = await Promise.all([
        fetchInventory(),
        fetchCategories(),
        fetchItemTypes(),
        fetchStocks(),
        fetchBranches(),
      ]);
      setProducts(inventoryData);
      setCategories(categoryData);
      setItemTypes(itemTypeData);
      setStocks(stockData);
      setBranches(branchesData);
    } catch (err) {
      console.error('Error loading data:', err);
      setError(t('error_loading_data'));
    } finally {
      setLoading(false);
    }
  };

  const filteredStocksByBranch = useMemo(() => {
    if (!branchManagerBranchId) return [];
    let filtered = stocks.filter((stock) => stock.branch?.id === branchManagerBranchId);
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(stock => 
        stock.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.product?.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stock.product?.category?.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [stocks, branchManagerBranchId, searchTerm]);

  // Calculate running low products based on stocks for the branch
  const runningLowProducts = filteredStocksByBranch.filter((stock) => stock.running_out).length;

  const totalProducts = products.length;
  // Calculate inventory value based on actual stock and product base_unit_price
  const totalInventoryValue = stocks.reduce((sum, stock) => {
    const price = parseFloat(stock.product?.base_unit_price || 0);
    const qty = parseFloat(stock.quantity_in_base_units || 0);
    return sum + price * qty;
  }, 0);

  // Calculate weekly inventory value
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const weeklyInventoryValue = products.reduce((sum, product) => {
    const stock = stocks.find((s) => s.product?.id === product.id);
    if (!stock) return sum;
    const updatedAt = product.updated_at ? new Date(product.updated_at) : null;
    if (!updatedAt || updatedAt < oneWeekAgo) return sum;
    const cartonQty = stock.carton_quantity || 0;
    const bottleQty = stock.bottle_quantity || 0;
    const unitQty = stock.unit_quantity || 0;
    const pricePerUnit = parseFloat(product.price_per_unit || 0);
    const bottlesPerCarton = product.bottles_per_carton || 1;
    const totalBottles = cartonQty * bottlesPerCarton + bottleQty + unitQty;
    return sum + totalBottles * pricePerUnit;
  }, 0);

  const handleProductAdded = () => {
    setShowAddModal(false);
    loadData();
  };

  const handleNewProductAdded = () => {
    setShowNewProductModal(false);
    loadData();
  };

  const handleEdit = (productId) => {
    const product = products.find((p) => p.id === productId);
    setEditingProduct(product);
  };

  const handleEditClose = () => {
    setEditingProduct(null);
  };

  const handleRestockClick = (stock) => {
    setRestockingStock(stock);
    setShowRestockModal(true);
    setRestockData({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
    setRestockError('');
  };

  const handleRestockChange = (e) => {
    setRestockData({ ...restockData, [e.target.name]: e.target.value });
  };

  const handleRestockSubmit = async () => {
    if (!restockData.restock_quantity || !restockData.restock_price) {
      setRestockError(t('please_fill_all_fields'));
      return;
    }

    try {
      const response = await axios.post(`/api/inventory/stocks/${restockingStock.id}/restock/`, {
        restock_quantity: parseFloat(restockData.restock_quantity),
        restock_type: restockData.restock_type,
        restock_price: parseFloat(restockData.restock_price),
      });

      if (response.status === 200) {
        setShowRestockModal(false);
        setRestockingStock(null);
        setRestockData({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
        setRestockError('');
        loadData();
      }
    } catch (err) {
      console.error('Restock failed:', err);
      setRestockError(err.response?.data?.detail || t('restock_failed'));
    }
  };

  const handleDelete = async (productId, stockId) => {
    if (!window.confirm(t('confirm_delete_product'))) return;

    try {
      await axios.delete(`/api/inventory/products/${productId}/`);
      await axios.delete(`/api/inventory/stocks/${stockId}/`);
      loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  // Render product card for mobile view
  const renderProductCard = (stock) => (
    <div key={stock.id} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-lg">{stock.product?.name || 'N/A'}</h3>
          <p className="text-gray-600 text-sm">{stock.product?.description || 'N/A'}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          stock.running_out ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
        }`}>
          {stock.running_out ? t('running_out') : t('in_stock')}
        </span>
      </div>
      
      <div className="space-y-2 text-sm text-gray-700 mb-3">
        <p><span className="font-medium">{t('category')}:</span> {stock.product?.category?.category_name || 'N/A'}</p>
        <p><span className="font-medium">{t('quantity')}:</span> {stock.original_quantity_display || 'N/A'}</p>
        <p><span className="font-medium">{t('minimum_threshold')}:</span> {(stock.minimum_threshold_base_units ?? 'N/A') + (stock.product?.base_unit?.unit_name ? ' ' + stock.product.base_unit.unit_name : '')}</p>
        <p><span className="font-medium">{t('price')}:</span> {stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}</p>
      </div>
      
      <div className="flex space-x-2">
        <button 
          onClick={() => handleEdit(stock.product?.id)} 
          className="flex-1 bg-yellow-500 text-white p-2 rounded text-sm flex items-center justify-center hover:bg-yellow-600"
        >
          <FaEdit className="mr-1" /> {t('edit')}
        </button>
        <button 
          onClick={() => handleRestockClick(stock)} 
          className="flex-1 bg-green-600 text-white p-2 rounded text-sm flex items-center justify-center hover:bg-green-700"
        >
          <FaBoxes className="mr-1" /> {t('restock')}
        </button>
      </div>
    </div>
  );

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border-l-4 border-red-500 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('inventory_dashboard')}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {filteredStocksByBranch.length} {t('products')}
            </p>
          </div>
          
          {/* Search and Add Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {/* Search Bar */}
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_products')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label={t('search_products')}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={t('clear_search')}
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-2">
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-green-500 text-white px-4 py-2 rounded-lg shadow hover:bg-green-600 flex items-center"
              >
                <FaPlus className="mr-2" /> {t('add_product')}
              </button>
              <button 
                onClick={() => setShowNewProductModal(true)} 
                className="bg-blue-500 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-600 flex items-center"
              >
                <FaBoxes className="mr-2" /> {t('add_new_product')}
              </button>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <StatCard title={t('total_products')} value={totalProducts} color="blue" />
          <StatCard title={t('running_low')} value={runningLowProducts} color="yellow" />
          <StatCard title={t('inventory_value')} value={`ETB ${totalInventoryValue.toFixed(2)}`} color="green" />
        </div>

        {/* Content Section */}
        {filteredStocksByBranch.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              {searchTerm ? t('no_matching_products') : t('no_products_found')}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? t('try_different_search') : t('no_products_yet')}
            </p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="-ml-1 mr-2 h-5 w-5" />
                {t('add_product')}
              </button>
            </div>
          </div>
        ) : isMobile ? (
          // Mobile card view
          <div className="space-y-3">
            {filteredStocksByBranch.map(stock => renderProductCard(stock))}
          </div>
        ) : (
          // Desktop table view
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('description')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('category')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('quantity')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('minimum_threshold')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('price')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredStocksByBranch.map((stock) => (
                    <tr key={stock.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stock.product?.name || 'N/A'}</div>
                        <div className="text-sm text-gray-500">{stock.product?.description || 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.product?.description || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.product?.category?.category_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.original_quantity_display || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {(stock.minimum_threshold_base_units ?? 'N/A') + (stock.product?.base_unit?.unit_name ? ' ' + stock.product.base_unit.unit_name : '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          stock.running_out ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {stock.running_out ? t('running_out') : t('in_stock')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button 
                          onClick={() => handleEdit(stock.product?.id)} 
                          className="text-yellow-600 hover:text-yellow-900 bg-yellow-100 hover:bg-yellow-200 px-3 py-1 rounded text-sm"
                        >
                          {t('edit')}
                        </button>
                        <button 
                          onClick={() => handleRestockClick(stock)} 
                          className="text-green-600 hover:text-green-900 bg-green-100 hover:bg-green-200 px-3 py-1 rounded text-sm"
                        >
                          {t('restock')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <Modal title={t('add_product')} onClose={() => setShowAddModal(false)}>
          <AddInventoryForm onSuccess={handleProductAdded} />
        </Modal>
      )}
      {showNewProductModal && (
        <Modal title={t('add_new_product_info')} onClose={() => setShowNewProductModal(false)}>
          <NewProduct onSuccess={handleNewProductAdded} />
        </Modal>
      )}
      {editingProduct && (
        <Modal title={t('edit_product')} onClose={handleEditClose}>
          <EditInventoryForm
            product={editingProduct}
            itemTypes={itemTypes}
            categories={categories}
            onClose={handleEditClose}
            onSuccess={loadData}
          />
        </Modal>
      )}
      {showRestockModal && restockingStock && (
        <Modal title={t('restock_product')} onClose={() => setShowRestockModal(false)}>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-1">{t('quantity')}</label>
              <input
                type="number"
                name="restock_quantity"
                value={restockData.restock_quantity}
                onChange={handleRestockChange}
                className="border p-2 w-full rounded"
                min="0"
              />
            </div>
            <div>
              <label className="block font-medium mb-1">{t('type')}</label>
              <select
                name="restock_type"
                value={restockData.restock_type}
                onChange={handleRestockChange}
                className="border p-2 w-full rounded"
              >
                <option value="carton">{t('carton')}</option>
                <option value="bottle">{t('bottle')}</option>
                <option value="unit">{t('unit')}</option>
              </select>
            </div>
            <div>
              <label className="block font-medium mb-1">{t('purchase_price')}</label>
              <input
                type="number"
                name="restock_price"
                value={restockData.restock_price}
                onChange={handleRestockChange}
                className="border p-2 w-full rounded"
                min="0"
                step="0.01"
              />
            </div>
            {restockError && <p className="text-red-500 text-sm mb-2">{restockError}</p>}
            <div className="flex justify-end space-x-2">
              <button onClick={handleRestockSubmit} className="bg-green-600 text-white px-4 py-2 rounded">
                {t('restock')}
              </button>
              <button onClick={() => setShowRestockModal(false)} className="bg-gray-400 text-white px-4 py-2 rounded">
                {t('cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`bg-${color}-100 p-4 rounded-xl shadow-mobile text-center transition-all duration-200 hover:shadow-mobile-lg hover:scale-[1.02]`}>
    <h2 className="text-lg font-semibold mb-2 text-gray-700">{title}</h2>
    <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
    <div className="bg-white p-6 rounded-xl shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-red-500 text-lg hover:text-red-700" aria-label="Close modal">✕</button>
      </div>
      {children}
    </div>
  </div>
);

export default ProductListPage;