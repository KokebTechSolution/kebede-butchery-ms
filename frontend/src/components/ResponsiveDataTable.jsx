import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Filter, Search, Eye, Edit, Trash2 } from 'lucide-react';

const ResponsiveDataTable = ({
  columns,
  data,
  onRowClick,
  onEdit,
  onDelete,
  searchable = false,
  filterable = false,
  sortable = false,
  className = "",
  cardView = false,
  showCardViewToggle = true,
  actions = [],
  emptyMessage = "No data available",
  loading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [isCardView, setIsCardView] = useState(cardView);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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

  // Pagination
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, startIndex + itemsPerPage);

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

  const handleAction = (action, item) => {
    if (action.onClick) {
      action.onClick(item);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

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
          {paginatedData.map((item, index) => (
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
              
              {/* Actions */}
              {actions.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-200 flex space-x-2">
                  {actions.map((action, actionIndex) => (
                    <button
                      key={actionIndex}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(action, item);
                      }}
                      className={`p-2 rounded-lg text-sm font-medium transition-colors ${
                        action.variant === 'danger' 
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : action.variant === 'warning'
                          ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                          : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {action.icon}
                      <span className="ml-1">{action.label}</span>
                    </button>
                  ))}
                </div>
              )}
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
                {actions.length > 0 && (
                  <th className="text-left px-3 py-3 text-sm font-medium text-gray-900 border-b border-gray-200">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {paginatedData.map((item, index) => (
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
                  
                  {/* Actions */}
                  {actions.length > 0 && (
                    <td className="px-3 py-3 text-sm text-gray-900 border-b border-gray-200">
                      <div className="flex space-x-2">
                        {actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAction(action, item);
                            }}
                            className={`p-1 rounded transition-colors ${
                              action.variant === 'danger' 
                                ? 'text-red-600 hover:bg-red-50'
                                : action.variant === 'warning'
                                ? 'text-yellow-600 hover:bg-yellow-50'
                                : 'text-blue-600 hover:bg-blue-50'
                            }`}
                          >
                            {action.icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-3 py-1 text-sm border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {sortedData.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            {searchTerm ? 'No results found for your search.' : emptyMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveDataTable; 