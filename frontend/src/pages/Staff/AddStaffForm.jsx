import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addUser } from '../../api/stafflist';

const ROLES = [
  { value: '', labelKey: 'select_role' },
  { value: 'waiter', labelKey: 'roles.waiter' },
  { value: 'bartender', labelKey: 'roles.bartender' },
  { value: 'meat', labelKey: 'roles.meat' },
  { value: 'cashier', labelKey: 'roles.cashier' },
  { value: 'manager', labelKey: 'roles.manager' },
  { value: 'owner', labelKey: 'roles.owner' },
  { value: 'staff', labelKey: 'roles.staff' },
];

function AddStaffForm({ onSuccess, onCancel }) {
  const { t } = useTranslation();

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
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : name === 'branch' ? Number(value) : value,
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
        setError(messages || t('error_default'));
      } else {
        setError(t('error_default') + ` ${err.message || ''}`);
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
          placeholder={t('username')}
          required
          value={formData.username}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="first_name"
          placeholder={t('first_name')}
          required
          value={formData.first_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="text"
          name="last_name"
          placeholder={t('last_name')}
          required
          value={formData.last_name}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="tel"
          name="phone_number"
          placeholder={t('phone_number')}
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
          {ROLES.map((role) => (
            <option key={role.value} value={role.value}>
              {t(role.labelKey)}
            </option>
          ))}
        </select>

        <input
          type="number"
          name="branch"
          placeholder={t('branch_id')}
          required
          value={formData.branch}
          onChange={handleChange}
          className="w-full border px-4 py-2 rounded"
        />

        <input
          type="password"
          name="password"
          placeholder={t('password')}
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
            {t('active')}
          </label>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
            disabled={submitting}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`px-4 py-2 rounded text-white ${
              submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {submitting ? t('adding') : t('add_staff')}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStaffForm;
