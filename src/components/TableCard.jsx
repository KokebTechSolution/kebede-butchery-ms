import React from 'react';
import { MdTableRestaurant } from 'react-icons/md';

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
    <div className="table-card-status">{table.status}</div>
  </div>
);

export default TableCard; 