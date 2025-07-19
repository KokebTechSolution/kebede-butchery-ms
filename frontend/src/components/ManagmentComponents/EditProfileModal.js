import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from 'react-i18next';

const EditProfileModal = ({ isOpen, onClose }) => {
  const { user, updateUser } = useAuth();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      await updateUser(formData);
      setMessage('Profile updated successfully!');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      setMessage('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">{t('edit_profile')}</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">

          {/* Readonly fields */}
          <div>
            <label className="block text-sm font-semibold">{t('username')}</label>
            <input
              value={user.username}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">{t('first_name')}</label>
            <input
              value={user.first_name}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">{t('last_name')}</label>
            <input
              value={user.last_name}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">{t('phone_number')}</label>
            <input
              value={user.phone_number}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">{t('roles.manager')}</label>
            <input
              value={user.role}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Editable password */}
          <div>
            <label className="block text-sm font-semibold">{t('password')}</label>
            <input
              type="password"
              name="password"
              placeholder="Enter new password (optional)"
              onChange={handleChange}
              className="w-full border border-gray-300 p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Message display */}
          {message && (
            <div className={`p-3 rounded-lg text-sm ${
              message.includes('successfully') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {message}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save_changes')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400"
            >
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
