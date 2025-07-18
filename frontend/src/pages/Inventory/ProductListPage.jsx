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
      setError('Failed to load inventory or metadata.');
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

    // Calculate total bottles = bottles in cartons + bottles + units (if unit = bottle here)
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      alert(`Delete product with ID: ${productId}`);
      // TODO: implement delete logic
    }
  };

  if (loading) return <p className="p-4">Loading inventory...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-blue-100 p-4 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Total Products</h2>
          <p className="text-3xl font-bold text-blue-700">{totalProducts}</p>
        </div>
        <div className="bg-yellow-100 p-4 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Running Low</h2>
          <p className="text-3xl font-bold text-yellow-700">{runningLowProducts}</p>
        </div>
        <div className="bg-green-100 p-4 rounded shadow text-center">
          <h2 className="text-lg font-semibold mb-2">Inventory Value</h2>
          <p className="text-3xl font-bold text-green-700">
            ETB {totalInventoryValue.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Buttons */}
      <div className="mb-4 flex justify-end space-x-4">
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          Add Product
        </button>
        <button
          onClick={() => setShowNewProductModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Add New Product
        </button>
      </div>

      {/* Table */}
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
              <th className="border px-4 py-2">Total Price</th>
              <th className="border px-4 py-2">Bottle Qty</th>
              <th className="border px-4 py-2">Unit Qty</th>
              <th className="border px-4 py-2">Branch</th>
              <th className="border px-4 py-2">Running Out</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.length > 0 ? (
              filteredStocksByBranch.map((stock) => (
                <tr key={stock.id} className="text-center">
                  <td className="border px-4 py-2">{stock.product?.name}</td>
                  <td className="border px-4 py-2">{stock.product?.category?.category_name}</td>
                  <td className="border px-4 py-2">
                    {stock.product?.category?.item_type?.type_name}
                  </td>
                  <td className="border px-4 py-2">
                    {stock.product?.uses_carton ? 'Yes' : 'No'}
                  </td>
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
                  <td className="border px-4 py-2 space-x-2">
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
              ))
            ) : (
              <tr>
                <td colSpan="11" className="border px-4 py-4 text-center text-gray-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td className="border px-4 py-2 font-bold text-right" colSpan="7">Total Money (All Cartons):</td>
              <td className="border px-4 py-2 font-bold" colSpan="1">
                ETB {stocks.reduce((sum, stock) => sum + (parseFloat(stock.total_carton_price) || 0), 0).toFixed(2)}
              </td>
              <td className="border px-4 py-2" colSpan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modals */}
      {showAddModal && (
        <Modal title="Add Product" onClose={() => setShowAddModal(false)}>
          <AddInventoryForm onSuccess={handleProductAdded} />
        </Modal>
      )}
      {showNewProductModal && (
        <Modal title="Add New Product Info" onClose={() => setShowNewProductModal(false)}>
          <NewProduct onSuccess={handleNewProductAdded} />
        </Modal>
      )}
      {editingProduct && (
        <Modal title="Edit Product" onClose={handleEditClose}>
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

// Helper Modal Component
const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white p-6 rounded shadow-lg max-w-lg w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">{title}</h2>
        <button
          onClick={onClose}
          className="text-red-500 text-lg"
          aria-label="Close modal"
        >
          ✕
        </button>
      </div>
      {children}
    </div>
  </div>
);

export default ProductListPage;
