import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMenuItems, updateMenuItem, deleteMenuItem } from '../../api/menu';
import axiosInstance from '../../api/axiosInstance';
import { format } from 'date-fns';

const MenuTable = ({ refreshFlag }) => {
    const { t } = useTranslation();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const loadMenuItems = async () => {
        setLoading(true);
        try {
            const data = await fetchMenuItems();
            setMenuItems(data);
        } catch (err) {
            console.error('Error fetching menu items:', err);
            setError(t('error_loading_menu'));
        } finally {
            setLoading(false);
        }
    };

    const loadCategories = async () => {
        try {
            const res = await axiosInstance.get('/inventory/categories/');
            setCategories(res.data);
        } catch (err) {
            console.error('Error fetching categories:', err);
        }
    };

    useEffect(() => {
        loadMenuItems();
        loadCategories();
    }, []);

    useEffect(() => {
        loadMenuItems();
    }, [refreshFlag]);

    const renderDate = (dateString) => {
        if (!dateString) return t('not_available');
        const date = new Date(dateString);
        if (isNaN(date)) return t('invalid_date');
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
            alert(t('menu_item_updated'));
            setMenuItems(menuItems.map(m => (m.id === selectedItem.id ? selectedItem : m)));
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Error updating menu item:', error);
            alert(t('error_updating_menu'));
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await deleteMenuItem(selectedItem.id);
            alert(t('menu_item_deleted'));
            setMenuItems(menuItems.filter(m => m.id !== selectedItem.id));
            setIsDeleteModalOpen(false);
        } catch (error) {
            console.error('Error deleting menu item:', error);
            alert(t('error_deleting_menu'));
        }
    };

    const applyDiscount = () => {
        const discount = parseFloat(discountValue);
        if (isNaN(discount) || discount <= 0 || discount >= 100) {
            alert(t('invalid_discount'));
            return;
        }

        const discountedItems = menuItems.map(item => ({
            ...item,
            price: (item.price - (item.price * (discount / 100))).toFixed(2)
        }));

        setMenuItems(discountedItems);
        alert(t('discount_applied', { discount }));
    };

    if (loading) return <p>{t('loading')}</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('menu_list')}</h1>

            <div className="mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <input
                        type="number"
                        placeholder={t('discount_percent')}
                        className="border p-2 rounded text-sm"
                        value={discountValue}
                        onChange={(e) => setDiscountValue(e.target.value)}
                    />
                    <button
                        onClick={applyDiscount}
                        className="bg-blue-500 text-white px-3 py-2 rounded hover:bg-blue-600 text-sm"
                    >
                        {t('apply_discount')}
                    </button>
                </div>
                <select
                    className="border p-2 rounded text-sm w-full sm:w-auto"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="all">{t('all_categories')}</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                    ))}
                </select>
            </div>

            {/* Mobile Card View */}
            <div className="block md:hidden space-y-3">
                {menuItems
                    .filter(item => selectedCategory === 'all' || String(item.category) === String(selectedCategory))
                    .map((item) => (
                        <div key={item.id} className="bg-white border rounded-lg p-4 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900 text-sm">{item.name}</h3>
                                    <p className="text-xs text-gray-600">ID: {item.id}</p>
                                </div>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {item.is_available ? t('yes') : t('no')}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                                <div>
                                    <span className="text-gray-500">Price:</span>
                                    <p className="font-medium">ETB {item.price}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Type:</span>
                                    <p className="font-medium capitalize">{item.item_type}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Created:</span>
                                    <p className="font-medium">{renderDate(item.created_at)}</p>
                                </div>
                                <div>
                                    <span className="text-gray-500">Updated:</span>
                                    <p className="font-medium">{renderDate(item.updated_at)}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleEdit(item)}
                                    className="flex-1 bg-yellow-500 text-white px-3 py-2 rounded text-xs hover:bg-yellow-600"
                                >
                                    {t('edit')}
                                </button>
                                <button
                                    onClick={() => handleDelete(item)}
                                    className="flex-1 bg-red-500 text-white px-3 py-2 rounded text-xs hover:bg-red-600"
                                >
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto border rounded-lg">
                <table className="min-w-full bg-white border-collapse">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="p-2 border text-sm">{t('id')}</th>
                            <th className="p-2 border text-sm">{t('name')}</th>
                            <th className="p-2 border text-sm">{t('price')}</th>
                            <th className="p-2 border text-sm">{t('available')}</th>
                            <th className="p-2 border text-sm">{t('item_type')}</th>
                            <th className="p-2 border text-sm">{t('created_at')}</th>
                            <th className="p-2 border text-sm">{t('updated_at')}</th>
                            <th className="p-2 border text-sm">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {menuItems
                            .filter(item => selectedCategory === 'all' || String(item.category) === String(selectedCategory))
                            .map((item) => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-2 border text-center text-sm">{item.id}</td>
                                    <td className="p-2 border text-center text-sm">{item.name}</td>
                                    <td className="p-2 border text-center text-sm">{item.price}</td>
                                    <td className="p-2 border text-center text-sm">{item.is_available ? t('yes') : t('no')}</td>
                                    <td className="p-2 border text-center text-sm">{item.item_type}</td>
                                    <td className="p-2 border text-center text-sm">{renderDate(item.created_at)}</td>
                                    <td className="p-2 border text-center text-sm">{renderDate(item.updated_at)}</td>
                                    <td className="p-2 border text-center">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleEdit(item)}
                                                className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600 text-sm"
                                            >
                                                {t('edit')}
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item)}
                                                className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 text-sm"
                                            >
                                                {t('delete')}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-bold mb-4">{t('edit_menu_item')}</h2>
                        <label className="block mb-2 font-semibold">{t('name')}</label>
                        <input
                            type="text"
                            className="border p-2 w-full rounded mb-4"
                            value={selectedItem.name}
                            onChange={(e) => setSelectedItem({ ...selectedItem, name: e.target.value })}
                        />
                        <label className="block mb-2 font-semibold">{t('price')}</label>
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
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                                {t('save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-bold mb-4 text-center">{t('confirm_delete')}</h2>
                        <p className="mb-4 text-center">
                            {t('confirm_delete_text', { name: selectedItem.name })}
                        </p>
                        <div className="flex justify-center space-x-4">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                            >
                                {t('cancel')}
                            </button>
                            <button
                                onClick={handleConfirmDelete}
                                className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                            >
                                {t('delete')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuTable;
