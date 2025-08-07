import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';
import { useAuth } from '../../../context/AuthContext';
import { 
  Users, 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Coffee,
  Utensils
} from 'lucide-react';

const getTableStatus = (table, orders) => {
  // Find all orders for this table (matching by table.number)
  const tableOrders = orders.filter(order => order.table_number === table.number);
  if (tableOrders.length === 0) return 'available';

  // Sort by created_at descending to get latest order
  tableOrders.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  const latestOrder = tableOrders[0];

  if (latestOrder.has_payment) return 'available';
  if (latestOrder.cashier_status === 'printed') return 'ready_to_pay';
  return 'ordering';
};

const TablesPage = ({ onSelectTable }) => {
  const [tables, setTables] = useState([]);
  const [filteredTables, setFilteredTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState(4); // Default seats for new table
  const [activeFilter, setActiveFilter] = useState('all'); // 'all', 'available', 'occupied', 'ready_to_pay'
  
  // Get current user from auth context
  const { user } = useAuth();

  // Filter tables based on active filter
  const filterTables = (tablesToFilter, filter) => {
    if (filter === 'all') return tablesToFilter;
    return tablesToFilter.filter(table => {
      const status = getTableStatus(table, orders);
      return status === filter;
    });
  };

  // Apply filters and update filtered tables
  const applyFilters = (tablesToFilter, filter = activeFilter) => {
    const filtered = filterTables(tablesToFilter, filter);
    setFilteredTables(filtered);
  };

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      const tablesData = response.data;
      setTables(tablesData);
      applyFilters(tablesData);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setTables([]);
      setFilteredTables([]);
      setError('Failed to fetch tables.');
    }
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    applyFilters(tables, filter);
  };

  // Fetch orders from API with user-specific filtering
  const fetchOrders = async () => {
    try {
      // Ensure user is authenticated before fetching orders
      if (!user || !user.isAuthenticated) {
        console.warn('[DEBUG] TablesPage: User not authenticated, cannot fetch orders');
        setOrders([]);
        return;
      }
      
      console.log(`[DEBUG] TablesPage: Fetching orders for user ${user.username}`);
      const data = await getMyOrders();
      
      // Backend now properly filters by user, so no need for client-side filtering
      console.log(`[DEBUG] TablesPage: Received ${data.length} orders from backend for user ${user.username}`);
      setOrders(data);
      
      // Re-apply filters when orders are updated
      if (tables.length > 0) {
        applyFilters(tables);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setOrders([]);
      setError('Failed to fetch orders.');
    }
  };

  // Fetch tables and orders on component mount
  useEffect(() => {
    fetchTables();
    fetchOrders();
    
    // Set up refresh interval (every 30 seconds)
    const intervalId = setInterval(() => {
      fetchTables();
      fetchOrders();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // Handle adding a new table, auto-increment table number
  const handleAddTable = async () => {
    setLoading(true);
    setError('');
    try {
      // Calculate next table number by highest existing number + 1
      const maxNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) : 0;
      const nextNumber = maxNumber + 1;

      await axiosInstance.post('/branches/tables/', {
        number: nextNumber,
        seats: seats,
        status: 'available',
      });

      await fetchTables(); // Refresh tables after adding
    } catch (err) {
      console.error('Failed to add table:', err);
      setError('Failed to add table.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusStats = () => {
    // Get today's date for daily analytics
    const today = new Date().toISOString().split('T')[0];
    
    // Filter orders to only today's orders for the logged-in user
    const todaysOrders = orders.filter(order => {
      if (!order.order_number) return false;
      
      // Check if order is from today
      const orderDate = new Date(order.created_at).toISOString().split('T')[0];
      return orderDate === today;
    });
    
    // Calculate table statuses based on TODAY'S orders only
    const available = tables.filter(table => getTableStatus(table, todaysOrders) === 'available').length;
    const occupied = tables.filter(table => getTableStatus(table, todaysOrders) === 'ordering').length;
    const readyToPay = tables.filter(table => getTableStatus(table, todaysOrders) === 'ready_to_pay').length;
    
    console.log(`[DEBUG] Daily Table Analytics for ${user?.username}: Today=${today}, Available=${available}, Occupied=${occupied}, ReadyToPay=${readyToPay}`);
    
    return { available, occupied, readyToPay };
  };

  const stats = getStatusStats();

  return (
    <div className="animate-fade-in pb-20 sm:pb-6">
      {/* User Identity Header */}
      {user && user.username && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-center space-x-3">
            <div className="bg-indigo-100 p-2 rounded-full">
              <Users className="w-5 h-5 text-indigo-600" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-indigo-800">
                🍽️ {user.first_name || user.username}'s Tables
              </h2>
              <p className="text-sm text-indigo-600">
                Managing tables and orders assigned to you
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium">Available Tables</p>
              <p className="text-3xl font-bold text-green-800">{stats.available}</p>
              <p className="text-xs text-green-600 mt-1">📅 Ready for today's customers</p>
            </div>
            <div className="bg-green-500 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium">Today's Occupied Tables</p>
              <p className="text-3xl font-bold text-orange-800">{stats.occupied}</p>
              <p className="text-xs text-orange-600 mt-1">🍽️ Customers dining today</p>
            </div>
            <div className="bg-orange-500 p-3 rounded-full">
              <Coffee className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200 shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium">Today's Ready to Pay</p>
              <p className="text-3xl font-bold text-blue-800">{stats.readyToPay}</p>
              <p className="text-xs text-blue-600 mt-1">💳 Waiting for payment today</p>
            </div>
            <div className="bg-blue-500 p-3 rounded-full">
              <Clock className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => handleFilterChange('all')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeFilter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          All Tables
        </button>
        <button
          onClick={() => handleFilterChange('available')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeFilter === 'available'
              ? 'bg-green-600 text-white'
              : 'bg-white text-green-700 hover:bg-green-50 border border-green-200'
          }`}
        >
          Available ({stats.available})
        </button>
        <button
          onClick={() => handleFilterChange('ordering')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeFilter === 'ordering'
              ? 'bg-orange-600 text-white'
              : 'bg-white text-orange-700 hover:bg-orange-50 border border-orange-200'
          }`}
        >
          Ordering ({stats.occupied})
        </button>
        <button
          onClick={() => handleFilterChange('ready_to_pay')}
          className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
            activeFilter === 'ready_to_pay'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
          }`}
        >
          Ready to Pay ({stats.readyToPay})
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={() => { fetchTables(); fetchOrders(); }}
          disabled={loading}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-white hover:bg-gray-50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-lg shadow-sm border border-gray-200 transition-all duration-200 active:scale-95 disabled:opacity-50 touch-manipulation min-h-[36px] sm:min-h-[40px]"
          aria-label="Refresh tables"
        >
          <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600 ${loading ? 'animate-spin' : ''} flex-shrink-0`} />
          <span className="font-medium text-gray-700 text-xs sm:text-sm truncate">
            {loading ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>

        <button
          onClick={handleAddTable}
          disabled={loading}
          className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-lg shadow-sm transition-all duration-200 active:scale-95 disabled:opacity-50 touch-manipulation min-h-[36px] sm:min-h-[40px]"
          aria-label="Add new table"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0 text-white" />
          <span className="font-medium text-white text-xs sm:text-sm truncate">
            {loading ? 'Adding...' : 'Add Table'}
          </span>
        </button>
      </div>

      {/* Instructions for users */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <div className="flex items-start space-x-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Utensils className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-800 mb-2">How to Use Tables:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Green tables</strong> are available - click to start taking orders</li>
              <li>• <strong>Orange tables</strong> have customers - orders are being prepared</li>
              <li>• <strong>Blue tables</strong> are ready for payment - help customers pay</li>
              <li>• Click "Add New Table" if you need more tables in the restaurant</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-6 h-6 text-red-600" />
            <div>
              <h3 className="font-semibold text-red-800">Oops! Something went wrong</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
              <button
                onClick={() => { setError(''); fetchTables(); fetchOrders(); }}
                className="mt-2 text-sm bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tables Grid with Better Spacing */}
      {filteredTables.length === 0 ? (
        <div className="text-center py-8 sm:py-12 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Users className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-1 sm:mb-2">No Tables Yet</h3>
          <p className="text-sm sm:text-base text-gray-500 mb-4 sm:mb-6">Get started by adding your first table</p>
          <button
            onClick={handleAddTable}
            disabled={loading}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg sm:rounded-xl shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center mx-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 inline mr-1.5 sm:mr-2" />
            <span className="text-sm sm:text-base">Add Your First Table</span>
          </button>
        </div>
      ) : (
        // Responsive grid with better spacing for all devices
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 p-2 sm:p-3">
          {filteredTables
            .sort((a, b) => a.number - b.number)
            .map((table) => (
              <div key={table.id} className="animate-slide-in-up flex">
                <TableCard
                  table={{ ...table, status: getTableStatus(table, orders) }}
                  onClick={() => onSelectTable(table)}
                  className="w-full"
                />
              </div>
            ))}
        </div>
      )}

      {/* Floating Table Counter - Improved for mobile */}
      <div className="fixed bottom-16 sm:bottom-6 right-4 z-40">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 px-3 py-2 flex items-center space-x-2">
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse flex-shrink-0"></div>
          <span className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
            {filteredTables.length} of {tables.length} table{tables.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>
    </div>
  );
};

export default TablesPage;
