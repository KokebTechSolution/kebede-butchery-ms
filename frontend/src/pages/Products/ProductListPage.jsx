import React, { useEffect, useState } from 'react';
import axios from 'axios';
import AddProductsForm from './AddProductsForm';

// Helper to get CSRF token from cookies
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let c of cookies) {
      const cookie = c.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

function ProductListPage() {
  const [productList, setProductList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteProductId, setDeleteProductId] = useState(null);
  const [deleteProductName, setDeleteProductName] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    item_type: '',
    unit: '',
    price_per_unit: '',
    stock_qty: '',
    branch_id: '',
    expiration_date: '',
  });

  useEffect(() => {
    // Use the correct inventory API endpoint
    const fetchProducts = async () => {
      try {
        const response = await axios.get('https://kebede-butchery-ms.onrender.com/api/inventory/products/', {
          withCredentials: true,
        });
        console.log('[DEBUG] Products API response:', response.data);
        // Log the first product to see the structure
        if (response.data.length > 0) {
          console.log('[DEBUG] First product structure:', response.data[0]);
          console.log('[DEBUG] First product store_stocks:', response.data[0].store_stocks);
          
          // Log each stock entry for the first product
          if (response.data[0].store_stocks && response.data[0].store_stocks.length > 0) {
            response.data[0].store_stocks.forEach((stock, index) => {
              console.log(`[DEBUG] Stock ${index + 1}:`, {
                quantity_in_base_units: stock.quantity_in_base_units,
                original_quantity: stock.original_quantity,
                original_unit: stock.original_unit?.unit_name,
                original_quantity_display: stock.original_quantity_display
              });
            });
          }
        }
        setProductList(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products.');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      category_id: product.category?.id || '',
      base_unit_id: product.base_unit?.id || '',
      base_unit_price: product.base_unit_price || '',
    });
  };

  const handleEditChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async () => {
    try {
      const response = await axios.patch(
        `https://kebede-butchery-ms.onrender.com/api/inventory/products/${editProduct.id}/`,
        formData,
        {
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCookie('csrftoken'),
          },
        }
      );
      setProductList(prev => prev.map(product => product.id === response.data.id ? response.data : product));
      setEditProduct(null);
    } catch (err) {
      console.error('Update failed:', err);
      alert('Failed to update product');
    }
  };

  const handleDeleteRequest = (id, name) => {
    setDeleteProductId(id);
    setDeleteProductName(name);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`https://kebede-butchery-ms.onrender.com/api/inventory/products/${deleteProductId}/`, {
        withCredentials: true,
        headers: {
          'X-CSRFToken': getCookie('csrftoken'),
        },
      });
      setProductList(prev => prev.filter(product => product.id !== deleteProductId));
      setDeleteProductId(null);
      setDeleteProductName('');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete product');
    }
  };

  const closeDeleteModal = () => {
    setDeleteProductId(null);
    setDeleteProductName('');
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-yellow-100 min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Product List</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow hover:bg-green-700"
          >
            + Add Product
          </button>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : productList.length === 0 ? (
          <p className="text-center text-gray-600 py-4">No products found.</p>
        ) : (
          <div className="bg-white shadow rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-green-100 text-gray-700 font-semibold">
                <tr>
                  <th className="px-6 py-3 text-left">Name</th>
                  <th className="px-6 py-3 text-left">Category</th>
                  <th className="px-6 py-3 text-left">Base Unit</th>
                  <th className="px-6 py-3 text-left">Base Price</th>
                  <th className="px-6 py-3 text-left">Stock (Base Units)</th>
                  <th className="px-6 py-3 text-left">Original Stock</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4 capitalize">{product.category?.category_name || 'N/A'}</td>
                    <td className="px-6 py-4">{product.base_unit?.unit_name || 'N/A'}</td>
                    <td className="px-6 py-4">${product.base_unit_price || '0.00'}</td>
                    <td className="px-6 py-4">
                      {product.store_stocks && product.store_stocks.length > 0 
                        ? product.store_stocks[0].quantity_in_base_units 
                        : '0.00'}
                    </td>
                    <td className="px-6 py-4">
                      {product.store_stocks && product.store_stocks.length > 0 
                        ? `${product.store_stocks[0].original_quantity || '0.00'} ${product.store_stocks[0].original_unit?.unit_name || ''}`
                        : 'N/A'}
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded shadow hover:bg-yellow-500"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(product.id, product.name)}
                        className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
                      >
                        Delete
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const response = await axios.get(`https://kebede-butchery-ms.onrender.com/api/inventory/products/${product.id}/debug_values/`, {
                              withCredentials: true,
                            });
                            console.log(`[DEBUG] Product ${product.name} debug values:`, response.data);
                            alert(`Debug data logged to console for ${product.name}`);
                          } catch (err) {
                            console.error('Debug request failed:', err);
                            alert('Debug request failed');
                          }
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded shadow hover:bg-blue-600 text-xs"
                      >
                        Debug
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editProduct && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Edit Product</h2>
              <div className="space-y-3">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleEditChange}
                  placeholder="Product Name"
                  className="w-full border px-4 py-2 rounded"
                />
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleEditChange}
                  placeholder="Description"
                  className="w-full border px-4 py-2 rounded"
                  rows="3"
                />
                <input
                  type="number"
                  name="base_unit_price"
                  value={formData.base_unit_price}
                  onChange={handleEditChange}
                  placeholder="Base Unit Price"
                  step="0.01"
                  min="0"
                  className="w-full border px-4 py-2 rounded"
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button onClick={() => setEditProduct(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleEditSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteProductId && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Deletion</h2>
              <p className="mb-6 text-gray-700">Are you sure you want to delete <strong>{deleteProductName}</strong>?</p>
              <div className="flex justify-end space-x-3">
                <button onClick={closeDeleteModal} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleDeleteConfirm} className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">Delete</button>
              </div>
            </div>
          </div>
        )}

        {/* Add Product Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">Add New Product</h2>
              <AddProductsForm
                onSuccess={(newProduct) => {
                  setProductList(prev => [...prev, newProduct]);
                  setShowAddModal(false);
                }}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductListPage;
