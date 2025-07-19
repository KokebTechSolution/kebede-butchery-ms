import React, { useState, useEffect } from 'react';
import { 
  fetchComprehensiveInventory, 
  deleteProduct, 
  restockProduct,
  sellProduct,
  recordWastage,
  updateProduct // Added updateProduct
} from '../../api/inventory';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';
import AddProductForm from './ProductForm';
import EditProductModal from './EditProductModal'; // Added EditProductModal

const ProductListPage = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [inventoryData, setInventoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterItemType, setFilterItemType] = useState('');
  const [filterBranch, setFilterBranch] = useState('');
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [branches, setBranches] = useState([]);

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  // Transaction modal states
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [transactionType, setTransactionType] = useState('');
  const [transactionData, setTransactionData] = useState({
    quantity: '',
    unit_type: '',
    branch_name: user?.branch_name || '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchComprehensiveInventory();
      
      console.log('Comprehensive inventory data:', data);
      console.log('Inventory array:', data.inventory);
      console.log('Total items:', data.total_items);
      console.log('Sample item:', data.inventory?.[0]);
      
      setInventoryData(data.inventory || []);
      
      // Extract unique values for filters
      const uniqueCategories = [...new Set(data.inventory?.map(item => item.category) || [])];
      const uniqueItemTypes = [...new Set(data.inventory?.map(item => item.item_type) || [])];
      const uniqueBranches = [...new Set(data.inventory?.map(item => item.branch) || [])];
      
      console.log('Unique categories:', uniqueCategories);
      console.log('Unique item types:', uniqueItemTypes);
      console.log('Unique branches:', uniqueBranches);
      
      setCategories(uniqueCategories);
      setItemTypes(uniqueItemTypes);
      setBranches(uniqueBranches);
    } catch (error) {
      console.error('Error loading data:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (window.confirm(t('confirm_delete_product'))) {
      try {
        await deleteProduct(productId);
        loadData(); // Reload data after deletion
        alert(t('product_deleted_successfully'));
      } catch (error) {
        console.error('Error deleting product:', error);
        alert(t('error_deleting_product'));
      }
    }
  };

  const handleEdit = (item) => {
    setEditingProduct({
      id: item.product_id,
      name: item.product_name,
      category: item.category,
      item_type: item.item_type,
      price_per_unit: item.price_per_unit,
      base_unit: item.base_unit
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (editedData) => {
    try {
      // Update the product
      await updateProduct(editedData.id, {
        name: editedData.name,
        category_id: editedData.category_id,
        base_unit: editedData.base_unit,
        price_per_unit: editedData.price_per_unit
      });
      
      setShowEditModal(false);
      setEditingProduct(null);
      loadData(); // Reload data after update
      alert(t('product_updated_successfully'));
    } catch (error) {
      console.error('Error updating product:', error);
      alert(t('error_updating_product'));
    }
  };

  const handleTransaction = async () => {
    if (!transactionData.quantity || !transactionData.unit_type) {
      alert(t('please_fill_all_fields'));
      return;
    }

    try {
      let response;
      switch (transactionType) {
        case 'restock':
          response = await restockProduct(selectedProduct.product_id, transactionData);
          break;
        case 'sale':
          response = await sellProduct(selectedProduct.product_id, transactionData);
          break;
        case 'wastage':
          response = await recordWastage(selectedProduct.product_id, transactionData);
          break;
        default:
          throw new Error('Invalid transaction type');
      }

      alert(t('transaction_successful'));
      setShowTransactionModal(false);
      setSelectedProduct(null);
      setTransactionType('');
      setTransactionData({ quantity: '', unit_type: '', branch_name: user?.branch_name || '' });
      
      // Reload data to get updated stock levels
      loadData();
    } catch (error) {
      console.error('Error processing transaction:', error);
      alert(t('error_processing_transaction') + ': ' + (error.response?.data?.error || error.message));
    }
  };

  const openTransactionModal = (item, type) => {
    setSelectedProduct(item);
    setTransactionType(type);
    setTransactionData({
      quantity: '',
      unit_type: item.unit_type,
      branch_name: item.branch,
    });
    setShowTransactionModal(true);
  };

  // Filter inventory data
  const filteredInventory = inventoryData.filter(item => {
    const matchesSearch = item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesItemType = !filterItemType || item.item_type === filterItemType;
    const matchesBranch = !filterBranch || item.branch === filterBranch;
    
    return matchesSearch && matchesCategory && matchesItemType && matchesBranch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('comprehensive_inventory')}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-md hover:bg-blue-700 transition-colors duration-200 text-sm sm:text-base"
          >
            + {t('add_new_product')}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 sm:p-6 lg:p-8">
        {/* Filters */}
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('search')}</label>
            <input
              type="text"
              placeholder={t('search_products')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('category')}</label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">{t('all_categories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('item_type')}</label>
            <select
              value={filterItemType}
              onChange={(e) => setFilterItemType(e.target.value)}
              className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">{t('all_item_types')}</option>
              {itemTypes.map(itemType => (
                <option key={itemType} value={itemType}>{itemType}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('branch')}</label>
            <select
              value={filterBranch}
              onChange={(e) => setFilterBranch(e.target.value)}
              className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="">{t('all_branches')}</option>
              {branches.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end sm:col-span-1">
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterCategory('');
                setFilterItemType('');
                setFilterBranch('');
              }}
              className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200 text-sm w-full"
            >
              {t('clear_filters')}
            </button>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('product_name')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('branch')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('quantity')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('unit_type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('base_unit')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('total_in_base_unit')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('price')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredInventory.map((item, index) => {
                  // Debug logging
                  if (index === 0) {
                    console.log('Sample item structure:', item);
                    console.log('product_id:', item.product_id);
                    console.log('stock_id:', item.stock_id);
                  }
                  
                  return (
                    <tr key={`${item.product_id}-${item.stock_id}-${item.unit_id || index}`} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="font-medium">{item.product_name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.branch}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.unit_type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.base_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.total_in_base_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.price_per_unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {item.running_out ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {t('running_out')}
                          </span>
                        ) : item.quantity > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            {t('in_stock')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {t('no_stock')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openTransactionModal(item, 'restock')}
                            className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                          >
                            {t('restock')}
                          </button>
                          <button
                            onClick={() => openTransactionModal(item, 'sale')}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                          >
                            {t('sale')}
                          </button>
                          <button
                            onClick={() => openTransactionModal(item, 'wastage')}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                          >
                            {t('wastage')}
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                          >
                            {t('edit')}
                          </button>
                          <button
                            onClick={() => {
                              console.log('Delete clicked for item:', item);
                              console.log('Product ID:', item.product_id);
                              if (item.product_id) {
                                handleDelete(item.product_id);
                              } else {
                                alert('Cannot delete: No product ID found');
                              }
                            }}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                            title={`Delete ${item.product_name} (ID: ${item.product_id})`}
                          >
                            {t('delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {filteredInventory.map((item, index) => (
              <div key={`${item.product_id}-${item.stock_id}-${item.unit_id || index}`} className="border-b border-gray-200 p-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 text-sm">{item.product_name}</h3>
                    <p className="text-gray-500 text-xs">{item.category} • {item.branch}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 text-sm">${item.price_per_unit}</p>
                    {item.running_out ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {t('running_out')}
                      </span>
                    ) : item.quantity > 0 ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {t('in_stock')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {t('no_stock')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mb-3 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">{t('quantity')}:</span> {item.quantity.toFixed(2)} {item.unit_type}
                  </div>
                  <div>
                    <span className="font-medium">{t('base_unit')}:</span> {item.base_unit}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{t('total_in_base_unit')}:</span> {item.total_in_base_unit}
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => openTransactionModal(item, 'restock')}
                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                  >
                    {t('restock')}
                  </button>
                  <button
                    onClick={() => openTransactionModal(item, 'sale')}
                    className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                  >
                    {t('sale')}
                  </button>
                  <button
                    onClick={() => openTransactionModal(item, 'wastage')}
                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                  >
                    {t('wastage')}
                  </button>
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                  >
                    {t('edit')}
                  </button>
                  <button
                    onClick={() => {
                      console.log('Delete clicked for item:', item);
                      console.log('Product ID:', item.product_id);
                      if (item.product_id) {
                        handleDelete(item.product_id);
                      } else {
                        alert('Cannot delete: No product ID found');
                      }
                    }}
                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                    title={`Delete ${item.product_name} (ID: ${item.product_id})`}
                  >
                    {t('delete')}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredInventory.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">{t('no_products_found')}</p>
            </div>
          )}

          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 sm:px-6">
            <div className="text-sm text-gray-600">
              {t('total_items')}: {filteredInventory.length}
            </div>
          </div>
        </div>
      </main>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">{t('add_new_product')}</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  &times;
                </button>
              </div>
              <div className="max-h-[80vh] overflow-y-auto">
                <AddProductForm 
                  onSuccess={() => {
                    setShowAddModal(false);
                    loadData(); // Reload the product list
                  }}
                  onCancel={() => setShowAddModal(false)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTransactionModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t(transactionType)} - {selectedProduct?.product_name}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('quantity')}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({...transactionData, quantity: e.target.value})}
                    className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {t('unit_type')}
                  </label>
                  <select
                    value={transactionData.unit_type}
                    onChange={(e) => setTransactionData({...transactionData, unit_type: e.target.value})}
                    className="border p-2 w-full rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bottle">{t('bottle')}</option>
                    <option value="carton">{t('carton')}</option>
                    <option value="litre">{t('litre')}</option>
                    <option value="unit">{t('unit')}</option>
                    <option value="shot">{t('shot')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowTransactionModal(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600 transition-colors duration-200"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleTransaction}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  {t('confirm')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {t('edit_product')} - {editingProduct.name}
              </h3>
              
              <EditProductModal
                product={editingProduct}
                onSave={handleEditSubmit}
                onCancel={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductListPage;
