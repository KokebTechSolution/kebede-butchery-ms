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

            <div className="mb-4 flex space-x-2 items-center">
                <input
                    type="number"
                    placeholder={t('discount_percent')}
                    className="border p-2 rounded"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                />
                <button
                    onClick={applyDiscount}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    {t('apply_discount')}
                </button>
                <select
                    className="border p-2 rounded ml-4"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="all">{t('all_categories')}</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.category_name}</option>
                    ))}
                </select>
            </div>

            <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">{t('id')}</th>
                        <th className="p-2 border">{t('name')}</th>
                        <th className="p-2 border">{t('price')}</th>
                        <th className="p-2 border">{t('available')}</th>
                        <th className="p-2 border">{t('item_type')}</th>
                        <th className="p-2 border">{t('created_at')}</th>
                        <th className="p-2 border">{t('updated_at')}</th>
                        <th className="p-2 border">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {menuItems
                        .filter(item => selectedCategory === 'all' || String(item.category) === String(selectedCategory))
                        .map((item) => (
                            <tr key={item.id} className="hover:bg-gray-50">
                                <td className="p-2 border text-center">{item.id}</td>
                                <td className="p-2 border text-center">{item.name}</td>
                                <td className="p-2 border text-center">{item.price}</td>
                                <td className="p-2 border text-center">{item.is_available ? t('yes') : t('no')}</td>
                                <td className="p-2 border text-center">{item.item_type}</td>
                                <td className="p-2 border text-center">{renderDate(item.created_at)}</td>
                                <td className="p-2 border text-center">{renderDate(item.updated_at)}</td>
                                <td className="p-2 border text-center space-x-2">
                                    <button
                                        onClick={() => handleEdit(item)}
                                        className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                                    >
                                        {t('edit')}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item)}
                                        className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                    >
                                        {t('delete')}
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
