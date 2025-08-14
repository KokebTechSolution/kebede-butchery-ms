import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search } from 'lucide-react';

const ResponsiveTable = ({
  columns,
  data,
  onRowClick,
  searchable = false,
  filterable = false,
  sortable = false,
  className = "",
  cardView = false,
  showCardViewToggle = true
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [isCardView, setIsCardView] = useState(cardView);

  // Filter and search data
  const filteredData = data.filter(item => {
    if (!searchTerm) return true;
    return columns.some(column => {
      const value = item[column.key];
      return value && value.toString().toLowerCase().includes(searchTerm.toLowerCase());
    });
  });

  // Sort data
  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0;
    
    const aValue = a[sortColumn];
    const bValue = b[sortColumn];
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (columnKey) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ columnKey }) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className={`${className}`}>
      {/* Table Controls */}
      <div className="mb-4 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        {/* Search */}
        {searchable && (
          <div className="relative max-w-xs">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
        )}

        {/* View Toggle */}
        {showCardViewToggle && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsCardView(false)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                !isCardView
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setIsCardView(true)}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isCardView
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              Cards
            </button>
          </div>
        )}
      </div>

      {/* Card View */}
      {isCardView ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedData.map((item, index) => (
            <div
              key={index}
              onClick={() => onRowClick && onRowClick(item)}
              className={`bg-white rounded-lg shadow-mobile p-4 border border-gray-200 ${
                onRowClick ? 'cursor-pointer hover:shadow-mobile-lg transition-shadow' : ''
              }`}
            >
              {columns.map((column) => (
                <div key={column.key} className="mb-3 last:mb-0">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {column.label}
                  </div>
                  <div className="text-sm text-gray-900">
                    {column.render ? column.render(item[column.key], item) : item[column.key]}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="overflow-x-auto">
          <table className="mobile-table w-full">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`${
                      sortable ? 'cursor-pointer hover:bg-gray-100' : ''
                    }`}
                    onClick={() => sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center space-x-1">
                      <span>{column.label}</span>
                      {sortable && <SortIcon columnKey={column.key} />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => (
                <tr
                  key={index}
                  onClick={() => onRowClick && onRowClick(item)}
                  className={`${
                    onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''
                  }`}
                >
                  {columns.map((column) => (
                    <td key={column.key}>
                      {column.render ? column.render(item[column.key], item) : item[column.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchTerm ? 'No results found for your search.' : 'No data available.'}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveTable; 