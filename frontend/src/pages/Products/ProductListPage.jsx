import React, { useEffect, useState } from 'react';
import { fetchProducts, updateProduct, deleteProduct } from '../../api/product';
import AddProductsForm from './AddProductsForm';

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
    fetchProducts()
      .then(data => {
        setProductList(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError('Failed to load products.');
        setLoading(false);
      });
  }, []);

  const handleEdit = (product) => {
    setEditProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      item_type: product.item_type,
      unit: product.unit,
      price_per_unit: product.price_per_unit,
      stock_qty: product.stock_qty,
      branch_id: product.branch_id,
      expiration_date: product.expiration_date ? product.expiration_date.split('T')[0] : '',
    });
  };

  const handleEditChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async () => {
    try {
      const updated = await updateProduct(editProduct.id, formData);
      setProductList(prev => prev.map(product => product.id === updated.id ? updated : product));
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
      await deleteProduct(deleteProductId);
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
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Unit</th>
                  <th className="px-6 py-3 text-left">Price/Unit</th>
                  <th className="px-6 py-3 text-left">Stock Qty</th>
                  <th className="px-6 py-3 text-left">Branch</th>
                  <th className="px-6 py-3 text-left">Expiration</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4 capitalize">{product.category}</td>
                    <td className="px-6 py-4">{product.item_type}</td>
                    <td className="px-6 py-4">{product.unit}</td>
                    <td className="px-6 py-4">{product.price_per_unit}</td>
                    <td className="px-6 py-4">{product.stock_qty}</td>
                    <td className="px-6 py-4">{product.branch_id}</td>
                    <td className="px-6 py-4">
                      {product.expiration_date ? new Date(product.expiration_date).toLocaleDateString() : 'N/A'}
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
              {['name', 'category', 'item_type', 'unit', 'price_per_unit', 'stock_qty', 'branch_id', 'expiration_date'].map(field => (
                <input
                  key={field}
                  type={field === 'price_per_unit' || field === 'stock_qty' || field === 'branch_id' ? 'number' : field === 'expiration_date' ? 'date' : 'text'}
                  name={field}
                  value={formData[field]}
                  onChange={handleEditChange}
                  placeholder={field.replace('_', ' ').toUpperCase()}
                  className="w-full mb-3 border px-4 py-2 rounded"
                />
              ))}
              <div className="flex justify-end space-x-3">
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
