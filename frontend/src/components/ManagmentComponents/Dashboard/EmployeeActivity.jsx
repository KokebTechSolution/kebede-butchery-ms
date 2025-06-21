import React from "react";

export default function EmployeeActivity() {
  // Mock employee stats
  const activeStaff = 12;
  const ordersProcessed = 215;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Employee Activity</h3>
      <p>
        <strong>{activeStaff}</strong> active staff members
      </p>
      <p>
        <strong>{ordersProcessed}</strong> orders processed today
      </p>
    </div>
  );
}
