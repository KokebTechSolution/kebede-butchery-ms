import React from 'react';
import { MdTableRestaurant, MdRestaurantMenu, MdReceiptLong, MdChatBubbleOutline } from 'react-icons/md';

const Navbar = ({ onNavigate }) => (
  <div className="sidebar">
    <div className="sidebar-icon" onClick={() => onNavigate('tables')} style={{ cursor: 'pointer' }}><MdTableRestaurant size={32} /><br/>TABLE MANAGE</div>
    <div className="sidebar-icon" onClick={() => onNavigate('menu')} style={{ cursor: 'pointer' }}><MdRestaurantMenu size={32} /><br/>MENU</div>
    <div className="sidebar-icon" onClick={() => onNavigate('order')} style={{ cursor: 'pointer' }}><MdReceiptLong size={32} /><br/>ORDER</div>
    <div className="sidebar-icon"><MdChatBubbleOutline size={32} /><br/>CUSTOM</div>
  </div>
);

export default Navbar; 