import React from 'react';
import { useTranslation } from 'react-i18next';

const NewRequest = ({
  showModal,
  setShowModal,
  formData,
  formMessage,
  products,
  branches,
  units,
  productMeasurements,
  handleFormChange,
  handleFormSubmit,
}) => {
  const { t } = useTranslation();

  // Get available input units for the selected product
  const getAvailableInputUnits = (productId) => {
    if (!productId || !productMeasurements[productId]) return [];
    
    // Get unique input units (from_unit) for this product
    const inputUnits = [...new Set(
      productMeasurements[productId].map(m => m.from_unit_id)
    )];
    
    return units.filter(unit => inputUnits.includes(unit.id));
  };

  // Get conversion info for display
  const getConversionInfo = (productId, unitId) => {
    if (!productId || !unitId || !productMeasurements[productId]) return null;
    
    const measurement = productMeasurements[productId].find(m => m.from_unit_id === unitId);
    if (!measurement) return null;
    
    return {
      fromUnit: measurement.from_unit_name,
      toUnit: measurement.to_unit_id,
      amountPer: measurement.amount_per
    };
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
                 <h2 className="text-lg font-semibold mb-4">{t('new_inventory_request')}</h2>
         
         {/* Info Box */}
         <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
           <strong>💡 How it works:</strong> Select a product and input unit (like "Box" or "Carton"). 
           The system will automatically calculate how many individual units (like "Bottles") that represents.
         </div>
         
         {/* Form Message Display */}
         {formMessage && (
           <div className={`mb-4 p-3 rounded text-sm ${
             formMessage.includes('successfully') || formMessage.includes('accepted') || formMessage.includes('rejected')
               ? 'bg-green-100 text-green-700 border border-green-200'
               : 'bg-red-100 text-red-700 border border-red-200'
           }`}>
             {formMessage}
           </div>
         )}
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
          aria-label={t('close_modal')}
        >
          &times;
        </button>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">{t('product')}</label>
            <select
              name="product"
              value={formData.product}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">{t('select_product')}</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">{t('quantity')}</label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              value={formData.quantity}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            />
            
            {/* Show total individual units calculation */}
            {formData.quantity && formData.request_unit_id && formData.product && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                {(() => {
                  const conversion = getConversionInfo(formData.product, parseInt(formData.request_unit_id));
                  if (conversion) {
                    const totalUnits = parseFloat(formData.quantity) * conversion.amountPer;
                    return `Total: ${formData.quantity} ${conversion.fromUnit} = ${totalUnits} ${conversion.toUnit}`;
                  }
                  return 'Total calculation not available';
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">{t('unit_type')}</label>
            <select
              name="request_unit_id"
              value={formData.request_unit_id}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">{t('select_unit')}</option>
              {getAvailableInputUnits(formData.product).map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.unit_name}
                </option>
              ))}
            </select>
            
            {/* Show conversion info when unit is selected */}
            {formData.request_unit_id && formData.product && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-700">
                {(() => {
                  const conversion = getConversionInfo(formData.product, parseInt(formData.request_unit_id));
                  if (conversion) {
                    return `1 ${conversion.fromUnit} = ${conversion.amountPer} ${conversion.toUnit}`;
                  }
                  return 'Conversion information not available';
                })()}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium">{t('branch')}</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">{t('select_branch')}</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 w-full"
          >
            {t('submit_request')}
          </button>

          {formMessage && (
            <p className="text-sm text-red-600 mt-2 whitespace-pre-wrap">{formMessage}</p>
          )}
        </form>
      </div>
    </div>
  );
};

export default NewRequest;
