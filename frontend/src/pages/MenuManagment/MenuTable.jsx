import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMenuItems, updateMenuItem, deleteMenuItem } from '../../api/menu';
import { format } from 'date-fns';

const MenuTable = ({ refreshFlag, onEdit, onDelete, loading: parentLoading }) => {
    const { t } = useTranslation();
    const [menuItems, setMenuItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('all');

    const loadMenuItems = useCallback(async () => {
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
    }, [t]);

    useEffect(() => {
        loadMenuItems();
    }, [loadMenuItems]);

    useEffect(() => {
        if (parentLoading) {
            loadMenuItems();
        }
    }, [parentLoading, loadMenuItems]);

    const renderDate = (dateString) => {
        if (!dateString) return t('not_available');
        const date = new Date(dateString);
        if (isNaN(date)) return t('invalid_date');
        return format(date, 'PPpp');
    };

    const handleToggleAvailability = async (item) => {
        try {
            const updatedItem = { ...item, is_available: !item.is_available };
            await updateMenuItem(item.id, updatedItem);
            setMenuItems(menuItems.map(m => (m.id === item.id ? updatedItem : m)));
        } catch (error) {
            console.error('Error updating menu item:', error);
            alert(t('error_updating_menu'));
        }
    };

    const handleConfirmDelete = async (item) => {
        if (window.confirm(t('confirm_delete_menu_item'))) {
            try {
                await deleteMenuItem(item.id);
                setMenuItems(menuItems.filter(m => m.id !== item.id));
                alert(t('menu_item_deleted'));
            } catch (error) {
                console.error('Error deleting menu item:', error);
                alert(t('error_deleting_menu'));
            }
        }
    };

    if (loading || parentLoading) return <p>{t('loading')}</p>;
    if (error) return <p className="text-red-500">{error}</p>;

    // Get unique categories for filtering
    const categories = [...new Set(menuItems.map(item => item.category_name))].filter(Boolean);

    // Filter items by category
    const filteredItems = selectedCategory === 'all' 
        ? menuItems 
        : menuItems.filter(item => item.category_name === selectedCategory);

    return (
        <div className="overflow-x-auto">
            <div className="mb-4 flex space-x-2 items-center">
                <select
                    className="border p-2 rounded"
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                >
                    <option value="all">{t('all_categories')}</option>
                    {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                    ))}
                </select>
            </div>

            <table className="min-w-full bg-white border border-gray-200 rounded-xl">
                <thead>
                    <tr className="bg-gray-100">
                        <th className="p-2 border">{t('id')}</th>
                        <th className="p-2 border">{t('name')}</th>
                        <th className="p-2 border">{t('description')}</th>
                        <th className="p-2 border">{t('price')}</th>
                        <th className="p-2 border">{t('category')}</th>
                        <th className="p-2 border">{t('item_type')}</th>
                        <th className="p-2 border">{t('available')}</th>
                        <th className="p-2 border">{t('created_at')}</th>
                        <th className="p-2 border">{t('actions')}</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="p-2 border text-center">{item.id}</td>
                            <td className="p-2 border text-center">{item.name}</td>
                            <td className="p-2 border text-center max-w-xs truncate">
                                {item.description || '-'}
                            </td>
                            <td className="p-2 border text-center">${item.price}</td>
                            <td className="p-2 border text-center">{item.category_name}</td>
                            <td className="p-2 border text-center capitalize">{item.item_type}</td>
                            <td className="p-2 border text-center">
                                <button
                                    onClick={() => handleToggleAvailability(item)}
                                    className={`px-2 py-1 rounded text-sm font-medium ${
                                        item.is_available
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}
                                >
                                    {item.is_available ? t('yes') : t('no')}
                                </button>
                            </td>
                            <td className="p-2 border text-center">{renderDate(item.created_at)}</td>
                            <td className="p-2 border text-center space-x-2">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="bg-yellow-500 text-white px-2 py-1 rounded hover:bg-yellow-600"
                                >
                                    {t('edit')}
                                </button>
                                <button
                                    onClick={() => handleConfirmDelete(item)}
                                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                                >
                                    {t('delete')}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {filteredItems.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                    {selectedCategory === 'all' 
                        ? t('no_menu_items_found') 
                        : t('no_items_in_category')}
                </div>
            )}
        </div>
    );
};

export default MenuTable;
