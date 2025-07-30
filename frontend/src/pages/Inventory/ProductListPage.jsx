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
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [restockingStock, setRestockingStock] = useState(null);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [restockData, setRestockData] = useState({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
  const [restockError, setRestockError] = useState('');

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
    return stocks.filter((stock) => stock.branch?.id === branchManagerBranchId);
  }, [stocks, branchManagerBranchId]);

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
    return sum + pricePerUnit * totalBottles;
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
    console.log('Restock click for stock:', stock);
    setRestockingStock(stock);
    setRestockData({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
    setRestockError('');
    setShowRestockModal(true);
    console.log('Restock modal should now be open');
  };
  const handleRestockChange = (e) => {
    const { name, value } = e.target;
    console.log('Restock change:', { name, value });
    setRestockData((prev) => ({ ...prev, [name]: value }));
  };
  const handleRestockSubmit = async () => {
    console.log('Restock submit clicked with data:', restockData);
    setRestockError('');
    
    if (!restockData.restock_quantity || Number(restockData.restock_quantity) <= 0) {
      console.log('Validation failed: Invalid quantity');
      setRestockError('Enter a valid restock quantity.');
      return;
    }
    if (!restockData.restock_price || Number(restockData.restock_price) <= 0) {
      console.log('Validation failed: Invalid price');
      setRestockError('Enter a valid purchase price.');
      return;
    }
    
    console.log('Validation passed, submitting restock...');
    try {
      const payload = {
        quantity: restockData.restock_quantity,
        type: restockData.restock_type,
        price_per_unit: restockData.restock_price,
      };
      console.log('Restock payload:', payload);
      
      const response = await axios.post(
        `http://localhost:8000/api/inventory/stocks/${restockingStock.id}/restock/`,
        payload,
        {
          withCredentials: true,
          headers: { 'X-CSRFToken': document.cookie.split('; ').find(row => row.startsWith('csrftoken='))?.split('=')[1] },
        }
      );
      console.log('Restock response:', response.data);
      setShowRestockModal(false);
      setRestockingStock(null);
      setRestockData({ restock_quantity: '', restock_type: 'carton', restock_price: '' });
      loadData();
    } catch (err) {
      console.error('Restock error:', err.response?.data || err.message);
      setRestockError('Restock failed: ' + (err.response?.data?.detail || err.message));
    }
  };
  const handleDelete = async (productId, stockId) => {
    if (!window.confirm(t('confirm_delete_product'))) return;
    try {
      await axios.delete(`http://localhost:8000/api/inventory/products/${productId}/`, { withCredentials: true });
      if (stockId) {
        await axios.delete(`http://localhost:8000/api/inventory/stocks/${stockId}/`, { withCredentials: true });
      }
      loadData();
    } catch (err) {
      alert('Delete failed: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return <p className="p-4">{t('loading_inventory')}</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('inventory_dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title={t('total_products')}
          value={stocks.length}
          color="blue"
        />
        <StatCard
          title={t('running_out')}
          value={stocks.filter(stock => stock.running_out).length}
          color="red"
        />
        <StatCard
          title={t('total_value')}
          value={`ETB ${stocks.reduce((sum, stock) => sum + (parseFloat(stock.product?.base_unit_price || 0) * parseFloat(stock.quantity_in_base_units || 0)), 0).toFixed(2)}`}
          color="green"
        />
      </div>

      <div className="mb-4 flex justify-end space-x-4">
        <button onClick={() => setShowAddModal(true)} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
          {t('add_product')}
        </button>
        <button onClick={() => setShowNewProductModal(true)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
          {t('add_new_product')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">{t('name')}</th>
              <th className="border px-4 py-2">{t('description')}</th>
              <th className="border px-4 py-2">{t('category')}</th>
              <th className="border px-4 py-2">{t('item_type')}</th>
              <th className="border px-4 py-2">{t('branch')}</th>
              <th className="border px-4 py-2">{t('branch_location')}</th>
              <th className="border px-4 py-2">{t('quantity_in_base_units')}</th>
              <th className="border px-4 py-2">{t('original_quantity')}</th>
              <th className="border px-4 py-2">{t('minimum_threshold_base_units')}</th>
              <th className="border px-4 py-2">{t('base_unit_price')}</th>
              <th className="border px-4 py-2">{t('running_out')}</th>
              <th className="border px-4 py-2">{t('last_stock_update')}</th>
              <th className="border px-4 py-2">{t('product_created_at')}</th>
              <th className="border px-4 py-2">{t('product_updated_at')}</th>
              <th className="border px-4 py-2">{t('actions')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.length > 0 ? (
              filteredStocksByBranch.map((stock) => (
                <tr key={stock.id} className="text-center">
                  <td className="border px-4 py-2">{stock.product?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.product?.description || 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.product?.category?.category_name || 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.product?.category?.item_type?.type_name || 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.branch?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.branch?.location || 'N/A'}</td>
                  <td className="border px-4 py-2">{(stock.quantity_in_base_units ?? 'N/A') + (stock.product?.base_unit?.unit_name ? ' ' + stock.product.base_unit.unit_name : '')}</td>
                  <td className="border px-4 py-2">
                    {stock.original_quantity_display || 'N/A'}
                  </td>
                  <td className="border px-4 py-2">{(stock.minimum_threshold_base_units ?? 'N/A') + (stock.product?.base_unit?.unit_name ? ' ' + stock.product.base_unit.unit_name : '')}</td>
                  <td className="border px-4 py-2">{stock.product?.base_unit_price ? `ETB ${stock.product.base_unit_price}` : 'N/A'}</td>
                  <td className="border px-4 py-2">
                    <span className={`font-semibold ${stock.running_out ? 'text-red-500' : 'text-green-500'}`}>
                      {stock.running_out ? t('running_out') : t('in_stock')}
                    </span>
                  </td>
                  <td className="border px-4 py-2">{stock.last_stock_update ? new Date(stock.last_stock_update).toLocaleString() : 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.product?.created_at ? new Date(stock.product.created_at).toLocaleString() : 'N/A'}</td>
                  <td className="border px-4 py-2">{stock.product?.updated_at ? new Date(stock.product.updated_at).toLocaleString() : 'N/A'}</td>
                  <td className="border px-4 py-2 space-x-2">
                    <button onClick={() => handleEdit(stock.product?.id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600">
                      {t('edit')}
                    </button>
                    <button onClick={() => handleRestockClick(stock)} className="bg-green-600 text-white px-2 py-1 rounded text-sm hover:bg-green-700">
                      {t('restock')}
                    </button>
                    <button onClick={() => handleDelete(stock.product?.id, stock.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                      {t('delete')}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="15" className="border px-4 py-4 text-center text-gray-500">
                  {t('no_products_found')}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="7" className="border px-4 py-2 font-bold text-right">{t('total_money_cartons')}:</td>
              <td className="border px-4 py-2 font-bold">
                ETB {stocks.reduce((sum, stock) => sum + (parseFloat(stock.total_carton_price) || 0), 0).toFixed(2)}
              </td>
              <td className="border px-4 py-2" colSpan="7"></td>
            </tr>
          </tfoot>
        </table>
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
            {restockError && (
              <div className="text-red-500 text-sm">{restockError}</div>
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
              >
                {t('restock')}
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
