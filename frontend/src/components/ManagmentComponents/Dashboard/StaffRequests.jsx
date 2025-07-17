import React, { useEffect, useState } from "react";
import { FaUserTie, FaBoxes } from "react-icons/fa";
import { MdOutlineCheckCircle, MdOutlineCancel } from "react-icons/md";
import axiosInstance from "../../../api/axiosInstance"; // adjust import path accordingly

export default function StaffRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = "requests/"; // relative path for axiosInstance baseURL

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const response = await axiosInstance.get(API_URL);
      setRequests(response.data);
    } catch (error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axiosInstance.post(`${API_URL}${id}/approve/`);
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error approving request:", error);
    }
  };

  const handleReject = async (id) => {
    try {
      await axiosInstance.post(`${API_URL}${id}/reject/`);
      setRequests((prev) => prev.filter((req) => req.id !== id));
    } catch (error) {
      console.error("Error rejecting request:", error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 md:p-8 max-w-full sm:max-w-lg md:max-w-2xl mx-auto">
      <h3 className="text-lg sm:text-xl md:text-2xl font-semibold text-gray-700 mb-4">
        📝 Pending Staff Requests
      </h3>

      {loading ? (
        <p className="text-gray-500 italic text-sm md:text-base">Loading requests...</p>
      ) : requests.length === 0 ? (
        <p className="text-gray-500 italic text-sm md:text-base">
          No pending requests at the moment.
        </p>
      ) : (
        <ul className="space-y-4">
          {requests.map((req) => (
            <li
              key={req.id}
              className="border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex flex-col gap-4">
                {/* Staff Info */}
                <div className="text-sm sm:text-base text-gray-700">
                  <div className="flex items-center gap-2 font-medium">
                    <FaUserTie className="text-blue-500" />
                    {req.staff_name} - {req.staff_role}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-gray-600">
                    <FaBoxes className="text-gray-500" />
                    Requested: <strong>{req.quantity}</strong> units of{" "}
                    <span className="text-indigo-600 font-semibold italic">{req.item_name}</span>
                  </div>
                </div>

                {/* Buttons stacked vertically */}
                <div className="flex flex-col gap-3 w-full">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-green-700 transition"
                  >
                    <MdOutlineCheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 text-sm font-semibold rounded-md hover:bg-red-700 transition"
                  >
                    <MdOutlineCancel size={18} />
                    Reject
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
