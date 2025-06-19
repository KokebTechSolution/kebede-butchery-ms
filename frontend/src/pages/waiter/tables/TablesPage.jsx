import React, { useState } from 'react';
import TableCard from '../../../components/TableCard.jsx';
import '../../../App.css';

export const tables = [
  { id: 1, status: 'Free' },
  { id: 2, status: 'Ordering' },
  { id: 3, status: 'Busy' },
  { id: 4, status: 'Free' },
  { id: 5, status: 'Busy' },
  { id: 6, status: 'Ordering' },
  { id: 7, status: 'Free' },
  { id: 8, status: 'Busy' },
  { id: 9, status: 'Ordering' },
  { id: 10, status: 'Free' },
  { id: 11, status: 'Busy' },
  { id: 12, status: 'Ordering' },
];

const TablesPage = ({ onSelectTable }) => {
  return (
    <div className="main-content white-bg">
      <div className="table-header">
        <h1>Tables</h1>
      </div>
      <div className="table-section">
        <h2 className="table-area">Dining Area</h2>
        <div className="table-grid modern">
          {tables.map(table => (
            <TableCard key={table.id} table={table} onClick={onSelectTable} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TablesPage; 