import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sellInventory } from '../../api/inventory';

const SalesForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({ quantity: '', unit_type: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        await sellInventory(id, formData);
        navigate('/');
    };

    return (
        <div className="p-4 max-w-md mx-auto">
            <h1 className="text-xl font-bold mb-4">Record Sale</h1>
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    placeholder="Quantity"
                    value={formData.quantity}
                    onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                    className="border p-2 w-full"
                />
                <input
                    type="text"
                    placeholder="Unit Type (kg, piece, bottle, carton, shot)"
                    value={formData.unit_type}
                    onChange={e => setFormData({ ...formData, unit_type: e.target.value })}
                    className="border p-2 w-full"
                />
                <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">Submit</button>
            </form>
        </div>
    );
};

export default SalesForm;
