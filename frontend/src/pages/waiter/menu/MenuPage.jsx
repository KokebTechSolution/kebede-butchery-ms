import React, { useState, useEffect } from 'react';
import { MdArrowBack, MdTableRestaurant, MdRestaurant, MdLocalDrink, MdSearch, MdFilterList, MdShoppingCart } from 'react-icons/md';
import MenuItem from '../../../components/MenuItem/MenuItem';
import { useCart } from '../../../context/CartContext';
import { fetchMenuItems } from '../../../api/menu';
import './MenuPage.css';

const MenuPage = ({ table, onBack, editingOrderId, onOrder }) => {
    const [menuItems, setMenuItems] = useState([]);
    const [activeTab, setActiveTab] = useState('food');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isLoading, setIsLoading] = useState(true);
    const { setActiveTable, cartItems, orders, clearCart } = useCart();

    useEffect(() => {
        if (table && table.id) {
            setActiveTable(table.id);
        }
    }, [table, setActiveTable]);

    useEffect(() => {
        const loadMenuItems = async () => {
            try {
                setIsLoading(true);
                const items = await fetchMenuItems();
                setMenuItems(items);
            } catch (error) {
                console.error('❌ Error loading menu items:', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadMenuItems();
    }, []);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-lg text-gray-600">Loading delicious menu items...</p>
            </div>
        );
    }

    if (!menuItems || menuItems.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                <div className="text-6xl">🍽️</div>
                <h3 className="text-xl font-semibold text-gray-900">No menu items available</h3>
                <p className="text-gray-600 text-center">Please check back later or contact management</p>
            </div>
        );
    }

    // Group items by type and then by category
    const groupByCategory = (items) => {
        const grouped = {};
        items.forEach(item => {
            if (!grouped[item.category_name]) grouped[item.category_name] = [];
            grouped[item.category_name].push(item);
        });
        return grouped;
    };

    const foodItems = menuItems.filter(item => item.item_type === 'food' && item.is_available);
    const beverageItems = menuItems.filter(item => item.item_type === 'beverage' && item.is_available);
    const foodByCategory = groupByCategory(foodItems);
    const beverageByCategory = groupByCategory(beverageItems);

    // Filter previous orders for this table
    const previousOrders = orders.filter(order => order.table_number === table?.id);
    const latestOrder = previousOrders.length > 0 ? [...previousOrders].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] : null;
    const isPaid = latestOrder && latestOrder.has_payment;

    // Get unique categories for filtering
    const allCategories = ['all', ...new Set(menuItems.map(item => item.category_name))];

    // Filter items based on search and category
    const filterItems = (items) => {
        return items.filter(item => {
            const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                item.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || item.category_name === selectedCategory;
            return matchesSearch && matchesCategory;
        });
    };

    const filteredFoodItems = filterItems(foodItems);
    const filteredBeverageItems = filterItems(beverageItems);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Enhanced Header Section - Mobile Optimized */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 sm:p-6 border border-blue-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                        <button 
                            onClick={onBack}
                            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors border border-blue-200 text-sm sm:text-base"
                        >
                            <MdArrowBack size={18} className="sm:w-5 sm:h-5" />
                            <span className="font-medium hidden sm:inline">Back to Tables</span>
                            <span className="font-medium sm:hidden">Back</span>
                        </button>
                        
                        <div className="flex items-center gap-2 sm:gap-3">
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                                <MdTableRestaurant size={20} className="text-white sm:w-6 sm:h-6" />
                            </div>
                            <div>
                                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Table {table?.number}</h1>
                                <p className="text-sm sm:text-base text-blue-600 font-medium">Ready to take orders</p>
                            </div>
                        </div>
                    </div>

                    {isPaid && (
                        <div className="bg-green-100 border border-green-200 rounded-lg px-3 sm:px-4 py-2 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2">
                                <span className="text-xl sm:text-2xl">💰</span>
                                <div>
                                    <p className="text-green-800 font-semibold text-sm sm:text-base">Table Paid</p>
                                    <p className="text-green-600 text-xs sm:text-sm">No new orders needed</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Enhanced Search and Filter Section - Mobile Optimized */}
            <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1 relative">
                        <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <input
                            type="text"
                            placeholder="Search for delicious items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 sm:pl-10 pr-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
                        />
                    </div>
                    
                    <div className="relative">
                        <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="pl-9 sm:pl-10 pr-8 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm sm:text-base"
                        >
                            {allCategories.map(category => (
                                <option key={category} value={category}>
                                    {category === 'all' ? 'All Categories' : category}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Enhanced Tab Navigation - Mobile Optimized */}
            <div className="bg-white rounded-xl p-2 border border-gray-200 shadow-sm">
                <div className="flex gap-2">
                    <button
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                            activeTab === 'food' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('food')}
                    >
                        <MdRestaurant size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Food Menu</span>
                        <span className="sm:hidden">Food</span>
                        <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                            {filteredFoodItems.length}
                        </span>
                    </button>
                    <button
                        className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 text-sm sm:text-base ${
                            activeTab === 'beverage' 
                                ? 'bg-blue-600 text-white shadow-md' 
                                : 'text-gray-600 hover:bg-gray-50'
                        }`}
                        onClick={() => setActiveTab('beverage')}
                    >
                        <MdLocalDrink size={18} className="sm:w-5 sm:h-5" />
                        <span className="hidden sm:inline">Beverages</span>
                        <span className="sm:hidden">Drinks</span>
                        <span className="bg-white/20 px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-bold">
                            {filteredBeverageItems.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* Enhanced Menu Content - Mobile Optimized */}
            <div className="space-y-4 sm:space-y-6">
                {activeTab === 'food' && (
                    <div>
                        {Object.keys(foodByCategory).length > 0 ? (
                            Object.keys(foodByCategory).map(category => {
                                const categoryItems = filterItems(foodByCategory[category]);
                                if (categoryItems.length === 0) return null;
                                
                                return (
                                    <div key={category} className="mb-6 sm:mb-8">
                                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm mb-3 sm:mb-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{category}</h3>
                                                <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                                    {categoryItems.length} items
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                            {categoryItems.map(item => (
                                                <MenuItem key={item.id} item={item} disabled={isPaid} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <div className="text-4xl sm:text-6xl mb-4">🍽️</div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No food items found</h3>
                                <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or category filter</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'beverage' && (
                    <div>
                        {Object.keys(beverageByCategory).length > 0 ? (
                            Object.keys(beverageByCategory).map(category => {
                                const categoryItems = filterItems(beverageByCategory[category]);
                                if (categoryItems.length === 0) return null;
                                
                                return (
                                    <div key={category} className="mb-6 sm:mb-8">
                                        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm mb-3 sm:mb-4">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-lg sm:text-xl font-bold text-gray-900">{category}</h3>
                                                <span className="bg-blue-100 text-blue-800 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium">
                                                    {categoryItems.length} items
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                                            {categoryItems.map(item => (
                                                <MenuItem key={item.id} item={item} disabled={isPaid} />
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-8 sm:py-12">
                                <div className="text-4xl sm:text-6xl mb-4">🥤</div>
                                <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No beverage items found</h3>
                                <p className="text-sm sm:text-base text-gray-600">Try adjusting your search or category filter</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Enhanced Quick Stats - Mobile Optimized */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm text-center">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl mx-auto mb-2 sm:mb-3">
                        <MdShoppingCart size={20} className="text-blue-600 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{cartItems.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Items in Cart</div>
                </div>
                
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm text-center">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl mx-auto mb-2 sm:mb-3">
                        <MdRestaurant size={20} className="text-green-600 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{filteredFoodItems.length + filteredBeverageItems.length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Available Items</div>
                </div>
                
                <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200 shadow-sm text-center">
                    <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl mx-auto mb-2 sm:mb-3">
                        <MdFilterList size={20} className="text-purple-600 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-lg sm:text-2xl font-bold text-gray-900">{Object.keys(foodByCategory).length + Object.keys(beverageByCategory).length}</div>
                    <div className="text-xs sm:text-sm text-gray-600">Categories</div>
                </div>
            </div>
        </div>
    );
};

export default MenuPage;
