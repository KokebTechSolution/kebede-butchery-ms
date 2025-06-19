function AddInventoryItem() {
  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-bold mb-4">Add Inventory Item</h2>
      <form className="space-y-4">
        <input type="text" placeholder="Item Name" className="w-full p-2 border rounded" />
        <select className="w-full p-2 border rounded">
          <option>Category</option>
          <option>Dairy</option>
          <option>Meat</option>
        </select>
        <input type="number" placeholder="Initial Stock" className="w-full p-2 border rounded" />
        <input type="number" placeholder="Reorder Point" className="w-full p-2 border rounded" />
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Add Item</button>
      </form>
    </div>
  );
}

export default AddInventoryItem;
