import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchMenuItems, updateMenuItem, deleteMenuItem } from '../../api/menu';
import axiosInstance from '../../api/axiosInstance';
import { format } from 'date-fns';
import { FaEdit, FaTrash, FaEye, FaUtensils, FaTag, FaClock, FaDollarSign } from 'react-icons/fa';

const MenuTable = ({ refreshFlag, onEdit, onDelete, loading, searchTerm = '' }) => {
    const { t } = useTranslation();
    const [menuItems, setMenuItems] = useState([]);
    const [error, setError] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [discountValue, setDiscountValue] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    console.log('🔄 MenuTable rendered with props:', { refreshFlag, loading, searchTerm });

    // Handle window resize for responsive design
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const loadMenuItems = async () => {
        try {
            console.log('🔄 Loading menu items...');
            const data = await fetchMenuItems();
            console.log('✅ Menu items loaded:', data);
            setMenuItems(data);
        } catch (err) {
            console.error('❌ Error fetching menu items:', err);
            console.error('❌ Error response:', err.response?.data);
            console.error('❌ Error status:', err.response?.status);
            setError(t('error_loading_menu'));
        }
    };

    const loadCategories = async () => {
        try {
            console.log('🔄 Loading categories...');
            const res = await axiosInstance.get('/inventory/categories/');
            console.log('✅ Categories loaded:', res.data);
            setCategories(res.data);
        } catch (err) {
            console.error('❌ Error fetching categories:', err);
            console.error('❌ Error response:', err.response?.data);
            console.error('❌ Error status:', err.response?.status);
        }
    };

    useEffect(() => {
        console.log('🔄 MenuTable useEffect - loading menu items and categories');
        loadMenuItems();
        loadCategories();
    }, []);

    useEffect(() => {
        console.log('🔄 MenuTable useEffect - refreshFlag changed, reloading menu items');
        loadMenuItems();
    }, [refreshFlag]);

    // Filter menu items based on search term and category
    const filteredMenuItems = useMemo(() => {
        let filtered = menuItems;
        
        if (searchTerm) {
            filtered = filtered.filter(item => 
                item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.category?.category_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        if (selectedCategory !== 'all') {
            filtered = filtered.filter(item => item.category?.id === parseInt(selectedCategory));
        }
        
        return filtered;
    }, [menuItems, searchTerm, selectedCategory]);

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
        setDiscountValue('');
    };

    // Render menu item card for mobile view
    const renderMenuItemCard = (item) => (
        <div key={item.id} className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-orange-500">
            <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-orange-600">ETB {item.price}</p>
                    <p className="text-sm text-gray-500">{item.category?.category_name || 'N/A'}</p>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm text-gray-700 mb-4">
                <div className="flex items-center">
                    <FaTag className="mr-2 text-orange-500" />
                    <span>{item.category?.category_name || 'N/A'}</span>
                </div>
                <div className="flex items-center">
                    <FaClock className="mr-2 text-orange-500" />
                    <span>{renderDate(item.created_at)}</span>
                </div>
            </div>
            
            <div className="flex space-x-2">
                <button 
                    onClick={() => handleEdit(item)} 
                    className="flex-1 bg-blue-500 text-white p-2 rounded text-sm flex items-center justify-center hover:bg-blue-600"
                >
                    <FaEdit className="mr-1" /> {t('edit')}
                </button>
                <button 
                    onClick={() => handleDelete(item)} 
                    className="flex-1 bg-red-500 text-white p-2 rounded text-sm flex items-center justify-center hover:bg-red-600"
                >
                    <FaTrash className="mr-1" /> {t('delete')}
                </button>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-red-700">{error}</p>
                    </div>
                </div>
            </div>
        );
    }

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
            {isEditModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">{t('edit_menu_item')}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('name')}</label>
                                <input
                                    type="text"
                                    value={selectedItem.name || ''}
                                    onChange={(e) => setSelectedItem({...selectedItem, name: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
                                <textarea
                                    value={selectedItem.description || ''}
                                    onChange={(e) => setSelectedItem({...selectedItem, description: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('price')}</label>
                                <input
                                    type="number"
                                    value={selectedItem.price || ''}
                                    onChange={(e) => setSelectedItem({...selectedItem, price: e.target.value})}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    step="0.01"
                                    min="0"
                                />
                            </div>
                            <div className="flex justify-end space-x-2 pt-4">
                                <button
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleSaveEdit}
                                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                                >
                                    {t('save')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && selectedItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white p-6 rounded-xl shadow-lg max-w-md w-full">
                        <div className="text-center">
                            <FaTrash className="mx-auto h-12 w-12 text-red-500 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {t('confirm_delete')}
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                {t('delete_menu_item_confirmation')} <strong>{selectedItem.name}</strong>?
                            </p>
                            <div className="flex justify-center space-x-3">
                                <button
                                    onClick={() => setIsDeleteModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                                >
                                    {t('cancel')}
                                </button>
                                <button
                                    onClick={handleConfirmDelete}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                >
                                    {t('delete')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MenuTable;
