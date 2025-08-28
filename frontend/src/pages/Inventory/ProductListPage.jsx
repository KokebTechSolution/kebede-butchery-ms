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
import EditInventoryForm from './EditInventoryForm';
import axios from 'axios';

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

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingStock, setRestockingStock] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({ 
    restock_quantity: '', 
    restock_type: 'carton', 
    restock_price: '',
    receipt_file: null 
  });
  const [restockError, setRestockError] = useState('');
  const [restockSuccess, setRestockSuccess] = useState('');
  const [restockLoading, setRestockLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  useEffect(() => {
    loadData();
  }, []);

  // TEMPORARILY DISABLED: Auto-refresh data every 30 seconds to show real-time stock updates
  // This was interfering with bartender stock deductions
  useEffect(() => {
    console.log('⚠️ Auto-refresh temporarily disabled to prevent stock interference');
    // const interval = setInterval(() => {
    //   loadData();
    //   setLastRefresh(new Date());
    // }, 30000); // 30 seconds

    // Listen for custom events to refresh data (e.g., when bartender requests are fulfilled)
    const handleRefreshEvent = () => {
      console.log('🔄 Received refresh event, updating inventory data...');
      loadData();
      setLastRefresh(new Date());
    };

    // Add event listener for custom refresh events
    window.addEventListener('inventory-refresh', handleRefreshEvent);

    return () => {
      // clearInterval(interval); // Commented out since interval is disabled
      window.removeEventListener('inventory-refresh', handleRefreshEvent);
    };
  }, []);

  // Helper function to get initial stock amount
  const getInitialStockAmount = (stock) => {
    // Use the new input_quantity field from the backend
    if (stock.input_quantity && stock.input_quantity > 0) {
      return stock.input_quantity;
    }
    return 'N/A';
  };

  // Helper function to get initial stock unit
  const getInitialStockUnit = (stock) => {
    // Use the new input_unit field from the backend
    if (stock.product?.input_unit) {
      return stock.product.input_unit.unit_name;
    }
    return 'N/A';
  };

  // Helper function to get calculated base units
  const getCalculatedBaseUnits = (stock) => {
    if (stock.calculated_base_units && stock.calculated_base_units > 0) {
      return stock.calculated_base_units;
    }
    return 'N/A';
  };

  // Helper function to get base unit name
  const getBaseUnitName = (stock) => {
    if (stock.product?.base_unit) {
      return stock.product.base_unit.unit_name;
    }
    return 'N/A';
  };

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
      
      console.log('🔍 DEBUG: Data loaded from backend:');
      console.log('📦 Products:', inventoryData);
      console.log('🏷️ Categories:', categoryData);
      console.log('📋 Item Types:', itemTypeData);
      console.log('📊 Stocks:', stockData);
      console.log('🏢 Branches:', branchesData);
      
      // Debug individual stock items
      if (stockData && stockData.length > 0) {
        console.log('🔍 DEBUG: First stock item structure:');
        const firstStock = stockData[0];
        console.log('Stock ID:', firstStock.id);
        console.log('Stock Product:', firstStock.product);
        console.log('Stock Product Item Type:', firstStock.product?.item_type);
        console.log('Stock Product Category:', firstStock.product?.category);
        console.log('Stock Product Base Unit:', firstStock.product?.base_unit);
        console.log('Stock Product Input Unit:', firstStock.product?.input_unit);
        console.log('Stock Input Quantity:', firstStock.input_quantity);
        console.log('Stock Calculated Base Units:', firstStock.calculated_base_units);
      }
      
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

  // Manual refresh function that can be called from other components
  const refreshData = async () => {
    await loadData();
    setLastRefresh(new Date());
  };

  // Global function that other components can call to refresh inventory
  useEffect(() => {
    window.refreshInventoryData = refreshData;
    return () => {
      delete window.refreshInventoryData;
    };
  }, []);



  const filteredStocksByBranch = useMemo(() => {
    console.log('🔍 DEBUG: Branch filtering - user branch:', branchManagerBranchId);
    console.log('🔍 DEBUG: Total stocks available:', stocks.length);
    
    // If user has a specific branch, filter by that branch
    if (branchManagerBranchId) {
      const filtered = stocks.filter((stock) => stock.branch?.id === branchManagerBranchId);
      console.log('🔍 DEBUG: Filtered by branch:', filtered.length);
      return filtered;
    }
    // If no specific branch, show all stocks (for admin/owner users)
    console.log('🔍 DEBUG: No specific branch, showing all stocks');
    return stocks;
  }, [stocks, branchManagerBranchId]);

  // Calculate running low products based on stocks for the branch
  const runningLowProducts = filteredStocksByBranch.filter((stock) => 
    stock.calculated_base_units <= stock.minimum_threshold_base_units
  ).length;

  const totalProducts = products.length;
  // Calculate inventory value based on actual stock and product base_unit_price
  const totalInventoryValue = stocks.reduce((sum, stock) => {
    const price = parseFloat(stock.product?.base_unit_price || 0);
    const qty = parseFloat(stock.calculated_base_units || 0);
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
    
    // Use the new simplified fields
    const inputQty = parseFloat(stock.input_quantity || 0);
    const calculatedQty = parseFloat(stock.calculated_base_units || 0);
    const pricePerUnit = parseFloat(product.base_unit_price || 0);
    
    return sum + pricePerUnit * calculatedQty;
  }, 0);

  const handleProductAdded = () => {
    setShowAddModal(false);
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
    setRestockData({ 
      restock_quantity: '', 
      restock_type: 'carton', 
      restock_price: '',
      receipt_file: null 
    });
    setRestockError('');
    setRestockSuccess('');
    setShowRestockModal(true);
  };
  const handleRestockChange = (e) => {
    const { name, value } = e.target;
    setRestockData((prev) => ({ ...prev, [name]: value }));
  };
  const handleRestockSubmit = async () => {
    setRestockError('');
    setRestockSuccess('');
    if (!restockData.restock_quantity || Number(restockData.restock_quantity) <= 0) {
      setRestockError('Enter a valid restock quantity.');
      return;
    }
    if (!restockData.restock_price || Number(restockData.restock_price) <= 0) {
      setRestockError('Enter a valid purchase price.');
      return;
    }
    
    setRestockLoading(true);
    try {
      // Create FormData to send the restock data
      const formData = new FormData();
      formData.append('quantity', restockData.restock_quantity);
      formData.append('type', restockData.restock_type);
      formData.append('price_per_unit', restockData.restock_price);
      
      // Calculate total amount
      const totalAmount = Number(restockData.restock_quantity) * Number(restockData.restock_price);
      formData.append('total_amount', totalAmount.toString());
      
      // Add receipt file if provided
      if (restockData.receipt_file) {
        formData.append('receipt', restockData.receipt_file);
      }
      
      await axios.post(
        `http://localhost:8000/api/inventory/stocks/${restockingStock.id}/restock/`,
        formData,
        {
          withCredentials: true,
          headers: { 
            'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1],
            'Content-Type': 'multipart/form-data'
          },
        }
      );
      
      setShowRestockModal(false);
      setRestockingStock(null);
      setRestockData({ 
        restock_quantity: '', 
        restock_type: 'carton', 
        restock_price: '',
        receipt_file: null 
      });
      await loadData(); // Wait for data to load
      setLastRefresh(new Date()); // Update refresh timestamp
      setRestockSuccess(`✅ Product restocked successfully! Added ${restockData.restock_quantity} ${restockData.restock_type}(s)`);
      
    } catch (err) {
      console.error('Restock error:', err);
      const errorMessage = err.response?.data?.detail || err.response?.data?.message || err.message || 'Restock failed';
      setRestockError('Restock failed: ' + errorMessage);
    } finally {
      setRestockLoading(false);
    }
  };
  const handleDelete = async (productId, stockId) => {
    if (!window.confirm(t('confirm_delete_product'))) return;
    try {
      await axios.delete(`http://localhost:8000/api/inventory/products/${productId}/`, { withCredentials: true });
      if (stockId) {
        await axios.delete(`http://localhost:8000/api/inventory/stocks/${stockId}/`, { withCredentials: true });
      }
      await loadData(); // Wait for data to load
      setLastRefresh(new Date()); // Update refresh timestamp
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <p className="p-4">{t('loading_inventory')}</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{t('inventory_dashboard')}</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors flex items-center gap-2"
            disabled={loading}
          >
            <span className={loading ? 'animate-spin' : ''}>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t('total_products')}
          value={stocks.length}
          color="blue"
        />
        <StatCard
          title={t('running_out')}
          value={stocks.filter(stock => stock.calculated_base_units <= stock.minimum_threshold_base_units).length}
          color="red"
        />
        <StatCard
          title={t('total_value')}
          value={`ETB ${stocks.reduce((sum, stock) => sum + (parseFloat(stock.product?.base_unit_price || 0) * parseFloat(stock.calculated_base_units || 0)), 0).toFixed(2)}`}
          color="green"
        />
      </div>

      {/* Stock Tracking System Information */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-800 mb-3">📊 Stock Tracking System</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-700 mb-1">Input Unit</div>
            <div className="text-gray-600">The unit used when adding stock (e.g., 1 carton, 1 box) - This is what you input</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-700 mb-1">Base Unit</div>
            <div className="text-gray-600">The fundamental unit for pricing and tracking (e.g., 1 bottle, 1 liter)</div>
          </div>
          <div className="bg-white p-3 rounded border">
            <div className="font-semibold text-blue-700 mb-1">Calculated Base Units</div>
            <div className="text-gray-600">Total available in base units: Input Quantity × Conversion Amount</div>
          </div>
        </div>
        <div className="mt-3 p-2 bg-blue-100 rounded text-xs text-blue-700">
          💡 <strong>Stock Tracking:</strong> 
          <span className="text-blue-600 font-bold">Input Unit</span> shows what you add (e.g., 10 cartons).
          <span className="text-gray-600">Base Unit</span> shows the fundamental unit (e.g., 1 bottle).
          <br />
          🔄 <strong>Real-time updates:</strong> Stock levels automatically refresh when bartenders mark requests as "reached".
          <br />
          ⚠️ <strong>Note:</strong> Auto-refresh disabled to prevent interference with bartender stock deductions.
        </div>
      </div>

      <div className="mb-4 flex flex-col sm:flex-row justify-end gap-2 sm:gap-4">
        <button onClick={() => setShowAddModal(true)} className="bg-green-500 text-white px-3 md:px-4 py-2 rounded hover:bg-green-600 text-sm md:text-base">
          {t('add_product')}
        </button>
        <button onClick={refreshData} className="bg-gray-600 text-white px-3 md:px-4 py-2 rounded hover:bg-gray-700 text-sm md:text-base">
          🔄 Refresh
        </button>
        <span className="text-xs text-gray-500 self-center">
          Last: {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-3">
        {filteredStocksByBranch.length > 0 ? (
          filteredStocksByBranch.map((stock) => (
            <div key={stock.id} className="bg-white border rounded-lg p-4 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 text-sm">{stock.product?.name || 'N/A'}</h3>
                  <p className="text-xs text-gray-600">{stock.product?.category?.category_name || 'N/A'}</p>
                  <p className="text-xs text-blue-600">{stock.product?.item_type?.type_name || 'N/A'}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  (stock.calculated_base_units <= stock.minimum_threshold_base_units) ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                }`}>
                  {(stock.calculated_base_units <= stock.minimum_threshold_base_units) ? t('running_out') : t('in_stock')}
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                <div>
                  <span className="text-gray-500">Base Unit:</span>
                  <p className="font-medium text-blue-600">1 {getBaseUnitName(stock)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Input Unit:</span>
                  <p className="font-medium text-green-600">1 {getInitialStockUnit(stock)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Input Quantity:</span>
                  <p className="font-medium text-purple-600">{getInitialStockAmount(stock)} {getInitialStockUnit(stock)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Calculated:</span>
                  <p className="font-medium text-orange-600">{getCalculatedBaseUnits(stock)} {getBaseUnitName(stock)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Price:</span>
                  <p className="font-medium">{stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Threshold:</span>
                  <p className="font-medium">{(stock.minimum_threshold_base_units ?? 'N/A')} {getBaseUnitName(stock)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button onClick={() => handleEdit(stock.product?.id)} className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-xs hover:bg-yellow-600">
                  {t('edit')}
                </button>
                <button onClick={() => handleRestockClick(stock)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors duration-200 flex items-center gap-1">
                        <span>📦</span>
                        {t('restock')}
                      </button>
                <button onClick={() => handleDelete(stock.product?.id, stock.id)} className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600">
                  {t('delete')}
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            {t('no_products_found')}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto border rounded-lg">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2 text-sm">{t('item_type')}</th>
              <th className="border px-4 py-2 text-sm">{t('name')}</th>
              <th className="border px-4 py-2 text-sm">{t('category')}</th>
              <th className="border px-4 py-2 text-sm">{t('base_unit')}</th>
              <th className="border px-4 py-2 text-sm">{t('base_unit_price')}</th>
              <th className="border px-4 py-2 text-sm">{t('input_unit')}</th>
              <th className="border px-4 py-2 text-sm">{t('input_quantity')}</th>
              <th className="border px-4 py-2 text-sm">{t('calculated_base_units')}</th>
              <th className="border px-4 py-2 text-sm">{t('minimum_threshold')}</th>
              <th className="border px-4 py-2 text-sm">{t('branch')}</th>
              <th className="border px-4 py-2 text-sm">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.length > 0 ? (
              filteredStocksByBranch.map((stock) => (
                <tr key={stock.id} className="text-center hover:bg-gray-50">
                  <td className="border px-4 py-2 text-sm">{stock.product?.item_type?.type_name || 'N/A'}</td>
                  <td className="border px-4 py-2 text-sm">{stock.product?.name || 'N/A'}</td>
                  <td className="border px-4 py-2 text-sm">{stock.product?.category?.category_name || 'N/A'}</td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-blue-600">1 {getBaseUnitName(stock)}</div>
                      <div className="text-xs text-blue-500">(Base Unit)</div>
                    </div>
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    {stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-green-600">1 {getInitialStockUnit(stock)}</div>
                      <div className="text-xs text-green-500">(Input Unit)</div>
                    </div>
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-purple-600">{getInitialStockAmount(stock)} {getInitialStockUnit(stock)}</div>
                      <div className="text-xs text-purple-500">(Input Quantity)</div>
                    </div>
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium text-orange-600">{getCalculatedBaseUnits(stock)} {getBaseUnitName(stock)}</div>
                      <div className="text-xs text-orange-500">(Calculated)</div>
                    </div>
                  </td>
                  <td className="border px-4 py-2 text-sm">
                    <div className="text-center">
                      <div className="font-medium">{(stock.minimum_threshold_base_units ?? 'N/A')}</div>
                      <div className="text-xs text-gray-600">{getBaseUnitName(stock)}</div>
                    </div>
                  </td>
                  <td className="border px-4 py-2 text-sm">{stock.branch?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(stock.product?.id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600">
                        {t('edit')}
                      </button>
                      <button onClick={() => handleRestockClick(stock)} className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">
                        {t('restock')}
                      </button>
                      <button onClick={() => handleDelete(stock.product?.id, stock.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                        {t('delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="11" className="border px-4 py-4 text-center text-gray-500">
                  {t('no_products_found')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <Modal title={t('add_product')} onClose={() => setShowAddModal(false)}>
          <AddInventoryForm onSuccess={handleProductAdded} />
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product: <span className="font-semibold text-blue-600">{restockingStock.product?.name}</span>
              </label>
              <div className="text-sm text-gray-600 mb-3">
                <p><strong>Current Stock:</strong></p>
                <p>• Input Quantity: {restockingStock.input_quantity || 0} {restockingStock.product?.input_unit?.unit_name || 'units'}</p>
                <p>• Calculated Base Units: {restockingStock.calculated_base_units || 0} {restockingStock.product?.base_unit?.unit_name || 'units'}</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('restock_type')}</label>
              <select
                name="restock_type"
                value={restockData.restock_type}
                onChange={handleRestockChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
              >
                <option value="carton">Carton</option>
                <option value="bottle">Bottle</option>
                <option value="unit">Unit</option>
                <option value="kg">Kilogram</option>
                <option value="gram">Gram</option>
                <option value="liter">Liter</option>
                <option value="ml">Milliliter</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('quantity')}</label>
              <input
                type="number"
                name="restock_quantity"
                value={restockData.restock_quantity}
                onChange={handleRestockChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                min="1"
                placeholder="Enter quantity"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('price_per_unit')}</label>
              <input
                type="number"
                name="restock_price"
                value={restockData.restock_price}
                onChange={handleRestockChange}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                min="0"
                step="0.01"
                placeholder="Enter price per unit"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Receipt (Optional)</label>
              <input
                type="file"
                name="receipt"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setRestockData(prev => ({ ...prev, receipt_file: file }));
                  }
                }}
                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              <p className="text-xs text-gray-500 mt-1">
                Accepted formats: PDF, JPG, PNG, DOC, DOCX
              </p>
            </div>
            
            {/* Preview of new totals */}
            {restockData.restock_quantity && restockData.restock_type && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <h4 className="font-semibold text-blue-800 mb-2">📊 Restock Preview</h4>
                <div className="text-sm text-blue-700 space-y-1">
                  <p>• Adding: {restockData.restock_quantity} {restockData.restock_type}</p>
                  <p>• New Input Total: {(Number(restockingStock.input_quantity || 0) + Number(restockData.restock_quantity))} {restockData.restock_type}</p>
                  <p>• Price per {restockData.restock_type}: ETB {restockData.restock_price || 0}</p>
                  <p>• Total Cost: ETB {((Number(restockData.restock_quantity) || 0) * (Number(restockData.restock_price) || 0)).toFixed(2)}</p>
                </div>
              </div>
            )}
            {restockError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {restockError}
              </div>
            )}
            {restockSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
                {restockSuccess}
              </div>
            )}
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowRestockModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                {t('cancel')}
              </button>
              <button
                onClick={handleRestockSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                disabled={restockLoading}
              >
                {restockLoading ? 'Restocking...' : t('restock')}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`bg-${color}-100 p-4 rounded shadow text-center`}>
    <h2 className="text-lg font-semibold mb-2">{title}</h2>
    <p className={`text-3xl font-bold text-${color}-700`}>{value}</p>
  </div>
);

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button onClick={onClose} className="text-red-500 text-lg" aria-label="Close modal">✕</button>
      </div>
      {children}
    </div>
  </div>
);

export default ProductListPage;
