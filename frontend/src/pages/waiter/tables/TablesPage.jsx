import React, { useState, useEffect } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';
import axiosInstance from '../../../api/axiosInstance';
import { getMyOrders } from '../../../api/cashier';
import { 
  Plus, 
  RefreshCw, 
  AlertCircle, 
  Users, 
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

const getStatusColor = (status) => {
  switch (status) {
    case 'available':
      return 'bg-green-100 text-green-800 border-green-200';
    case 'ordering':
      return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'ready_to_pay':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getStatusIcon = (status) => {
  switch (status) {
    case 'available':
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    case 'ordering':
      return <Clock className="w-4 h-4 text-orange-600" />;
    case 'ready_to_pay':
      return <TrendingUp className="w-4 h-4 text-blue-600" />;
    default:
      return <AlertCircle className="w-4 h-4 text-gray-600" />;
  }
};

const TablesPage = ({ onSelectTable }) => {
  const [tables, setTables] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [seats, setSeats] = useState(4); // Default seats for new table
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    available: 0,
    occupied: 0,
    readyToPay: 0
  });

  // Fetch tables from API
  const fetchTables = async () => {
    try {
      const response = await axiosInstance.get('/branches/tables/');
      setTables(response.data);
    } catch (err) {
      console.error('Failed to fetch tables:', err);
      setTables([]);
      setError('Failed to fetch tables.');
    }
  };

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const data = await getMyOrders();
      setOrders(data);
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
  }, []);

  // Update stats when tables or orders change
  useEffect(() => {
    const sortedTables = tables.slice().sort((a, b) => a.number - b.number);
    let available = 0;
    let occupied = 0;
    let readyToPay = 0;

    sortedTables.forEach(table => {
      const status = getTableStatus(table, orders);
      switch (status) {
        case 'available':
          available++;
          break;
        case 'ordering':
          occupied++;
          break;
        case 'ready_to_pay':
          readyToPay++;
          break;
        default:
          available++;
      }
    });

    setStats({
      total: sortedTables.length,
      available,
      occupied,
      readyToPay
    });
  }, [tables, orders]);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    setError('');
    try {
      await Promise.all([fetchTables(), fetchOrders()]);
    } catch (err) {
      setError('Failed to refresh data.');
    } finally {
      setRefreshing(false);
    }
  };

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

  const sortedTables = tables
    .slice()
    .sort((a, b) => a.number - b.number);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tables</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            </div>
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Occupied</p>
              <p className="text-2xl font-bold text-orange-600">{stats.occupied}</p>
            </div>
            <div className="p-2 bg-orange-100 rounded-lg">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ready to Pay</p>
              <p className="text-2xl font-bold text-blue-600">{stats.readyToPay}</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Restaurant Tables</h1>
            <p className="text-gray-600 mt-1">Manage and monitor your restaurant tables</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={handleAddTable}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{loading ? 'Adding...' : 'Add Table'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Status Legend */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-4 border border-gray-200"
      >
        <h3 className="text-sm font-medium text-gray-700 mb-3">Table Status Legend</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon('available')}
            <span className="text-sm text-gray-600">Available</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon('ordering')}
            <span className="text-sm text-gray-600">Ordering</span>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusIcon('ready_to_pay')}
            <span className="text-sm text-gray-600">Ready to Pay</span>
          </div>
        </div>
      </motion.div>

      {/* Tables Grid */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
      >
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"
          >
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <span className="text-red-700">{error}</span>
            </div>
          </motion.div>
        )}

        {sortedTables.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Plus className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Tables Found</h3>
            <p className="text-gray-500 mb-4">Get started by adding your first table</p>
            <button
              onClick={handleAddTable}
              disabled={loading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm"
            >
              {loading ? 'Adding...' : 'Add First Table'}
            </button>
          </motion.div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          >
            <AnimatePresence>
              {sortedTables.map((table) => {
                const status = getTableStatus(table, orders);
                return (
                  <motion.div
                    key={table.id}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div
                      onClick={() => onSelectTable(table)}
                      className="group cursor-pointer"
                    >
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-4 hover:border-green-300 hover:shadow-lg transition-all duration-200 group-hover:scale-105">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Table {table.number}</h3>
                          {getStatusIcon(status)}
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Seats:</span>
                            <span className="text-sm font-medium">{table.seats}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Status:</span>
                            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(status)}`}>
                              {status.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            </span>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">Click to manage</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}
      </motion.div>

      {/* Floating Action Button for Mobile */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleAddTable}
        disabled={loading}
        className="fixed bottom-6 right-6 lg:hidden w-14 h-14 bg-green-600 hover:bg-green-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 disabled:opacity-50 z-50"
        aria-label="Add Table"
        title={loading ? 'Adding table...' : 'Add Table'}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  );
};

export default TablesPage;
