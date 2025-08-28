import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateUser } from "../../api/stafflist";

const EditProfileModal = ({ onClose }) => {
  const { user, updateUser: updateUserInContext } = useAuth();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validation if password is being changed
    if (password.trim() !== "") {
      if (password.length < 6) {
        setError("Password must be at least 6 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
    }

    try {
      // Prepare payload with required fields always included
      const payload = {
        username: user.username,
        role: user.role,
        first_name: user.first_name,
        last_name: user.last_name,
        phone_number: user.phone_number,
      };

      // Add password only if changed
      if (password.trim() !== "") {
        payload.password = password;
      }

      const updatedUser = await updateUser(user.id, payload);
      updateUserInContext(updatedUser);
      onClose();
    } catch (error) {
      console.error("Failed to update profile", error);
      alert(error.message || "Failed to update profile");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col">
        {/* Header - Fixed */}
        <div className="p-4 pb-3 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Edit Profile</h2>
        </div>
        
        {/* Scrollable Form Content */}
        <div className="flex-1 overflow-y-auto p-4 pt-3 min-h-0">
          <form onSubmit={handleSubmit} className="space-y-3 text-gray-800">
            {/* Readonly fields */}
            <div>
              <label className="block text-sm font-semibold mb-1">Username</label>
              <input
                value={user.username}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">First Name</label>
              <input
                value={user.first_name}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Last Name</label>
              <input
                value={user.last_name}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Phone Number</label>
              <input
                value={user.phone_number}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Role</label>
              <input
                value={user.role}
                readOnly
                className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed text-sm"
              />
            </div>

            {/* Editable password */}
            <div>
              <label className="block text-sm font-semibold mb-1">New Password</label>
              <input
                name="password"
                type="password"
                value={password}
                onChange={handlePasswordChange}
                placeholder="Enter new password"
                className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                autoComplete="new-password"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1">Confirm New Password</label>
              <input
                name="confirm_password"
                type="password"
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
                placeholder="Confirm new password"
                className="w-full border border-gray-300 p-2 rounded-lg text-sm"
                autoComplete="new-password"
              />
            </div>

            {/* Show validation error */}
            {error && (
              <div className="text-red-600 font-semibold text-sm">
                {error}
              </div>
            )}
          </form>
        </div>
        
        {/* Footer - Fixed with buttons */}
        <div className="p-4 pt-3 border-t border-gray-200 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400 font-medium text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="flex-1 px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800 font-medium text-sm"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditProfileModal;
