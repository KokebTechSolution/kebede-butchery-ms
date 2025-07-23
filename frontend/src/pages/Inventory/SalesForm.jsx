import React, { useState, useEffect } from 'react';
import { performSale } from '../../api/inventory'; // <-- Changed import
import { useAuth } from '../../context/AuthContext'; // Assuming you use this for branchId
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const SalesForm = ({ productId, currentProductDetails, onClose }) => { // Pass productId and product details
    const { user } = useAuth();
    const branchId = user?.branch || null;
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [quantity, setQuantity] = useState('');
    const [errors, setErrors] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // You'd likely fetch product details here if not passed as props,
    // to understand its sellable_unit_type and total available quantity.
    // For now, let's assume `currentProductDetails` contains what you need.

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors(null);

        if (!quantity || isNaN(Number(quantity)) || Number(quantity) <= 0) {
            setErrors({ quantity: t('valid_quantity_required') });
            return;
        }

        if (!branchId) {
            alert(t('branch_info_missing'));
            return;
        }

        // You might want to add client-side validation here to check if
        // `quantity` is less than or equal to the available stock (total_sellable_units)
        // This requires `currentProductDetails` to have the current stock for this branch.

        setSubmitting(true);
        try {
            const saleData = {
                branch: branchId,
                quantity_in_sellable_units: Number(quantity),
            };

            await performSale(productId, saleData); // <-- Changed function call

            alert(t('sale_recorded_success'));
            setQuantity('');
            setSubmitting(false);
            if (onClose) onClose();
            // You might want to refresh the inventory list in ProductListPage after a sale
            // This would be handled by a prop passed to SalesForm, or a global state update.
            // navigate('/branch-manager/inventory'); // Might not be needed if this is a modal.
        } catch (err) {
            setSubmitting(false);
            console.error('Sale error:', err.response?.data || err.message);
            setErrors({ general: t('sale_error') + ': ' + (err.response?.data?.detail || err.message) });
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">{t('record_sale')}</h2>
            {currentProductDetails && (
                 <p className="mb-2">
                    {t('selling')}: {currentProductDetails.name} ({t('available_stock')}: {currentProductDetails.current_stock_quantity_in_sellable_units || 0} {currentProductDetails.sellable_unit_type})
                 </p>
            )}

            <form onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="saleQuantity" className="block font-semibold mb-1">
                        {t('quantity_sold')} ({t(currentProductDetails?.sellable_unit_type || 'units')})
                    </label>
                    <input
                        type="number"
                        id="saleQuantity"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        className={`border p-2 w-full ${errors?.quantity ? 'border-red-500' : ''}`}
                        step="0.01" // Allow decimal sales if your sellable unit type permits
                        required
                    />
                    {errors?.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
                </div>

                {errors?.general && <p className="text-red-500 text-sm mb-4">{errors.general}</p>}

                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                    disabled={submitting}
                >
                    {submitting ? t('processing') : t('record_sale')}
                </button>
            </form>
        </div>
    );
};

export default SalesForm;