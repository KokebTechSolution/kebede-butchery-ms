// src/components/NewRequest.jsx
import React from 'react';

const NewRequest = ({
  showModal,
  setShowModal,
  formData,
  formMessage,
  products,
  branches,
  handleFormChange,
  handleFormSubmit,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl relative">
        <h2 className="text-lg font-semibold mb-4">New Inventory Request</h2>
        <button
          onClick={() => setShowModal(false)}
          className="absolute top-3 right-4 text-2xl font-bold text-gray-500 hover:text-gray-700"
          aria-label="Close modal"
        >
          &times;
        </button>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Product</label>
            <select
              name="product"
              value={formData.product}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- Select Product --</option>
              {products.map((prod) => (
                <option key={prod.id} value={prod.id}>
                  {prod.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Quantity</label>
            <input
              type="number"
              name="quantity"
              step="0.01"
              value={formData.quantity}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Unit Type</label>
            <select
              name="unit_type"
              value={formData.unit_type}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="unit">Unit</option>
              <option value="carton">Carton</option>
              <option value="bottle">Bottle</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">Branch</label>
            <select
              name="branch"
              value={formData.branch}
              onChange={handleFormChange}
              className="w-full border p-2 rounded"
              required
            >
              <option value="">-- Select Branch --</option>
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
            Submit Request
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
