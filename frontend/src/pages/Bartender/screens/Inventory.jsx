import React, { useState, useEffect } from 'react';
import MenuForm from '../../MenuManagment/MenuForm';
import { fetchMenuItems, deleteMenuItem } from '../../../api/menu';

const Inventory = () => {
  const [showForm, setShowForm] = useState(false);
  const [drinks, setDrinks] = useState([]);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [selectedDrink, setSelectedDrink] = useState(null);
  const [showDeleteId, setShowDeleteId] = useState(null);

  useEffect(() => {
    const loadDrinks = async () => {
      const items = await fetchMenuItems();
      setDrinks(items.filter(item => item.item_type === 'drink'));
    };
    loadDrinks();
  }, [refreshFlag]);

  const handleEdit = (drink) => {
    setSelectedDrink(drink);
    setShowForm(true);
  };

  const handleDelete = async (drink) => {
    if (!window.confirm(`Are you sure you want to delete "${drink.name}"?`)) return;
    await deleteMenuItem(drink.id);
    setRefreshFlag(f => f + 1);
  };

  return (
    <div style={{ maxWidth: 600, margin: '32px auto', padding: 24, background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2>Drink Inventory</h2>
        <button onClick={() => { setShowForm(true); setSelectedDrink(null); }} className="bg-blue-500 text-white px-4 py-2 rounded">Add Drink</button>
      </div>
      {showForm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.3)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.10)', padding: 24, minWidth: 400, maxWidth: '90vw', maxHeight: '90vh', overflowY: 'auto' }}>
            <MenuForm
              refreshMenu={() => setRefreshFlag(f => f + 1)}
              closeModal={() => setShowForm(false)}
              clearSelection={() => setSelectedDrink(null)}
              selectedItem={selectedDrink}
              forceDrinkOnly={true}
            />
          </div>
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <h3 className="font-semibold mb-2">Drinks in Menu</h3>
        <ul>
          {drinks.map(drink => (
            <li key={drink.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="font-medium">{drink.name}</span> - ETB {drink.price}
              <span>
                <button onClick={() => handleEdit(drink)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Edit</button>
                <button onClick={() => handleDelete(drink)} className="bg-red-500 text-white px-2 py-1 rounded">Delete</button>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Inventory; 