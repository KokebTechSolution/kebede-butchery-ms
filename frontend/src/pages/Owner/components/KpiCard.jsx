import React from 'react';

const KpiCard = ({ title, value, isCurrency = false, isProfitLoss = false }) => {
  const formatValue = (val) => {
    if (isCurrency) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(val);
    }
    return val.toLocaleString();
  };

  const getValueColor = () => {
    if (isProfitLoss) {
      return value >= 0 ? 'text-green-600' : 'text-red-600';
    }
    return 'text-gray-800';
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200">
      <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-2">
        {title}
      </p>
      <p className={`text-3xl font-bold mt-1 ${getValueColor()}`}>
        {formatValue(value)}
      </p>
    </div>
  );
};

export default KpiCard;