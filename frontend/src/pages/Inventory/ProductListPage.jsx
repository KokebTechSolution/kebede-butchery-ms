import React, { useEffect, useState } from 'react';
import {
  fetchInventory,
  fetchCategories,
  fetchItemTypes
} from '../../api/inventory';
import AddInventoryForm from './ProductForm';
import NewProduct from './NewProduct';
import EditInventoryForm from './EditInventoryForm';

const ProductListPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showNewProductModal, setShowNewProductModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  // Fetch all inventory, categories, and item types
  useEffect(() => {
    const loadData = async () => {
      try {
        const [inventoryData, categoryData, itemTypeData] = await Promise.all([
          fetchInventory(),
          fetchCategories(),
          fetchItemTypes()
        ]);
        setProducts(inventoryData);
        setCategories(categoryData);
        setItemTypes(itemTypeData);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load inventory or metadata.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const totalProducts = products.length;
  const runningLowProducts = products.filter(p => p.running_out).length;

  const totalInventoryValue = products.reduce((sum, product) => {
    return sum + (parseFloat(product.price_per_unit || 0) * (product.bottle_quantity || 0));
  }, 0);

  const handleProductAdded = () => {
    setShowAddModal(false);
    window.location.reload();
  };

  const handleNewProductAdded = () => {
    setShowNewProductModal(false);
    window.location.reload();
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
      // TODO: Delete logic goes here
    }
  };

  if (loading) return <p className="p-4">Loading inventory...</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>

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
          <p className="text-3xl font-bold text-green-700">ETB {totalInventoryValue.toFixed(2)}</p>
        </div>
      </div>

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
              <th className="border px-4 py-2">Min Threshold</th>
              <th className="border px-4 py-2">Running Out</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map(product => (
                <tr
                  key={product.id}
                  className={`text-center hover:bg-gray-50 ${editingProductId === product.id ? 'bg-yellow-100' : ''}`}
                >
                  <td className="border px-4 py-2">{product.name}</td>
                  <td className="border px-4 py-2">{product.category_name}</td>
                  <td className="border px-4 py-2">{product.item_type_name}</td>
                  <td className="border px-4 py-2">{product.uses_carton ? 'Yes' : 'No'}</td>
                  <td className="border px-4 py-2">{product.bottles_per_carton}</td>
                  <td className="border px-4 py-2">{product.carton_quantity}</td>
                  <td className="border px-4 py-2">{product.bottle_quantity}</td>
                  <td className="border px-4 py-2">{product.unit_quantity}</td>
                  <td className="border px-4 py-2">{product.minimum_threshold}</td>
                  <td className="border px-4 py-2">
                    {product.running_out ? (
                      <span className="text-red-500 font-semibold">Running Out</span>
                    ) : (
                      <span className="text-green-500 font-semibold">In Stock</span>
                    )}
                  </td>
                  <td className="border px-4 py-2 space-x-1">
                    <button
                      onClick={() => window.location.href = `/restock/${product.id}`}
                      className="bg-blue-500 text-white px-2 py-1 rounded text-sm hover:bg-blue-600"
                    >
                      Restock
                    </button>
                    <button
                      onClick={() => window.location.href = `/sell/${product.id}`}
                      className="bg-green-500 text-white px-2 py-1 rounded text-sm hover:bg-green-600"
                    >
                      Sell
                    </button>
                    <button
                      onClick={() => handleEdit(product.id)}
                      className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="border px-4 py-4 text-center text-gray-500" colSpan="11">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
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
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path
                        fillRule="evenodd"
                        d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 
                            1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 
                            1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 
                            10 4.293 5.707a1 1 0 010-1.414z"
                        clipRule="evenodd"
                        />
                    </svg>
                    </button>

            </div>
            <EditInventoryForm
              product={editingProduct}
              itemTypes={itemTypes}
              categories={categories}
              onClose={handleEditClose}
              onSuccess={() => window.location.reload()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
