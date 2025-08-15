import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetUserPassword, fetchStaffList, updateUser, deleteUser, fetchBranches } from '../../api/stafflist';
import AddStaffForm from './AddStaffForm';
import { FaEdit, FaKey, FaSearch, FaTimes, FaChevronLeft, FaChevronRight, FaSync } from 'react-icons/fa';

function StaffListPage() {
  const { t } = useTranslation();
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter staff based on search term
  const filteredStaff = useMemo(() => {
    return staffList.filter(staff => 
      Object.values(staff).some(
        value => value && 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [staffList, searchTerm]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStaff = filteredStaff.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredStaff.length / itemsPerPage);

  const [editUser, setEditUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  const [formData, setFormData] = useState({
    username: '',
    phone_number: '',
    role: '',
    first_name: '',
    last_name: '',
    branch: '',
    is_active: true,
  });

  const [branches, setBranches] = useState([]);
  const [roles] = useState([
    { value: 'waiter', label: 'Waiter' },
    { value: 'bartender', label: 'Bartender' },
    { value: 'meat', label: 'Meat Counter' },
    { value: 'cashier', label: 'Cashier' },
    { value: 'manager', label: 'Branch Manager' },
    { value: 'owner', label: 'Owner' },
  ]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [staffData, branchesData] = await Promise.all([
          fetchStaffList(),
          fetchBranches()
        ]);
        setStaffList(staffData);
        // Ensure branches is always an array
        setBranches(Array.isArray(branchesData) ? branchesData : []);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError(t('failed_load_staff_list'));
        setLoading(false);
        // Set empty array for branches on error
        setBranches([]);
      }
    };
    
    loadData();
  }, [t]);

  const handleEdit = (user) => {
    setEditUser(user);
    setFormData({
      username: user.username,
      phone_number: user.phone_number,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      branch: user.branch?.id || user.branch,
      is_active: user.is_active,
    });
  };

  const handleEditChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleEditSubmit = async () => {
    // Basic validation
    if (!formData.username || !formData.first_name || !formData.last_name || !formData.role || !formData.branch) {
      alert(t('please_fill_all_required_fields'));
      return;
    }
    
    try {
      const updated = await updateUser(editUser.id, formData);
      // Refresh the staff list to get the latest data
      const freshStaffList = await fetchStaffList();
      setStaffList(freshStaffList);
      setEditUser(null);
      alert(t('user_updated_successfully'));
    } catch (err) {
      console.error('Update failed:', err);
      alert(err.message || t('failed_update_user'));
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      alert(t('password_too_short'));
      return;
    }
    
    try {
      await resetUserPassword(resetUser.id, newPassword);
      setResetUser(null);
      setNewPassword('');
      alert(t('password_reset_success'));
    } catch (err) {
      console.error('Password reset failed:', err);
      alert(err.message || t('failed_reset_password'));
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

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const [staffData, branchesData] = await Promise.all([
        fetchStaffList(),
        fetchBranches()
      ]);
      setStaffList(staffData);
      setBranches(branchesData);
    } catch (err) {
      console.error('Refresh failed:', err);
      alert(t('failed_refresh_data'));
    } finally {
      setLoading(false);
    }
  };

  // Render staff card for mobile view
  const renderStaffCard = (user) => (
    <div key={user.id} className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{user.first_name} {user.last_name}</h3>
          <p className="text-gray-600 text-sm">@{user.username}</p>
          <p className="text-gray-600 text-sm">{user.phone_number}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {user.is_active ? t('active') : t('inactive')}
        </span>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 text-sm">
        <p className="text-gray-700"><span className="font-medium">{t('role')}:</span> {t(`roles.${user.role}`)}</p>
        <p className="text-gray-700"><span className="font-medium">{t('branch')}:</span> {user.branch?.name || user.branch}</p>
        <p className="text-gray-500 text-xs mt-2">
          {new Date(user.date_joined).toLocaleDateString()}
        </p>
      </div>
      <div className="mt-3 flex space-x-2">
        <button
          onClick={() => handleEdit(user)}
          className="flex-1 bg-yellow-100 text-yellow-700 p-2 rounded text-sm flex items-center justify-center"
          aria-label={t('edit')}
        >
          <FaEdit className="mr-1" /> {t('edit')}
        </button>
        <button
          onClick={() => setResetUser(user)}
          className="flex-1 bg-blue-100 text-blue-700 p-2 rounded text-sm flex items-center justify-center"
          aria-label={t('reset_password')}
        >
          <FaKey className="mr-1" /> {t('reset_password')}
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-3 sm:p-6 bg-gradient-to-br from-blue-50 to-purple-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">{t('branch_staff')}</h1>
            <p className="text-gray-600 text-sm mt-1">
              {filteredStaff.length} {t('staff_members')}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative flex-grow max-w-md">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t('search_staff')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                aria-label={t('search_staff')}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  aria-label={t('clear_search')}
                >
                  <FaTimes className="text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleRefresh}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 flex items-center justify-center"
                title={t('refresh')}
              >
                <FaSync className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 whitespace-nowrap"
              >
                + {t('add_staff')}
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 border-l-4 border-red-500 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl shadow">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{searchTerm ? t('no_matching_staff') : t('no_staff_found')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? t('try_different_search') : t('no_staff_members_yet')}
            </p>
            <div className="mt-6">
                          <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleRefresh}
                disabled={loading}
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaSync className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                {t('refresh')}
              </button>
              <button
                type="button"
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                {t('add_staff')}
              </button>
            </div>
            </div>
          </div>
        ) : isMobile ? (
          // Mobile card view
          <div className="space-y-3">
            {currentStaff.map(user => renderStaffCard(user))}
          </div>
        ) : (
          // Desktop table view
          <div className="bg-white shadow rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('name')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('role')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('branch')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('status')}
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentStaff.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-medium">
                              {user.first_name?.[0]?.toUpperCase()}{user.last_name?.[0]?.toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 capitalize">{t(`roles.${user.role}`)}</div>
                        <div className="text-sm text-gray-500">{user.phone_number}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{user.branch?.name || user.branch}</div>
                        <div className="text-xs text-gray-500">
                          {new Date(user.date_joined).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex space-x-2 justify-end">
                          <button
                            onClick={() => handleEdit(user)}
                            className="text-blue-600 hover:text-blue-900"
                            title={t('edit')}
                          >
                            <FaEdit className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setResetUser(user)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title={t('reset_password')}
                          >
                            <FaKey className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t('previous')}
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md ${
                      currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {t('next')}
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      {t('showing')} <span className="font-medium">{indexOfFirstItem + 1}</span> {t('to')} <span className="font-medium">
                        {Math.min(indexOfLastItem, filteredStaff.length)}
                      </span> {t('of')} <span className="font-medium">{filteredStaff.length}</span> {t('results')}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => setCurrentPage(1)}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">{t('first')}</span>
                        <FaChevronLeft className="h-5 w-5" />
                        <FaChevronLeft className="h-5 w-5 -ml-1" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === 1 ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">{t('previous')}</span>
                        <FaChevronLeft className="h-5 w-5" />
                      </button>
                      
                      {/* Page numbers */}
                      <div className="hidden md:flex">
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNum;
                          if (totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (currentPage <= 3) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                          } else {
                            pageNum = currentPage - 2 + i;
                          }
                          
                          return (
                            <button
                              key={pageNum}
                              onClick={() => setCurrentPage(pageNum)}
                              className={`relative inline-flex items-center px-4 py-2 border ${
                                currentPage === pageNum 
                                  ? 'z-10 bg-blue-50 border-blue-500 text-blue-600' 
                                  : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                              } text-sm font-medium`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>
                      
                      <button
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">{t('next')}</span>
                        <FaChevronRight className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => setCurrentPage(totalPages)}
                        disabled={currentPage === totalPages}
                        className={`relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                          currentPage === totalPages ? 'text-gray-300' : 'text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        <span className="sr-only">{t('last')}</span>
                        <FaChevronRight className="h-5 w-5" />
                        <FaChevronRight className="h-5 w-5 -mr-1" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>

        )}

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-md">
              <h2 className="text-xl font-bold mb-4">{t('edit_staff')}</h2>
              
              {/* Username */}
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleEditChange}
                placeholder={t('username')}
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              
              {/* First Name */}
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleEditChange}
                placeholder={t('first_name')}
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              
              {/* Last Name */}
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleEditChange}
                placeholder={t('last_name')}
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              
              {/* Phone Number */}
              <input
                type="text"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleEditChange}
                placeholder={t('phone_number')}
                className="w-full mb-3 border px-4 py-2 rounded"
              />
              
              {/* Role Dropdown */}
              <select
                name="role"
                value={formData.role}
                onChange={handleEditChange}
                className="w-full mb-3 border px-4 py-2 rounded"
              >
                <option value="">{t('select_role')}</option>
                {roles.map(role => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              
              {/* Branch Dropdown */}
              <select
                name="branch"
                value={formData.branch}
                onChange={handleEditChange}
                className="w-full mb-3 border px-4 py-2 rounded"
              >
                <option value="">{t('select_branch')}</option>
                {Array.isArray(branches) && branches.map(branch => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>
              
              {/* Active Status */}
              <div className="mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.checked }))}
                    className="mr-2"
                  />
                  {t('is_active')}
                </label>
              </div>
              
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('new_password')}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('enter_new_password')}
                  className="w-full border px-4 py-2 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  minLength="6"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('password_min_length')}
                </p>
              </div>
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
                  disabled={!newPassword || newPassword.length < 6}
                  className={`px-4 py-2 rounded ${
                    newPassword && newPassword.length >= 6
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
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
