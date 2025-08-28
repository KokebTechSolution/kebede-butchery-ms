import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaBox, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

const BarmanStockStatus = ({ stocks, tab, setTab, bartenderId, userBranchId }) => {
  const { t } = useTranslation();
  
  // Filter stocks by branch (not bartender) and tab
  // For requests, we need ALL stocks in the branch, not just those assigned to a specific bartender
  console.log('BarmanStockStatus - stocks:', stocks);
  console.log('BarmanStockStatus - userBranchId:', userBranchId);
  
  const filteredStocks = stocks
    .filter(stock => {
      const stockBranchId = stock.branch_id || stock.branch?.id;
      const matches = String(stockBranchId) === String(userBranchId);
      console.log(`Stock ${stock.product_name}: branch_id=${stockBranchId}, userBranchId=${userBranchId}, matches=${matches}`);
      return matches;
    })
    .filter(stock => (tab === 'available' ? !stock.running_out : stock.running_out));

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
        {t('barman_stock_status')}
      </h2>
      
      {/* Tab Buttons - Mobile Optimized */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <button
          onClick={() => setTab('available')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            tab === 'available' 
              ? 'bg-green-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FaCheckCircle className="text-lg" />
          <span className="hidden sm:inline">{t('available')}</span>
          <span className="sm:hidden">Available</span>
        </button>
        <button
          onClick={() => setTab('running_out')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
            tab === 'running_out' 
              ? 'bg-red-600 text-white shadow-lg transform scale-105' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <FaExclamationTriangle className="text-lg" />
          <span className="hidden sm:inline">{t('running_out')}</span>
          <span className="sm:hidden">Low Stock</span>
        </button>
      </div>

      {/* Stock Count Summary */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <FaBox className={`text-2xl ${tab === 'available' ? 'text-green-600' : 'text-red-600'}`} />
            <span className="text-lg font-semibold text-gray-700">
              {filteredStocks.length} {tab === 'available' ? 'Available' : 'Low Stock'} Items
            </span>
          </div>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="block md:hidden space-y-4">
        {filteredStocks.length === 0 ? (
          <div className="text-center py-8">
            <FaBox className="mx-auto text-4xl text-gray-300 mb-3" />
            <p className="text-gray-500 text-lg">{t('no_stock_found')}</p>
          </div>
        ) : (
          filteredStocks.map((stock, idx) => (
            <div key={stock.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              {/* Header with status */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded-full">
                    #{idx + 1}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stock.running_out ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                  }`}>
                    {stock.running_out ? t('running_out') : t('available')}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="space-y-2 mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">{stock.product_name}</h3>
                <p className="text-sm text-gray-600">Branch: {stock.branch_name}</p>
              </div>

              {/* Stock Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">Base Units</p>
                  <p className="font-semibold text-gray-900">{stock.quantity_in_base_units}</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">Available in Cartons</p>
                  <p className="font-semibold text-gray-900">{stock.original_quantity_display || t('na')}</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">Threshold</p>
                  <p className="font-semibold text-gray-900">{stock.minimum_threshold_base_units}</p>
                </div>
                <div className="bg-gray-50 rounded p-3">
                  <p className="text-gray-500 text-xs mb-1">Status</p>
                  <p className={`font-semibold ${stock.running_out ? 'text-red-600' : 'text-green-600'}`}>
                    {stock.running_out ? t('running_out') : t('available')}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">NO</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('product_name')}</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('branch')}</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('quantity_in_base_units')}</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">Available in Cartons</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('minimum_threshold_base_units')}</th>
                  <th className="border px-4 py-3 text-left text-sm font-semibold text-gray-700">{t('status')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredStocks.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center p-8 text-gray-500">
                      {t('no_stock_found')}
                    </td>
                  </tr>
                ) : (
                  filteredStocks.map((stock, idx) => (
                    <tr key={stock.id} className="hover:bg-gray-50 transition-colors">
                      <td className="border px-4 py-3 text-sm">{idx + 1}</td>
                      <td className="border px-4 py-3 text-sm font-medium">{stock.product_name}</td>
                      <td className="border px-4 py-3 text-sm">{stock.branch_name}</td>
                      <td className="border px-4 py-3 text-sm">{stock.quantity_in_base_units}</td>
                      <td className="border px-4 py-3 text-sm">{stock.original_quantity_display || t('na')}</td>
                      <td className="border px-4 py-3 text-sm">{stock.minimum_threshold_base_units}</td>
                      <td className={`border px-4 py-3 text-sm font-bold ${stock.running_out ? 'text-red-600' : 'text-green-600'}`}>
                        {stock.running_out ? t('running_out') : t('available')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarmanStockStatus;