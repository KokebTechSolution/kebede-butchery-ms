// src/pages/MenuManagement/MenuManagerPage.jsx

import React, { useState, useEffect } from 'react';
import { fetchMenus, deleteMenuItem } from '../../api/menu';
import MenuForm from './MenuForm';
import MenuTable from './MenuTable';

const MenuManagerPage = () => {
    const [menuItems, setMenuItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [refreshFlag, setRefreshFlag] = useState(0); // 🔥 Added refresh flag

    // Fetch menu items
    const loadMenu = async () => {
        try {
            const menus = await fetchMenus();
            const allItems = menus.flatMap(menu => menu.items);
            setMenuItems(allItems);
        } catch (error) {
            console.error('Error loading menu:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMenu();
    }, []);

    // Open modal for editing
    const handleEdit = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    // Open modal for adding
    const handleAddNew = () => {
        setSelectedItem(null);
        setIsModalOpen(true);
    };

    // Delete menu item
    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this menu item?')) {
            try {
                await deleteMenuItem(id);
                alert('Menu item deleted successfully!');
                setRefreshFlag(prev => prev + 1); // Trigger refresh
            } catch (error) {
                console.error('Error deleting menu item:', error);
                alert('Error deleting menu item.');
            }
        }
    };

    // Close modal and reset form
    const handleCloseModal = () => {
        setSelectedItem(null);
        setIsModalOpen(false);
    };

    // When form is submitted: close modal and refresh table
    const handleFormSubmit = () => {
        setRefreshFlag(prev => prev + 1); // Trigger refresh
        handleCloseModal();
    };

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-4">Menu Management</h1>

            <div className="mb-4">
                <button
                    onClick={handleAddNew}
                    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                >
                    Add New Menu Item
                </button>
            </div>

            <MenuTable
                refreshFlag={refreshFlag} // Pass the refresh flag 🚀
                onEdit={handleEdit}
                onDelete={handleDelete}
                loading={loading}
            />

            {/* Modal Popup */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded shadow-md w-96">
                        <h2 className="text-xl font-bold mb-4">
                            {selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}
                        </h2>
                        <MenuForm
                            refreshMenu={handleFormSubmit} // Trigger refresh on form submit
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
