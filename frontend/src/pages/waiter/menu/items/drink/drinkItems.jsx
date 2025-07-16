import React from 'react';
import { MdWineBar, MdCoffee } from 'react-icons/md';
import MenuItem from '../../../../../components/MenuItem/MenuItem';

export const coldbeverageItems = [
  { name: 'Iced Tea', desc: 'Refreshing iced tea', price: 45, icon: <MdWineBar size={28} />, item_type: 'beverage' },
  { name: 'Lemonade', desc: 'Classic lemonade', price: 50, icon: <MdWineBar size={28} />, item_type: 'beverage' },
  { name: 'Soda', desc: 'Variety of sodas', price: 40, icon: <MdWineBar size={28} />, item_type: 'beverage' },
  { name: 'Fruit Punch', desc: 'Sweet fruit punch', price: 55, icon: <MdWineBar size={28} />, item_type: 'beverage' },
];

export const hotbeverageItems = [
  { name: 'Coffee', desc: 'Freshly brewed coffee', price: 35, icon: <MdCoffee size={28} />, item_type: 'beverage' },
  { name: 'Tea', desc: 'Selection of teas', price: 30, icon: <MdCoffee size={28} />, item_type: 'beverage' },
  { name: 'Hot Chocolate', desc: 'Rich hot chocolate', price: 45, icon: <MdWineBar size={28} />, item_type: 'beverage' },
];

export const beverageItems = () => {
  return (
    <div className="beverage-items">
      <h2>Cold beverages</h2>
      <div className="beverage-items-grid">
        {coldbeverageItems.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </div>
      
      <h2>Hot beverages</h2>
      <div className="beverage-items-grid">
        {hotbeverageItems.map((item) => (
          <MenuItem key={item.name} item={item} />
        ))}
      </div>
    </div>
  );
};

export default beverageItems; 