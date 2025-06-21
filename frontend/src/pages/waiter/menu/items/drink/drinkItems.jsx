import React from 'react';
import { MdWineBar, MdCoffee } from 'react-icons/md';
import MenuItem from '../../../../../components/MenuItem/MenuItem';

export const coldDrinkItems = [
  { name: 'Iced Tea', desc: 'Refreshing iced tea', price: 45, icon: <MdWineBar size={28} /> },
  { name: 'Lemonade', desc: 'Classic lemonade', price: 50, icon: <MdWineBar size={28} /> },
  { name: 'Soda', desc: 'Variety of sodas', price: 40, icon: <MdWineBar size={28} /> },
  { name: 'Fruit Punch', desc: 'Sweet fruit punch', price: 55, icon: <MdWineBar size={28} /> },
];

export const hotDrinkItems = [
  { name: 'Coffee', desc: 'Freshly brewed coffee', price: 35, icon: <MdCoffee size={28} /> },
  { name: 'Tea', desc: 'Selection of teas', price: 30, icon: <MdCoffee size={28} /> },
  { name: 'Hot Chocolate', desc: 'Rich hot chocolate', price: 45, icon: <MdWineBar size={28} /> },
];

export const DrinkItems = () => {
  return (
    <div className="drink-items">
      <h2>Cold Drinks</h2>
      <div className="drink-items-grid">
        {coldDrinkItems.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </div>
      
      <h2>Hot Drinks</h2>
      <div className="drink-items-grid">
        {hotDrinkItems.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
};

export default DrinkItems; 