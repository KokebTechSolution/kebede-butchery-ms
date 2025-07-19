import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../../api/axiosInstance';

const BarmanStockStatus = ({ stocks, tab, setTab, bartenderId }) => {
  const { t } = useTranslation();
  const [unitConversions, setUnitConversions] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch unit conversions
  useEffect(() => {
    const fetchUnitConversions = async () => {
      try {
        setLoading(true);
        const response = await api.get('/inventory/inventory/unit_conversions/');
        
        // Ensure we have the expected data structure
        if (response.data && response.data.conversions) {
          setUnitConversions(response.data.conversions);
        } else {
          console.warn('Unit conversions API did not return expected structure:', response.data);
          // Set default conversions as fallback
          setUnitConversions({
            carton: { bottle: 24, shot: 384 },
            bottle: { shot: 16 },
            litre: { shot: 33 },
            unit: { shot: 1 }
          });
        }
      } catch (error) {
        console.error('Error fetching unit conversions:', error);
        // Set default conversions as fallback
        setUnitConversions({
          carton: { bottle: 24, shot: 384 },
          bottle: { shot: 16 },
          litre: { shot: 33 },
          unit: { shot: 1 }
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUnitConversions();
  }, []);

  // Filter stocks by bartenderId and tab
  const filteredStocks = stocks
    .filter(stock => String(stock.bartender) === String(bartenderId))
    .filter(stock => (tab === 'available' ? !stock.running_out : stock.running_out));

  // Function to get total available quantity for a product from barman stock
  const getTotalAvailable = (productName, branchName) => {
    const totalStock = stocks
      .filter(stock => 
        stock.product_name === productName && 
        stock.branch_name === branchName
      )
      .reduce((sum, stock) => {
        const totalQuantity = (
          parseFloat(stock.carton_quantity || 0) +
          parseFloat(stock.bottle_quantity || 0) +
          parseFloat(stock.litre_quantity || 0) +
          parseFloat(stock.unit_quantity || 0) +
          parseFloat(stock.shot_quantity || 0)
        );
        return sum + totalQuantity;
      }, 0);
    
    return totalStock;
  };

  // Function to calculate converted quantity based on unit type
  const getConvertedQuantity = (quantity, unitType) => {
    
    // Validate input
    if (!quantity || isNaN(quantity) || quantity <= 0) {
      return { quantity: 0, unit: unitType };
    }
    
    // Check if we have conversion data for this unit type
    if (!unitConversions[unitType]) {
      return { quantity: quantity, unit: unitType }; // No conversion available, return original
    }

    // Get the appropriate conversion based on unit type
    let convertedQuantity = quantity;
    let convertedUnit = unitType;

    switch (unitType) {
      case 'carton':
        // Convert carton to bottles
        if (unitConversions.carton && unitConversions.carton.bottle) {
          convertedQuantity = quantity * unitConversions.carton.bottle;
          convertedUnit = t('bottles');
        }
        break;
      case 'bottle':
        // Convert bottle to shots
        if (unitConversions.bottle && unitConversions.bottle.shot) {
          convertedQuantity = quantity * unitConversions.bottle.shot;
          convertedUnit = t('shots');
        }
        break;
      case 'litre':
        // Convert litre to shots
        if (unitConversions.litre && unitConversions.litre.shot) {
          convertedQuantity = quantity * unitConversions.litre.shot;
          convertedUnit = t('shots');
        }
        break;
      case 'unit':
        // Convert unit to shots
        if (unitConversions.unit && unitConversions.unit.shot) {
          convertedQuantity = quantity * unitConversions.unit.shot;
          convertedUnit = t('shots');
        }
        break;
      default:
        // For other unit types, try to find any available conversion
        const conversions = unitConversions[unitType];
        if (conversions && Object.keys(conversions).length > 0) {
          // Get the first available conversion
          const firstConversion = Object.entries(conversions)[0];
          if (firstConversion) {
            convertedQuantity = quantity * firstConversion[1];
            convertedUnit = firstConversion[0];
          }
        }
    }

    // Ensure we return valid numbers
    if (isNaN(convertedQuantity) || convertedQuantity < 0) {
      return { quantity: quantity, unit: unitType };
    }

    return { quantity: convertedQuantity, unit: convertedUnit };
  };

  if (loading) {
    return (
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">{t('barman_stock_status')}</h2>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">{t('loading_unit_conversions')}</p>
        </div>
      </div>
    );
  }

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
              <th className="border px-2 py-1">{t('number')}</th>
              <th className="border px-2 py-1">{t('name_of_beverage')}</th>
              <th className="border px-2 py-1">{t('unit_type')}</th>
              <th className="border px-2 py-1">{t('barman_stock')}</th>
              <th className="border px-2 py-1">{t('total_available')}</th>
              <th className="border px-2 py-1">{t('status')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredStocks.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center p-4 text-gray-500">
                  {t('no_stock_found')}
                </td>
              </tr>
            ) : (
              filteredStocks.map((stock, idx) => {
                const totalAvailable = getTotalAvailable(
                  stock.product_name, 
                  stock.branch_name
                );
                
                // Get quantities for each unit type
                const cartonQty = parseFloat(stock.carton_quantity || 0);
                const bottleQty = parseFloat(stock.bottle_quantity || 0);
                const litreQty = parseFloat(stock.litre_quantity || 0);
                const unitQty = parseFloat(stock.unit_quantity || 0);
                const shotQty = parseFloat(stock.shot_quantity || 0);
                
                // Find the unit type with the highest quantity
                const quantities = [
                  { type: 'carton', qty: cartonQty },
                  { type: 'bottle', qty: bottleQty },
                  { type: 'litre', qty: litreQty },
                  { type: 'unit', qty: unitQty },
                  { type: 'shot', qty: shotQty }
                ];
                const primaryUnit = quantities.reduce((max, current) => 
                  current.qty > max.qty ? current : max
                );
                
                const convertedTotal = getConvertedQuantity(primaryUnit.qty, primaryUnit.type);
                
                return (
                  <tr key={stock.id} className="hover:bg-gray-50">
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{stock.product_name}</td>
                    <td className="border px-2 py-1">
                      <div className="text-xs">
                        {cartonQty > 0 && <div>Carton: {cartonQty}</div>}
                        {bottleQty > 0 && <div>Bottle: {bottleQty}</div>}
                        {litreQty > 0 && <div>Litre: {litreQty}</div>}
                        {unitQty > 0 && <div>Unit: {unitQty}</div>}
                        {shotQty > 0 && <div>Shot: {shotQty}</div>}
                      </div>
                    </td>
                    <td className="border px-2 py-1 font-medium">
                      {primaryUnit.qty} {primaryUnit.type}
                    </td>
                    <td className="border px-2 py-1 font-medium text-blue-600">
                      {convertedTotal.quantity.toFixed(2)} {convertedTotal.unit}
                    </td>
                    <td
                      className={`border px-2 py-1 font-bold ${
                        stock.running_out ? 'text-red-600' : 'text-green-600'
                      }`}
                    >
                      {stock.running_out ? t('running_out') : t('available')}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BarmanStockStatus;