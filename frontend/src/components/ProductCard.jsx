import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import StockBadge from './StockBadge';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const { t } = useTranslation();

    return (
        <div className="p-4 border rounded-xl shadow">
            <h2 className="text-lg font-semibold">{product.name}</h2>
            <p>{t('category')}: {product.category}</p>
            <p>{t('unit_type')}: {product.unit_type}</p>
            <StockBadge runningOut={product.running_out} />

            <div className="mt-4 flex gap-2">
                <button
                    className="bg-blue-500 text-white px-3 py-1 rounded"
                    onClick={() => navigate(`/restock/${product.id}`)}
                >
                    {t('restock')}
                </button>
                <button
                    className="bg-green-500 text-white px-3 py-1 rounded"
                    onClick={() => navigate(`/sell/${product.id}`)}
                >
                    {t('sell')}
                </button>
            </div>
        </div>
    );
};

export default ProductCard;
