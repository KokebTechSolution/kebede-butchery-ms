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
      console.log("Response content-type:", response.headers['content-type']);
      console.log("Response data:", response.data);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg sm:text-xl font-semibold text-gray-700">
          📝 Pending Staff Requests
        </h3>
        <div className="text-sm text-gray-500">
          {requests.length} pending
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">Loading requests...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 text-sm sm:text-base">
            No pending requests at the moment.
          </div>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {requests.map((req) => (
            <div
              key={req.id}
              className="bg-gray-50 rounded-lg p-4 sm:p-5 border border-gray-200 hover:shadow-mobile transition-shadow"
            >
              <div className="space-y-3">
                {/* Staff Info */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <FaUserTie className="text-blue-500 text-lg" />
                    <div>
                      <div className="font-medium text-gray-900 text-sm sm:text-base">
                        {req.staff_name} - {req.staff_role}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-gray-600 text-sm">
                        <FaBoxes className="text-gray-500" />
                        <span>
                          Requested: <strong>{req.quantity}</strong> units of{" "}
                          <span className="text-indigo-600 font-semibold italic">{req.item_name}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors text-sm font-medium"
                    >
                      <MdOutlineCheckCircle size={16} />
                      <span className="hidden sm:inline">Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(req.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm font-medium"
                    >
                      <MdOutlineCancel size={16} />
                      <span className="hidden sm:inline">Reject</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
