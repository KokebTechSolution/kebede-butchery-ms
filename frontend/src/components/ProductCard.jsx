import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StockBadge from './StockBadge';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    return (
        <div className="p-4 border rounded-xl shadow">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p>Category: {product.category}</p>
            <p>Unit Type: {product.unit_type}</p>
            <StockBadge runningOut={product.running_out} />

            <div className="mt-4 flex gap-2">
                {/* Restock button - only for managers */}
                {user?.role === 'manager' && (
                    <button
                        className="bg-blue-500 text-white px-3 py-1 rounded"
                        onClick={() => navigate(`/restock/${product.id}`)}
                    >
                        Restock
                    </button>
                )}
                <button
                    className="bg-green-500 text-white px-3 py-2 rounded"
                    onClick={() => navigate(`/sell/${product.id}`)}
                >
                    Sell
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
