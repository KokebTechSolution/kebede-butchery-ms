// src/pages/MenuManagement/MenuManagerPage.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteMenuItem } from '../../api/menu';
import MenuForm from './MenuForm';
import MenuTable from './MenuTable';
import CategoryManager from './CategoryManager';

const MenuManagerPage = () => {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'categories'

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

    const handleCategoryChange = () => {
        // Refresh menu items when categories change
        setRefreshFlag(prev => prev + 1);
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">{t('menu_management')}</h1>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    onClick={() => setActiveTab('menu')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                        activeTab === 'menu'
                            ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                    🍽️ Menu Items
                </button>
                <button
                    onClick={() => setActiveTab('categories')}
                    className={`px-4 py-2 font-medium text-sm rounded-t-lg transition-colors ${
                        activeTab === 'categories'
                            ? 'bg-blue-600 text-white border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                >
                    📂 Category Management
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'menu' && (
                <>
                    <div className="mb-4">
                        <button
                            onClick={handleAddNew}
                            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                            {t('add_new_menu_item')}
                        </button>
                    </div>

                    <MenuTable
                        refreshFlag={refreshFlag}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        loading={loading}
                    />
                </>
            )}

            {activeTab === 'categories' && (
                <CategoryManager onCategoryChange={handleCategoryChange} />
            )}

            {/* Menu Form Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96 max-h-[90vh] overflow-y-auto">
                        <h2 className="text-xl font-bold mb-4">
                            {selectedItem ? t('edit_menu_item') : t('add_new_menu_item')}
                        </h2>
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
    );
};

export default MenuManagerPage;
