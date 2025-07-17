import React, { useState } from 'react';
import { addUser } from '../../api/stafflist';

const ROLES = [
  { value: '', label: 'Select Role' },
  { value: 'waiter', label: 'Waiter' },
  { value: 'bartender', label: 'Bartender' },
  { value: 'meat', label: 'Meat Counter' },
  { value: 'cashier', label: 'Cashier' },
  { value: 'manager', label: 'Branch Manager' },
  { value: 'owner', label: 'Owner' },
  { value: 'staff', label: 'Staff' },
];

function AddStaffForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    role: '',
    branch: '',
    password: '',
    is_active: true,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'branch' ? Number(value) : value),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const sanitizedData = { ...formData };
      delete sanitizedData.id;
      delete sanitizedData.date_joined;
      delete sanitizedData.updated_at;
      delete sanitizedData.is_superuser;
      delete sanitizedData.is_staff;

      const newUser = await addUser(sanitizedData);
      onSuccess(newUser);
    } catch (err) {
      console.error('Add user error:', err);
      if (err.response && err.response.data) {
        const data = err.response.data;
        const messages = Object.entries(data)
          .map(([field, msgs]) =>
            Array.isArray(msgs) ? `${field}: ${msgs.join(', ')}` : `${field}: ${msgs}`
          )
          .join('\n');
        setError(messages || 'Failed to add user. Please check your input.');
      } else {
        setError(`Failed to add user. ${err.message || ''}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-3 whitespace-pre-line">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="username"
          placeholder="Username"
          required
          value={formData.username}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="first_name"
          placeholder="First Name"
          required
          value={formData.first_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="last_name"
          placeholder="Last Name"
          required
          value={formData.last_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="tel"
          name="phone_number"
          placeholder="Phone Number"
          value={formData.phone_number}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
          className="w-full border px-4 py-2 rounded"
        >
          {ROLES.map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="branch"
          placeholder="Branch ID"
          required
          value={formData.branch}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          value={formData.password}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <div className="flex items-center">
          <input
            type="checkbox"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="mr-2"
            id="is_active"
          />
          <label htmlFor="is_active" className="text-sm text-gray-700">
            Active
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded text-white ${
              submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? 'Adding...' : 'Add Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStaffForm;
