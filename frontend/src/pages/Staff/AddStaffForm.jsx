import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { addUser } from '../../api/stafflist';
import { UserPlus, Save, X } from 'lucide-react';

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
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <UserPlus className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{t('add_new_staff') || 'Add New Staff'}</h2>
          <p className="text-sm text-gray-600">Fill in the details below to add a new staff member</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 flex items-start gap-3">
          <div className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <X className="w-3 h-3 text-red-600" />
          </div>
          <div className="whitespace-pre-line text-sm">{error}</div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Personal Information Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-3 h-3 text-blue-600" />
            </div>
            Personal Information
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('username')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="username"
                placeholder={t('username')}
                required
                value={formData.username}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('first_name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="first_name"
                placeholder={t('first_name')}
                required
                value={formData.first_name}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('last_name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="last_name"
                placeholder={t('last_name')}
                required
                value={formData.last_name}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('phone_number')}
              </label>
              <input
                type="tel"
                name="phone_number"
                placeholder={t('phone_number')}
                value={formData.phone_number}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Role and Branch Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-3 h-3 text-green-600" />
            </div>
            Role & Branch
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('role')} <span className="text-red-500">*</span>
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                required
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-white"
              >
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>
                    {t(role.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('branch_id')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="branch"
                placeholder={t('branch_id')}
                required
                value={formData.branch}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        </div>

        {/* Security Section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-3 h-3 text-purple-600" />
            </div>
            Security
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('password')} <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                placeholder={t('password')}
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                id="is_active"
              />
              <label htmlFor="is_active" className="ml-3 text-sm text-gray-700">
                {t('active')} - User account will be active immediately
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onCancel}
            className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-all duration-200 font-medium"
            disabled={submitting}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg text-white font-medium transition-all duration-200 flex items-center justify-center gap-2 ${
              submitting 
                ? 'bg-blue-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 hover:scale-105'
            }`}
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                {t('adding') || 'Adding...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                {t('add_staff') || 'Add Staff'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default AddStaffForm;
