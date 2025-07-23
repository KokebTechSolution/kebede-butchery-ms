
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../context/AuthContext';
import {
  fetchProducts,
  fetchCategories,
  fetchItemTypes,
  fetchStocks,
  fetchBranches,
  deleteProduct, // Added deleteProduct to handle the delete action
} from '../../api/inventory';
import ProductForm from './ProductForm'; // Assumed this handles restock/sale/wastage
import NewProductForm from './NewProduct'; // Assumed this handles new product creation
import EditProductForm from './EditInventoryForm'; // Assumed this handles editing product details

// Assuming these are present in your project or you'll define them
const StatCard = ({ title, value, color }) => (
  // Added a default color class for safety, assuming Tailwind is configured for dynamic classes
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

const ProductListPage = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  // Ensure user?.branch provides the ID directly. If it's an object {id: 1, name: "Branch A"}, use user?.branch?.id
  const branchManagerBranchId = user?.branch; // This needs to be the ID, e.g., 1, 2, etc.

  // Initialize all data states as empty arrays to prevent .filter() errors
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [stocks, setStocks] = useState([]); // This was the culprit for the .filter error
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showProductActionModal, setShowProductActionModal] = useState(false); // For Restock/Sale/Wastage
  const [showNewProductModal, setShowNewProductModal] = useState(false); // For creating a brand new product definition
  const [editingProduct, setEditingProduct] = useState(null); // For editing product definition details

  // Use a refetch function to easily trigger data reload
  const refetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        productResponse,
        categoryResponse,
        itemTypeResponse,
        stockResponse,
        branchesResponse,
      ] = await Promise.all([
        fetchProducts(), // Fetches product definitions
        fetchCategories(),
        fetchItemTypes(),
        fetchStocks(), // Fetches the actual stock levels for all products in all branches
        fetchBranches(),
      ]);

      // Safely set state, checking for .results array if API returns paginated data
      setProducts(Array.isArray(productResponse) ? productResponse : productResponse.results || []);
      setCategories(Array.isArray(categoryResponse) ? categoryResponse : categoryResponse.results || []);
      setItemTypes(Array.isArray(itemTypeResponse) ? itemTypeResponse : itemTypeResponse.results || []);
      setStocks(Array.isArray(stockResponse) ? stockResponse : stockResponse.results || []); // Crucial fix here
      setBranches(Array.isArray(branchesResponse) ? branchesResponse : branchesResponse.results || []);

    } catch (err) {
      console.error('Error loading data:', err);
      // More specific error message if possible
      setError(t('error_loading_data') + ': ' + (err.response?.data?.detail || err.message || t('network_error')));
      // Ensure all states are reset to empty arrays on error to prevent further crashes
      setProducts([]);
      setCategories([]);
      setItemTypes([]);
      setStocks([]);
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    refetchData();
  }, [branchManagerBranchId, refetchData]); // Re-load if branch or refetchData dependency changes

  const filteredStocksByBranch = useMemo(() => {
    // Ensure stocks is an array before filtering. It should be due to useState initialization.
    if (!Array.isArray(stocks)) {
      console.error("Stocks is not an array:", stocks);
      return [];
    }

    if (!branchManagerBranchId) {
      // If no specific branch manager branch ID, filter based on user role or display all.
      // For now, if user is not associated with a specific branch, show no stocks by default
      // Or if they are superuser/HQ, they might see all stocks (return stocks;)
      // This logic depends on your user role management.
      // If `user.is_staff` or `user.is_superuser` could be checked here.
      if (user?.is_staff || user?.is_superuser) {
         return stocks; // Show all stocks for admin/staff
      }
      return []; // For regular branch managers without an assigned branch, show empty
    }
    // Convert branchManagerBranchId to string for comparison if stock.branch is string,
    // or convert stock.branch to int if it's a string, or ensure consistency from backend.
    return stocks.filter((stock) => String(stock.branch) === String(branchManagerBranchId));
  }, [stocks, branchManagerBranchId, user]); // Added user to dependencies

  // Dashboard Stats calculation now needs to use `total_sellable_units`
  const totalProducts = products.length; // Number of unique product definitions
  const runningLowProductsCount = filteredStocksByBranch.filter((stock) => stock.running_out).length;

  const totalInventoryValue = filteredStocksByBranch.reduce((sum, stock) => {
    const product = products.find(p => p.id === stock.product); // stock.product is now an ID
    if (!product) return sum;

    // Use total_sellable_units and price_per_sellable_unit
    const totalSellableUnits = parseFloat(stock.total_sellable_units || 0);
    const pricePerSellableUnit = parseFloat(product.price_per_sellable_unit || 0);

    return sum + pricePerSellableUnit * totalSellableUnits;
  }, 0);

  const handleProductActionCompleted = () => {
    setShowProductActionModal(false);
    refetchData(); // Reload data after any action
  };

  const handleNewProductCreated = () => {
    setShowNewProductModal(false);
    refetchData(); // Reload data after creating a new product definition
  };

  const handleProductDefinitionEdited = () => {
    setEditingProduct(null);
    refetchData(); // Reload data after editing a product definition
  }

  const handleEditProductDefinition = (productId) => {
    // Find the product definition to edit
    const product = products.find((p) => p.id === productId);
    setEditingProduct(product);
  };

  const handleEditClose = () => {
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm(t('confirm_delete_product'))) {
      try {
        await deleteProduct(productId); // Call the API to delete the product definition
        alert(t('product_deleted_successfully'));
        refetchData(); // Reload data after successful deletion
      } catch (err) {
        console.error('Error deleting product:', err);
        alert(t('failed_to_delete_product') + ': ' + (err.response?.data?.detail || err.message || t('network_error')));
      }
    }
  };

  if (loading) return <p className="p-4">{t('loading_inventory')}</p>;
  if (error) return <p className="p-4 text-red-500">{error}</p>;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{t('inventory_dashboard')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title={t('total_unique_products')} value={totalProducts} color="blue" />
        <StatCard title={t('stocks_running_low')} value={runningLowProductsCount} color="yellow" />
        <StatCard title={t('total_inventory_value')} value={`ETB ${totalInventoryValue.toFixed(2)}`} color="green" />
      </div>

      <div className="mb-4 flex justify-end space-x-4">
        {/* Button for Restock/Sale/Wastage actions on existing products */}
        <button
          onClick={() => setShowProductActionModal(true)}
          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
        >
          {t('perform_stock_action')}
        </button>
        {/* Button for creating a brand new product definition */}
        <button
          onClick={() => setShowNewProductModal(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          {t('define_new_product')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full border">
          <thead className="bg-gray-100">
            <tr>
              {[
                'name', 'category', 'item_type', 'primary_stocking_unit', 'sellable_unit_type', 'conversion_rate',
                'total_sellable_units', 'branch', 'minimum_threshold', 'running_out', 'actions'
              ].map((key) => (
                <th key={key} className="border px-4 py-2">{t(key)}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredStocksByBranch.length > 0 ? (
              filteredStocksByBranch.map((stock) => {
                const product = products.find(p => p.id === stock.product); // Find the corresponding product definition
                if (!product) {
                    console.warn(`Product definition not found for stock ID: ${stock.id}, Product ID: ${stock.product}`);
                    return null; // Skip rendering if product definition is missing
                }

                // Safely access nested properties. Assuming 'product.category' and 'product.item_type' are objects.
                const categoryName = categories.find(cat => cat.id === product.category)?.category_name || 'N/A';
                const itemTypeName = itemTypes.find(type => type.id === product.item_type)?.type_name || 'N/A';
                const branchName = branches.find(b => b.id === stock.branch)?.name || 'N/A';

                return (
                  <tr key={stock.id} className="text-center">
                    <td className="border px-4 py-2">{product.name}</td>
                    <td className="border px-4 py-2">{categoryName}</td>
                    <td className="border px-4 py-2">{itemTypeName}</td>
                    <td className="border px-4 py-2">{product.primary_stocking_unit}</td>
                    <td className="border px-4 py-2">{product.sellable_unit_type}</td>
                    <td className="border px-4 py-2">{product.conversion_rate}</td>
                    <td className="border px-4 py-2">{stock.total_sellable_units}</td>
                    <td className="border px-4 py-2">{branchName}</td>
                    <td className="border px-4 py-2">{stock.minimum_threshold}</td>
                    <td className="border px-4 py-2">
                      <span className={`font-semibold ${stock.running_out ? 'text-red-500' : 'text-green-500'}`}>
                        {stock.running_out ? t('running_out') : t('in_stock')}
                      </span>
                    </td>
                    <td className="border px-4 py-2 space-x-2">
                      <button onClick={() => handleEditProductDefinition(product.id)} className="bg-yellow-500 text-white px-2 py-1 rounded text-sm hover:bg-yellow-600">
                        {t('edit_definition')}
                      </button>
                      <button onClick={() => handleDeleteProduct(product.id)} className="bg-red-500 text-white px-2 py-1 rounded text-sm hover:bg-red-600">
                        {t('delete_product_definition')}
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="11" className="border px-4 py-4 text-center text-gray-500">
                  {t('no_products_found_in_branch')}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="6" className="border px-4 py-2 font-bold text-right">{t('total_inventory_value')}:</td>
              <td className="border px-4 py-2 font-bold">
                ETB {totalInventoryValue.toFixed(2)}
              </td>
              <td className="border px-4 py-2" colSpan="4"></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Modals */}
      {showProductActionModal && (
        <Modal title={t('perform_stock_action')} onClose={() => setShowProductActionModal(false)}>
          {(categories.length === 0 || itemTypes.length === 0) ? (
            <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
          ) : (
            <ProductForm
              onSuccess={handleProductActionCompleted}
              products={products}
              branches={branches}
              currentBranchId={branchManagerBranchId}
              categories={categories}
              itemTypes={itemTypes}
            />
          )}
        </Modal>
      )}

      {showNewProductModal && (
        <Modal title={t('define_new_product_details')} onClose={() => setShowNewProductModal(false)}>
          {(categories.length === 0 || itemTypes.length === 0) ? (
            <div style={{ padding: 24, textAlign: 'center' }}>Loading...</div>
          ) : (
            <ProductForm
              onSuccess={handleNewProductCreated}
              categories={categories}
              itemTypes={itemTypes}
              onClose={() => setShowNewProductModal(false)}
            />
          )}
        </Modal>
      )}
      {editingProduct && (
        <Modal title={t('edit_product_definition')} onClose={handleEditClose}>
          <EditProductForm
            product={editingProduct}
            itemTypes={itemTypes}
            categories={categories}
            onClose={handleEditClose}
            onSuccess={handleProductDefinitionEdited}
          />
        </Modal>
      )}
    </div>
  );
};

export default ProductListPage;