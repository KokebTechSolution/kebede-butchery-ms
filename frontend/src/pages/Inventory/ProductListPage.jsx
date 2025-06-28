import React, { useEffect, useState } from 'react';
import { fetchInventory } from '../../api/inventory';
import AddInventoryForm from './ProductForm';
import NewProduct from './NewProduct'; // Import your NewProduct form

const ProductListPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showNewProductModal, setShowNewProductModal] = useState(false); // New modal state

    useEffect(() => {
        const loadProducts = async () => {
            try {
                const data = await fetchInventory();
                setProducts(data);
            } catch (err) {
                console.error('Error loading inventory:', err);
                setError('Failed to load inventory.');
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, []);

    const totalProducts = products.length;
    const runningLowProducts = products.filter(p => p.running_out).length;

    const totalInventoryValue = products.reduce((sum, product) => {
        return sum + (product.price_per_unit ? product.price_per_unit * product.bottle_quantity : 0);
    }, 0);

    const handleProductAdded = () => {
        setShowAddModal(false);
        window.location.reload();
    };

    const handleNewProductAdded = () => {
        setShowNewProductModal(false);
        window.location.reload();
    };

    if (loading) return <p className="p-4">Loading inventory...</p>;
    if (error) return <p className="p-4 text-red-500">{error}</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Inventory Dashboard</h1>

            {/* Summary Cards */}
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

            {/* Add Product Buttons */}
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

            {/* Product Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full border">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="border px-4 py-2">Name</th>
                            <th className="border px-4 py-2">Category</th>
                            <th className="border px-4 py-2">Item Type</th>
                            <th className="border px-4 py-2">Unit Type</th>
                            <th className="border px-4 py-2">Quantity</th>
                            <th className="border px-4 py-2">Running Out</th>
                            <th className="border px-4 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.length > 0 ? (
                            products.map(product => (
                                <tr key={product.id} className="text-center hover:bg-gray-50">
                                    <td className="border px-4 py-2">{product.name}</td>
                                    <td className="border px-4 py-2">{product.category_name}</td>
                                    <td className="border px-4 py-2">{product.item_type_name}</td>
                                    <td className="border px-4 py-2">{product.unit_type}</td>
                                    <td className="border px-4 py-2">{product.bottle_quantity}</td>
                                    <td className="border px-4 py-2">
                                        {product.running_out ? (
                                            <span className="text-red-500 font-semibold">Running Out</span>
                                        ) : (
                                            <span className="text-green-500 font-semibold">In Stock</span>
                                        )}
                                    </td>
                                    <td className="border px-4 py-2 space-x-2">
                                        <button
                                            onClick={() => window.location.href = `/restock/${product.id}`}
                                            className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                                        >
                                            Restock
                                        </button>
                                        <button
                                            onClick={() => window.location.href = `/sell/${product.id}`}
                                            className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                        >
                                            Sell
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td className="border px-4 py-4 text-center text-gray-500" colSpan="7">
                                    No products found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Add Product Modal */}
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

            {/* New Product Modal */}
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
        </div>
    );
};

export default ProductListPage;
