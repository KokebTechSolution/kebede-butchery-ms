function StaffListPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Staff List</h1>
      <table className="min-w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Role</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2">Ali Kibret</td>
            <td className="p-2">Waiter</td>
            <td className="p-2">Active</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default StaffListPage;
