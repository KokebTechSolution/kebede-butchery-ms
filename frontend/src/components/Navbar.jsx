import React from 'react';
import { MdTableRestaurant, MdReceiptLong, MdPerson } from 'react-icons/md';

const Navbar = ({ onNavigate }) => (
  <div className="sidebar">
    <div className="sidebar-icon" onClick={() => onNavigate('tables')} style={{ cursor: 'pointer' }}><MdTableRestaurant size={32} /><br/>TABLE</div>
    <div className="sidebar-icon" onClick={() => onNavigate('orderDetails')} style={{ cursor: 'pointer' }}><MdReceiptLong size={32} /><br/>ORDER</div>
    <div className="sidebar-icon" onClick={() => onNavigate('profile')} style={{ cursor: 'pointer' }}><MdPerson size={32} /><br/>Profile</div>
  </div>
);

export default Navbar; 