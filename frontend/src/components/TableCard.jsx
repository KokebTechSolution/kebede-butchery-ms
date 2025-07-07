import React from 'react';
import { MdTableRestaurant } from 'react-icons/md';

const getStatusLabel = (status) => {
  switch (status) {
    case 'available':
      return 'available';
    case 'occupied':
      return 'ordering';
    case 'ready_to_pay':
      return 'ready to pay';
    default:
      return status;
  }
};

const TableCard = ({ table, onClick }) => (
  <div
    className="table-card modern"
    onClick={() => onClick(table)}
    style={{ cursor: 'pointer' }}
  >
    <div className="table-card-title">
      <MdTableRestaurant size={28} style={{ marginRight: 8, verticalAlign: 'middle' }} />
      <span>Table {table.id}</span>
    </div>
    <div className="table-card-status">{getStatusLabel(table.status)}</div>
  </div>
);

export default TableCard; 