function InventoryListPage() {
  return (
    <div>
      <h1 className="text-xl font-bold mb-4">Inventory List</h1>
      <table className="min-w-full bg-white rounded-xl overflow-hidden">
        <thead className="bg-blue-100">
          <tr>
            <th className="p-2 text-left">Item Name</th>
            <th className="p-2 text-left">Stock</th>
            <th className="p-2 text-left">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-2">Milk</td>
            <td className="p-2">5</td>
            <td className="p-2 text-red-600">Low Stock</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default InventoryListPage;
