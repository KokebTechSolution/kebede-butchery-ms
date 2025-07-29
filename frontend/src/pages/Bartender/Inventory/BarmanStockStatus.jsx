import React from 'react';
import { useTranslation } from 'react-i18next';
import ResponsiveDataTable from '../../../components/ResponsiveDataTable';

const BarmanStockStatus = ({ stocks, tab, setTab, bartenderId }) => {
  const { t } = useTranslation();
  
  // Filter stocks by bartenderId and tab
  const filteredStocks = stocks
    .filter(stock => String(stock.bartender_id) === String(bartenderId))
    .filter(stock => (tab === 'available' ? !stock.running_out : stock.running_out));

  // Define columns for the responsive table
  const columns = [
    {
      key: 'id',
      label: 'NO',
      render: (value, item, index) => index + 1
    },
    {
      key: 'product_name',
      label: t('product_name')
    },
    {
      key: 'branch_name',
      label: t('branch')
    },
    {
      key: 'quantity_in_base_units',
      label: t('quantity_in_base_units')
    },
    {
      key: 'original_quantity_display',
      label: t('quantity_with_input_unit'),
      render: (value, item) => value || t('na')
    },
    {
      key: 'minimum_threshold_base_units',
      label: t('minimum_threshold_base_units')
    },
    {
      key: 'status',
      label: t('status'),
      render: (value, item) => (
        <span className={`font-bold ${item.running_out ? 'text-red-600' : 'text-green-600'}`}>
          {item.running_out ? t('running_out') : t('available')}
        </span>
      )
    }
  ];

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">{t('barman_stock_status')}</h2>
      
      {/* Tab Buttons */}
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => setTab('available')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === 'available' 
              ? 'bg-green-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('available')}
        </button>
        <button
          onClick={() => setTab('running_out')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            tab === 'running_out' 
              ? 'bg-red-600 text-white shadow-lg' 
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          {t('running_out')}
        </button>
      </div>

      {/* Responsive Data Table */}
      <ResponsiveDataTable
        columns={columns}
        data={filteredStocks}
        searchable={true}
        sortable={true}
        showCardViewToggle={true}
        cardView={false}
        emptyMessage={t('no_stock_found')}
        className="bg-white rounded-lg shadow-mobile"
      />
    </div>
  );
};

export default BarmanStockStatus;