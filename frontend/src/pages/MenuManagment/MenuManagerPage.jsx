// src/pages/MenuManagement/MenuManagerPage.jsx

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteMenuItem } from '../../api/menu';
import MenuForm from './MenuForm';
import MenuTable from './MenuTable';
import { FaSearch, FaTimes, FaPlus, FaUtensils } from 'react-icons/fa';

const MenuManagerPage = () => {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    // Set loading to false when component mounts
    useEffect(() => {
        console.log('🔄 MenuManagerPage mounted, setting loading to false');
        setLoading(false);
    }, []);

    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm(t('confirm_delete_menu_item'))) {
            try {
                await deleteMenuItem(id);
                alert(t('menu_item_deleted_success'));
                setRefreshFlag(prev => prev + 1);
            } catch (error) {
                console.error('Error deleting menu item:', error);
                alert(t('error_deleting_menu_item'));
            }
        }
    };

    const handleCloseModal = () => {
        setSelectedItem(null);
        setIsModalOpen(false);
    };

    const handleFormSubmit = () => {
        setRefreshFlag(prev => prev + 1);
        handleCloseModal();
    };

    return (
        <div className="p-3 sm:p-6 bg-gradient-to-br from-orange-50 to-red-100 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                            <FaUtensils className="mr-3 text-orange-600" />
                            {t('menu_management')}
                        </h1>
                        <p className="text-gray-600 text-sm mt-1">
                            {t('manage_your_menu_items')}
                        </p>
                    </div>
                    
                    {/* Search and Add Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        {/* Search Bar */}
                        <div className="relative flex-grow max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FaSearch className="text-gray-400" />
                            </div>
                            <input
                                type="text"
                                placeholder={t('search_menu_items')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                aria-label={t('search_menu_items')}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    aria-label={t('clear_search')}
                                >
                                    <FaTimes className="text-gray-400 hover:text-gray-600" />
                                </button>
                            )}
                        </div>
                        
                        {/* Add New Button */}
                        <button
                            onClick={handleAddNew}
                            className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors duration-200 shadow-lg hover:shadow-xl"
                        >
                            <FaPlus className="text-sm" />
                            {t('add_new_menu_item')}
                        </button>
                    </div>
                </div>

                {/* Menu Table Component */}
                <MenuTable 
                    refreshFlag={refreshFlag}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    loading={loading}
                    searchTerm={searchTerm}
                />

                {/* Add/Edit Modal */}
                {isModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">
                                    {selectedItem ? t('edit_menu_item') : t('add_new_menu_item')}
                                </h2>
                                <button 
                                    onClick={handleCloseModal} 
                                    className="text-gray-400 hover:text-gray-600 text-xl font-bold"
                                    aria-label="Close modal"
                                >
                                    ✕
                                </button>
                            </div>
                            <MenuForm
                                refreshMenu={handleFormSubmit}
                                selectedItem={selectedItem}
                                clearSelection={handleCloseModal}
                                closeModal={handleCloseModal}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MenuManagerPage;
