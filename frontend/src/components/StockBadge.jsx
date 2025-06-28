import React from 'react';

const StockBadge = ({ runningOut }) => {
    return (
        <span className={`px-2 py-1 rounded text-white ${runningOut ? 'bg-red-500' : 'bg-green-500'}`}>
            {runningOut ? 'Running Out' : 'In Stock'}
        </span>
    );
};

export default StockBadge;
