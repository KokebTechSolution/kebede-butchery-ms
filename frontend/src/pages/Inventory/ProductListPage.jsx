import React, { useEffect, useState, useMemo } from 'react';
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
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [inventoryData, categoryData, itemTypeData, stockData, branchesData] = await Promise.all([
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
        setError('Failed to load inventory or metadata.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredStocksByBranch = useMemo(() => {
    if (!branchManagerBranchId) return [];
    return stocks.filter(stock => stock.branch?.id === branchManagerBranchId);
  }, [stocks, branchManagerBranchId]);

  const refreshData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [inventoryData, categoryData, itemTypeData, stockData, branchesData] = await Promise.all([
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
      console.error('Error refreshing data:', err);
      setError('Failed to refresh data.');
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = () => {
    setShowAddModal(false);
    refreshData();
  };

  const handleNewProductAdded = () => {
    setShowNewProductModal(false);
    refreshData();
  };

  const handleEdit = (productId) => {
    const product = products.find(p => p.id === productId);
    setEditingProductId(productId);
    setEditingProduct(product);
  };

  const handleEditClose = () => {
    setEditingProductId(null);
    setEditingProduct(null);
  };

  const handleDelete = (productId) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      alert(`Delete product with ID: ${productId}`);
      // TODO: Implement delete logic and refresh after success
    }
  };

  if (loading) return <p className="p-4">Loading inventory...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>

      <div className="mb-4 flex justify-end space-x-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Product
        </button>
        <button
          onClick={() => window.location.href = '/branch-manager/request'}
          className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600"
        >
          View Requests
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-4 py-2">Name</th>
              <th className="border px-4 py-2">Category</th>
              <th className="border px-4 py-2">Item Type</th>
              <th className="border px-4 py-2">Uses Carton</th>
              <th className="border px-4 py-2">Bottles/Carton</th>
              <th className="border px-4 py-2">Carton Qty</th>
              <th className="border px-4 py-2">Bottle Qty</th>
              <th className="border px-4 py-2">Unit Qty</th>
              <th className="border px-4 py-2">Branch</th>
              <th className="border px-4 py-2">Running Out</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.map(stock => (
              <tr key={stock.id} className="text-center">
                <td className="border px-4 py-2">{stock.product?.name}</td>
                <td className="border px-4 py-2">{stock.product?.category?.category_name}</td>
                <td className="border px-4 py-2">{stock.product?.category?.item_type?.type_name}</td>
                <td className="border px-4 py-2">{stock.product?.uses_carton ? 'Yes' : 'No'}</td>
                <td className="border px-4 py-2">{stock.product?.bottles_per_carton}</td>
                <td className="border px-4 py-2">{stock.carton_quantity}</td>
                <td className="border px-4 py-2">{stock.bottle_quantity}</td>
                <td className="border px-4 py-2">{stock.unit_quantity}</td>
                <td className="border px-4 py-2">{stock.branch?.name || 'N/A'}</td>
                <td className="border px-4 py-2">
                  {stock.running_out ? (
                    <span className="text-red-500 font-semibold">Running Out</span>
                  ) : (
                    <span className="text-green-500 font-semibold">In Stock</span>
                  )}
                </td>
                <td className="border px-4 py-2 space-x-1">
                  <button
                    onClick={() => handleEdit(stock.product?.id)}
                    className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(stock.product?.id)}
                    className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Product</h2>
              <button onClick={() => setShowAddModal(false)} className="text-red-500 text-lg">✕</button>
            </div>
            <AddInventoryForm onSuccess={handleProductAdded} />
          </div>
        </div>
      )}

      {showNewProductModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add New Product Info</h2>
              <button onClick={() => setShowNewProductModal(false)} className="text-red-500 text-lg">✕</button>
            </div>
            <NewProduct onSuccess={handleNewProductAdded} />
          </div>
        </div>
      )}

      {editingProduct && itemTypes.length > 0 && categories.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit Product</h2>
              <button
                onClick={handleEditClose}
                className="text-white bg-red-500 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-full p-2 transition duration-200 shadow-md hover:scale-105"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <EditInventoryForm
              product={editingProduct}
              itemTypes={itemTypes}
              categories={categories}
              onClose={handleEditClose}
              onSuccess={refreshData}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
