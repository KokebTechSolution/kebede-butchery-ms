// src/pages/MenuManagement/MenuManagerPage.jsx

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { deleteMenuItem } from '../../api/menu';
import MenuForm from './MenuForm';
import MenuTable from './MenuTable';

const MenuManagerPage = () => {
    const { t } = useTranslation();
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0);

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
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">{t('menu_management')}</h1>

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

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
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
