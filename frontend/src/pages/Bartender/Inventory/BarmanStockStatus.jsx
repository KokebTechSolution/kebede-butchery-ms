import React from 'react';
import { useTranslation } from 'react-i18next';

const BarmanStockStatus = ({ stocks, tab, setTab, bartenderId }) => {
  const { t } = useTranslation();
  // Filter stocks by bartenderId and tab
  const filteredStocks = stocks
    .filter(stock => String(stock.bartender_id) === String(bartenderId))
    .filter(stock => (tab === 'available' ? !stock.running_out : stock.running_out));

  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold mb-4">{t('barman_stock_status')}</h2>
      <div className="mb-4 flex gap-4">
        <button
          onClick={() => setTab('available')}
          className={`px-4 py-2 rounded ${
            tab === 'available' ? 'bg-green-600 text-white' : 'bg-gray-200'
          }`}
        >
          {t('available')}
        </button>
        <button
          onClick={() => setTab('running_out')}
          className={`px-4 py-2 rounded ${
            tab === 'running_out' ? 'bg-red-600 text-white' : 'bg-gray-200'
          }`}
        >
          {t('running_out')}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border table-auto text-center">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-1">NO</th>
              <th className="border px-2 py-1">{t('product_name')}</th>
              <th className="border px-2 py-1">{t('branch')}</th>
              <th className="border px-2 py-1">{t('quantity_in_base_units')}</th>
              <th className="border px-2 py-1">{t('quantity_with_input_unit')}</th>
              <th className="border px-2 py-1">{t('minimum_threshold_base_units')}</th>
              <th className="border px-2 py-1">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center p-4 text-gray-500">
                  {t('no_stock_found')}
                </td>
              </tr>
            ) : (
              filteredStocks.map((stock, idx) => (
                <tr key={stock.id} className="hover:bg-gray-50">
                  <td className="border px-2 py-1">{idx + 1}</td>
                  <td className="border px-2 py-1">{stock.product_name}</td>
                  <td className="border px-2 py-1">{stock.branch_name}</td>
                  <td className="border px-2 py-1">{stock.quantity_in_base_units}</td>
                  <td className="border px-2 py-1">{stock.original_quantity_display || t('na')}</td>
                  <td className="border px-2 py-1">{stock.minimum_threshold_base_units}</td>
                  <td className={`border px-2 py-1 font-bold ${stock.running_out ? 'text-red-600' : 'text-green-600'}`}>{stock.running_out ? t('running_out') : t('available')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BarmanStockStatus;