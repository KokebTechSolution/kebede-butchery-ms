import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetUserPassword, fetchStaffList, updateUser, deleteUser } from '../../api/stafflist';
import AddStaffForm from './AddStaffForm';

function StaffListPage() {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    role: '',
    first_name: '',
    last_name: '',
    branch_id: '',
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchStaffList()
      .then(data => {
        setStaffList(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(t('failed_load_staff_list'));
        setLoading(false);
      });
  }, [t]);

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      phone_number: user.phone_number,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      branch_id: user.branch_id,
    });
  };

  const handleEditChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async () => {
    try {
      const updated = await updateUser(editUser.id, formData);
      setStaffList(prev => prev.map(user => user.id === updated.id ? updated : user));
      setEditUser(null);
    } catch (err) {
      console.error('Update failed:', err);
      alert(t('failed_update_user'));
    }
  };

  const handleResetPassword = async () => {
    try {
      await resetUserPassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword('');
      alert(t('password_reset_success'));
    } catch (err) {
      console.error('Password reset failed:', err);
      alert(t('failed_reset_password'));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('confirm_delete_user'))) {
      try {
        await deleteUser(id);
        setStaffList(prev => prev.filter(user => user.id !== id));
      } catch (err) {
        console.error('Delete failed:', err);
        alert(t('failed_delete_user'));
      }
    }
  };

  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">{t('branch_staff')}</h1>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
          >
            + {t('add_staff')}
          </button>
        </div>

        {loading ? (
          <p>{t('loading')}</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : staffList.length === 0 ? (
          <p className="text-center text-gray-600 py-4">{t('no_staff_found')}</p>
        ) : (
          <div className="bg-white shadow rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-100 text-gray-700 font-semibold">
                <tr>
                  <th className="px-6 py-3 text-left">{t('username')}</th>
                  <th className="px-6 py-3 text-left">{t('first_name')}</th>
                  <th className="px-6 py-3 text-left">{t('last_name')}</th>
                  <th className="px-6 py-3 text-left">{t('phone_number')}</th>
                  <th className="px-6 py-3 text-left">{t('role')}</th>
                  <th className="px-6 py-3 text-left">{t('branch')}</th>
                  <th className="px-6 py-3 text-left">{t('date_joined')}</th>
                  <th className="px-6 py-3 text-left">{t('last_updated')}</th>
                  <th className="px-6 py-3 text-left">{t('status')}</th>
                  <th className="px-6 py-3 text-left">{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.first_name}</td>
                    <td className="px-6 py-4">{user.last_name}</td>
                    <td className="px-6 py-4">{user.phone_number}</td>
                    <td className="px-6 py-4 capitalize">{t(`roles.${user.role}`)}</td>
                    <td className="px-6 py-4">{user.branch_id}</td>
                    <td className="px-6 py-4">{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td className="px-6 py-4">{new Date(user.updated_at).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="bg-yellow-400 text-white px-3 py-1 rounded shadow hover:bg-yellow-500"
                      >
                        {t('edit')}
                      </button>
                      <button
                        onClick={() => setResetUser(user)}
                        className="bg-indigo-500 text-white px-3 py-1 rounded shadow hover:bg-indigo-600"
                      >
                        {t('reset_password')}
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600"
                      >
                        {t('delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('edit_staff')}</h2>
              {['username', 'first_name', 'last_name', 'phone_number', 'role', 'branch_id'].map((field) => (
                <input
                  key={field}
                  type={field === 'branch_id' ? 'number' : 'text'}
                  name={field}
                  value={formData[field]}
                  onChange={handleEditChange}
                  placeholder={t(field)}
                  className="w-full mb-3 border px-4 py-2 rounded"
                />
              ))}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setEditUser(null)}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleEditSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  {t('save')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">
                {t('reset_password_for', { username: resetUser.username })}
              </h2>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={t('new_password')}
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setResetUser(null);
                    setNewPassword('');
                  }}
                  className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleResetPassword}
                  className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
                >
                  {t('reset')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Staff Modal */}
        {showAddModal && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
              <h2 className="text-xl font-bold mb-4">{t('add_new_staff')}</h2>
              <AddStaffForm
                onSuccess={(newUser) => {
                  setStaffList((prev) => [...prev, newUser]);
                  setShowAddModal(false);
                }}
                onCancel={() => setShowAddModal(false)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StaffListPage;
