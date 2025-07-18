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

  const totalProducts = products.length;
  const runningLowProducts = products.filter((p) => p.running_out).length;
  const totalInventoryValue = products.reduce((sum, product) => {
    const stock = stocks.find((s) => s.product?.id === product.id);
    if (!stock) return sum;

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

  const handleDelete = (productId) => {
    if (window.confirm(t('confirm_delete_product'))) {
      alert(`${t('delete')} ID: ${productId}`);
      // TODO: implement delete logic
    }
  };

  if (loading) return <p className="p-4">{t('loading_inventory')}</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('inventory_dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title={t('total_products')} value={totalProducts} color="blue" />
        <StatCard title={t('running_low')} value={runningLowProducts} color="yellow" />
        <StatCard title={t('inventory_value')} value={`ETB ${totalInventoryValue.toFixed(2)}`} color="green" />
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
              {[
                'name', 'category', 'item_type', 'uses_carton', 'bottles_per_carton',
                'carton_qty', 'bottle_qty', 'unit_qty', 'branch', 'running_out', 'actions'
              ].map((key) => (
                <th key={key} className="border px-4 py-2">{t(key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.length > 0 ? (
              filteredStocksByBranch.map((stock) => (
                <tr key={stock.id} className="text-center">
                  <td className="border px-4 py-2">{stock.product?.name}</td>
                  <td className="border px-4 py-2">{stock.product?.category?.category_name}</td>
                  <td className="border px-4 py-2">{stock.product?.category?.item_type?.type_name}</td>
                  <td className="border px-4 py-2">{stock.product?.uses_carton ? t('yes') : t('no')}</td>
                  <td className="border px-4 py-2">{stock.product?.bottles_per_carton}</td>
                  <td className="border px-4 py-2">{stock.carton_quantity}</td>
                  <td className="border px-4 py-2">{stock.bottle_quantity}</td>
                  <td className="border px-4 py-2">{stock.unit_quantity}</td>
                  <td className="border px-4 py-2">{stock.branch?.name || 'N/A'}</td>
                  <td className="border px-4 py-2">
                    <span className={`font-semibold ${stock.running_out ? 'text-red-500' : 'text-green-500'}`}>
                      {stock.running_out ? t('running_out') : t('in_stock')}
                    </span>
                  </td>
                  <td className="border px-4 py-2 space-x-2">
                    <button onClick={() => handleEdit(stock.product?.id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600">
                      {t('edit')}
                    </button>
                    <button onClick={() => handleDelete(stock.product?.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                      {t('delete')}
                    </button>
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
          <tfoot>
            <tr>
              <td colSpan="7" className="border px-4 py-2 font-bold text-right">{t('total_money_cartons')}:</td>
              <td className="border px-4 py-2 font-bold">
                ETB {stocks.reduce((sum, stock) => sum + (parseFloat(stock.total_carton_price) || 0), 0).toFixed(2)}
              </td>
              <td className="border px-4 py-2" colSpan="4"></td>
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
