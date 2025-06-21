import React, { useState } from 'react';
import { addUser } from '../../api/stafflist';

function AddStaffForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    role: '',
    branch_id: '',
    password: '',
    is_active: true,
  });

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const newUser = await addUser(formData);
      onSuccess(newUser); // Pass to parent to update list and close modal
    } catch (err) {
      console.error(err);
      setError('Failed to add staff. Please check your input.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {error && <p className="text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input type="text" name="username" placeholder="Username" required value={formData.username} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="text" name="first_name" placeholder="First Name" required value={formData.first_name} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="text" name="last_name" placeholder="Last Name" required value={formData.last_name} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="email" name="email" placeholder="Email" required value={formData.email} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="text" name="role" placeholder="Role (e.g., staff)" required value={formData.role} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="number" name="branch_id" placeholder="Branch ID" required value={formData.branch_id} onChange={handleChange} className="w-full border px-4 py-2 rounded" />
        <input type="password" name="password" placeholder="Password" required value={formData.password} onChange={handleChange} className="w-full border px-4 py-2 rounded" />

        <div className="flex items-center">
          <input type="checkbox" name="is_active" checked={formData.is_active} onChange={handleChange} className="mr-2" />
          <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
        </div>

        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onCancel} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
          <button type="submit" disabled={submitting} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            {submitting ? 'Adding...' : 'Add Staff'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStaffForm;
