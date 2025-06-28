import React, { useEffect, useState } from 'react';
import { fetchMenuItems, updateMenuItem, deleteMenuItem } from '../../api/menu';
import { format } from 'date-fns';

const MenuTable = ({ refreshFlag }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState('');

    const loadMenuItems = async () => {
        setLoading(true);
        try {
            const data = await fetchMenuItems();
            setMenuItems(data);
        } catch (err) {
            console.error('Error fetching menu items:', err);
            setError('Failed to load menu items.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenuItems();
    }, []);

    // Refresh table when refreshFlag changes (insertion happens)
    useEffect(() => {
        loadMenuItems();
    }, [refreshFlag]);

    const renderDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        if (isNaN(date)) return 'Invalid Date';
        return format(date, 'PPpp');
    };

    const handleEdit = (item) => {
        setSelectedItem({ ...item });
        setIsEditModalOpen(true);
    };

    const handleDelete = (item) => {
        setSelectedItem(item);
        setIsDeleteModalOpen(true);
    };

    const handleSaveEdit = async () => {
        try {
            await updateMenuItem(selectedItem.id, selectedItem);
            alert('Menu item updated successfully!');
            setMenuItems(menuItems.map(m => (m.id === selectedItem.id ? selectedItem : m)));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating menu item:', error);
            alert('Error updating menu item.');
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteMenuItem(selectedItem.id);
            alert('Menu item deleted successfully!');
            setMenuItems(menuItems.filter(m => m.id !== selectedItem.id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting menu item:', error);
            alert('Error deleting menu item.');
        }
    };

    const applyDiscount = () => {
        const discount = parseFloat(discountValue);
        if (isNaN(discount) || discount <= 0 || discount >= 100) {
            alert('Enter a valid discount percentage (1-99%).');
            return;
        }

        const discountedItems = menuItems.map(item => ({
            ...item,
            price: (item.price - (item.price * (discount / 100))).toFixed(2)
        }));

        setMenuItems(discountedItems);
        alert(`Applied ${discount}% discount to all menu item prices.`);
    };

    if (loading) return <p>Loading menu items...</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Menu Items List</h1>

            <div className="mb-4 flex space-x-2">
                <input
                    type="number"
                    placeholder="Discount %"
                    className="border p-2 rounded"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                />
                <button
                    onClick={applyDiscount}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Apply Discount
                </button>
            </div>

            <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">ID</th>
                        <th className="p-2 border">Name</th>
                        <th className="p-2 border">Price</th>
                        <th className="p-2 border">Is Available</th>
                        <th className="p-2 border">Item Type</th>
                        <th className="p-2 border">Created At</th>
                        <th className="p-2 border">Updated At</th>
                        <th className="p-2 border">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {menuItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-2 border text-center">{item.id}</td>
                            <td className="p-2 border text-center">{item.name}</td>
                            <td className="p-2 border text-center">{item.price}</td>
                            <td className="p-2 border text-center">{item.is_available ? 'Yes' : 'No'}</td>
                            <td className="p-2 border text-center">{item.item_type}</td>
                            <td className="p-2 border text-center">{renderDate(item.created_at)}</td>
                            <td className="p-2 border text-center">{renderDate(item.updated_at)}</td>
                            <td className="p-2 border text-center space-x-2">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                                >
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-bold mb-4">Edit Menu Item</h2>
                        <label className="block mb-2 font-semibold">Name</label>
                        <input
                            type="text"
                            className="border p-2 w-full rounded mb-4"
                            value={selectedItem.name}
                            onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                        />
                        <label className="block mb-2 font-semibold">Price</label>
                        <input
                            type="number"
                            className="border p-2 w-full rounded mb-4"
                            value={selectedItem.price}
                            onChange={(e) => setSelectedItem({ ...selectedItem, price: parseFloat(e.target.value) })}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-bold mb-4 text-center">Confirm Deletion</h2>
                        <p className="mb-4 text-center">Are you sure you want to delete: <strong>{selectedItem.name}</strong>?</p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuTable;
