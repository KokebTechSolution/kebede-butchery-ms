import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchStaffList, updateUser, deleteUser } from '../../api/stafflist';
import AddStaffForm from './AddStaffForm';

function StaffListPage() {
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    email: '',
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
        setError('Failed to load staff list.');
        setLoading(false);
      });
  }, []);

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      email: user.email,
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
      alert('Failed to update user');
    }
  };

  const handleResetPassword = async () => {
    try {
      await updateUser(resetUser.id, { password: newPassword });
      setResetUser(null);
      setNewPassword('');
      alert('Password reset successfully');
    } catch (err) {
      console.error('Password reset failed:', err);
      alert('Failed to reset password');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteUser(id);
        setStaffList(prev => prev.filter(user => user.id !== id));
      } catch (err) {
        console.error('Delete failed:', err);
        alert('Failed to delete user');
      }
    }
  };



  return (
    <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      <div className="w-full mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Branch Staff</h1>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700"
            >
              + Add Staff
            </button>

        </div>

        {loading ? (
          <p>Loading...</p>
        ) : error ? (
          <p className="text-red-600">{error}</p>
        ) : staffList.length === 0 ? (
          <p className="text-center text-gray-600 py-4">No staff members found.</p>
        ) : (
          <div className="bg-white shadow rounded-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-blue-100 text-gray-700 font-semibold">
                <tr>
                  <th className="px-6 py-3 text-left">Username</th>
                  <th className="px-6 py-3 text-left">First Name</th>
                  <th className="px-6 py-3 text-left">Last Name</th>
                  <th className="px-6 py-3 text-left">Email</th>
                  <th className="px-6 py-3 text-left">Role</th>
                  <th className="px-6 py-3 text-left">Branch</th>
                  <th className="px-6 py-3 text-left">Date Joined</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {staffList.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{user.username}</td>
                    <td className="px-6 py-4">{user.first_name}</td>
                    <td className="px-6 py-4">{user.last_name}</td>
                    <td className="px-6 py-4">{user.email}</td>
                    <td className="px-6 py-4 capitalize">{user.role}</td>
                    <td className="px-6 py-4">{user.branch_id}</td>
                    <td className="px-6 py-4">{new Date(user.date_joined).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-2">
                      <button onClick={() => handleEdit(user)} className="bg-yellow-400 text-white px-3 py-1 rounded shadow hover:bg-yellow-500">
                        Edit
                      </button>
                      <button onClick={() => setResetUser(user)} className="bg-indigo-500 text-white px-3 py-1 rounded shadow hover:bg-indigo-600">
                        Reset Password
                      </button>
                      <button onClick={() => handleDelete(user.id)} className="bg-red-500 text-white px-3 py-1 rounded shadow hover:bg-red-600">
                        Delete
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
              <h2 className="text-xl font-bold mb-4">Edit Staff</h2>
              {['username', 'first_name', 'last_name', 'email', 'role', 'branch_id'].map(field => (
                <input
                  key={field}
                  type={field === 'branch_id' ? 'number' : 'text'}
                  name={field}
                  value={formData[field]}
                  onChange={handleEditChange}
                  placeholder={field.replace('_', ' ').toUpperCase()}
                  className="w-full mb-3 border px-4 py-2 rounded"
                />
              ))}
              <div className="flex justify-end space-x-3">
                <button onClick={() => setEditUser(null)} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleEditSubmit} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {resetUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">Reset Password for {resetUser.username}</h2>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New Password"
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              <div className="flex justify-end space-x-3">
                <button onClick={() => { setResetUser(null); setNewPassword(''); }} className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400">Cancel</button>
                <button onClick={handleResetPassword} className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700">Reset</button>
              </div>
            </div>
          </div>
        )}



        {showAddModal && (
                    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
                      <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Add New Staff</h2>
                        <AddStaffForm
                          onSuccess={(newUser) => {
                            setStaffList(prev => [...prev, newUser]); // Add to list
                            setShowAddModal(false); // Close modal
                          }}
                          onCancel={() => setShowAddModal(false)} // Close on cancel
                        />
                      </div>
                    </div>
                  )}

              </div>
            </div>
          );
        }

export default StaffListPage;
