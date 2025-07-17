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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-lg">
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Edit Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4 text-gray-800">

          {/* Readonly fields */}
          <div>
            <label className="block text-sm font-semibold">Username</label>
            <input
              value={user.username}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">First Name</label>
            <input
              value={user.first_name}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Last Name</label>
            <input
              value={user.last_name}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Phone Number</label>
            <input
              value={user.phone_number}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Role</label>
            <input
              value={user.role}
              readOnly
              className="w-full border border-gray-300 p-2 rounded-lg bg-gray-100 cursor-not-allowed"
            />
          </div>

          {/* Editable password */}
          <div>
            <label className="block text-sm font-semibold">New Password</label>
            <input
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              className="w-full border border-gray-300 p-2 rounded-lg"
              autoComplete="new-password"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold">Confirm New Password</label>
            <input
              name="confirm_password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              placeholder="Confirm new password"
              className="w-full border border-gray-300 p-2 rounded-lg"
              autoComplete="new-password"
            />
          </div>

          {/* Show validation error */}
          {error && (
            <div className="text-red-600 font-semibold">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-gray-300 text-gray-800 hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-red-700 text-white hover:bg-red-800"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;
