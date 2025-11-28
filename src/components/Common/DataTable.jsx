import React, { useState, useMemo, useEffect } from 'react';
import './DataTable.css';

const DataTable = ({ 
  data = [], 
  columns = [], 
  isLoading = false, 
  pagination = null, 
  onPageChange = () => {},
  emptyMessage = 'No data available',
  emptyIcon = '📋',
  onExport = null,
  onSort = null,
  defaultSort = null,
  searchable = false,
  onSearch = null,
  searchPlaceholder = 'Search...',
  mobileView = 'table' // 'table' or 'cards'
}) => {
  const [sortConfig, setSortConfig] = useState(defaultSort || { key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(pagination?.page || 1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle sorting
  const handleSort = (key) => {
    if (!onSort) {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
    } else {
      let direction = 'asc';
      if (sortConfig.key === key && sortConfig.direction === 'asc') {
        direction = 'desc';
      }
      setSortConfig({ key, direction });
      onSort(key, direction);
    }
  };

  // Handle export
  const handleExport = () => {
    if (onExport) {
      onExport(data);
    } else {
      // Default CSV export
      const headers = columns.map(col => col.label).join(',');
      const rows = data.map(row => 
        columns.map(col => {
          const value = row[col.key];
          return value != null ? String(value).replace(/,/g, ';') : '';
        }).join(',')
      ).join('\n');
      
      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    }
  };

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Filtered and sorted data
  const processedData = useMemo(() => {
    let result = [...data];

    // Client-side sorting (if not handled by server)
    if (!onSort && sortConfig.key) {
      result.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return result;
  }, [data, sortConfig, onSort]);

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="data-table">
        <div className="data-table-loading">
          <div className="skeleton-loader">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        </div>
      </div>
    );
  }

  // Check if it's an empty state (but still show toolbar for search)
  const isEmpty = !isLoading && processedData.length === 0;
  const isSearchActive = searchTerm && searchTerm.trim().length > 0;

  // Pagination helpers
  const handlePageChange = (newPage) => {
    if (pagination) {
      onPageChange(newPage);
    } else {
      setCurrentPage(newPage);
    }
  };

  const totalPages = pagination?.totalPages || Math.ceil(processedData.length / itemsPerPage);
  const currentPageData = pagination ? processedData : processedData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className={`data-table ${isMobile && mobileView === 'cards' ? 'show-cards-mobile' : ''}`}>
      {/* Toolbar - Always show to allow clearing search */}
      <div className="data-table-toolbar">
        {searchable && (
          <div className="data-table-search">
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button
                onClick={() => handleSearch('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '4px 8px',
                  color: '#6b7280',
                  lineHeight: 1
                }}
                title="Clear search"
              >
                ×
              </button>
            )}
          </div>
        )}
        {onExport && !isEmpty && (
          <button className="export-button" onClick={handleExport}>
            📥 Export CSV
          </button>
        )}
      </div>

      {/* Empty state message when no data */}
      {isEmpty ? (
        <div className="data-table-empty">
          <div className="empty-icon">{emptyIcon}</div>
          <div className="empty-message">
            {isSearchActive 
              ? `No results found for "${searchTerm}". Try a different search term or clear the search.`
              : emptyMessage
            }
          </div>
          {isSearchActive && (
            <button
              onClick={() => handleSearch('')}
              style={{
                marginTop: '16px',
                padding: '8px 16px',
                background: '#667eea',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
            >
              Clear Search
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="data-table-wrapper" style={isMobile && mobileView === 'table' ? {} : {}}>
            <table style={isMobile && mobileView === 'table' ? { display: 'table' } : {}}>
              <thead>
                <tr>
                  {columns.map((col) => {
                    const isSortable = col.sortable !== false && (onSort || true);
                    const isSorted = sortConfig.key === col.key;
                    
                    return (
                      <th 
                        key={col.key}
                        className={isSortable ? 'sortable' : ''}
                        onClick={() => isSortable && handleSort(col.key)}
                        style={{ cursor: isSortable ? 'pointer' : 'default' }}
                      >
                        <div className="th-content">
                          <span>{col.label}</span>
                          {isSortable && (
                            <span className="sort-indicator">
                              {isSorted ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '⇅'}
                            </span>
                          )}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {currentPageData.map((row, index) => (
                  <tr key={row.id || index}>
                    {columns.map((col) => {
                      const value = row[col.key];
                      if (col.render) {
                        const result = col.render(value, row);
                        if (result && typeof result === 'object' && !React.isValidElement(result)) {
                          return (
                            <td key={col.key}>
                              {String(result)}
                            </td>
                          );
                        }
                        return (
                          <td key={col.key}>
                            {result}
                          </td>
                        );
                      }
                      if (value && typeof value === 'object' && !React.isValidElement(value)) {
                        return (
                          <td key={col.key}>
                            {JSON.stringify(value)}
                          </td>
                        );
                      }
                      return (
                        <td key={col.key}>
                          {value != null ? value : '-'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          {isMobile && mobileView === 'cards' && (
            <div className="data-table-mobile-cards">
              {currentPageData.map((row, index) => {
                // Get the first column (usually most important like Name)
                const firstCol = columns.find(col => col.key !== 'actions');
                const firstColValue = firstCol ? (() => {
                  const value = row[firstCol.key];
                  if (firstCol.render) {
                    const result = firstCol.render(value, row);
                    if (React.isValidElement(result)) {
                      return result;
                    } else if (result && typeof result === 'object') {
                      return String(result);
                    }
                    return result || '-';
                  }
                  return value != null ? value : '-';
                })() : null;

                return (
                  <div key={row.id || index} className="data-table-mobile-card">
                    {/* First column as header */}
                    {firstCol && firstColValue && (
                      <div className="mobile-card-header">
                        <div className="mobile-card-header-label">{firstCol.label}</div>
                        <div className="mobile-card-header-value">{firstColValue}</div>
                      </div>
                    )}
                    
                    {/* Other columns */}
                    {columns
                      .filter(col => col.key !== 'actions' && col.key !== firstCol?.key)
                      .map((col) => {
                        const value = row[col.key];
                        let displayValue;
                        
                        if (col.render) {
                          const result = col.render(value, row);
                          if (React.isValidElement(result)) {
                            displayValue = result;
                          } else if (result && typeof result === 'object') {
                            displayValue = String(result);
                          } else {
                            displayValue = result || '-';
                          }
                        } else if (value && typeof value === 'object' && !React.isValidElement(value)) {
                          displayValue = JSON.stringify(value);
                        } else {
                          displayValue = value != null ? value : '-';
                        }

                        return (
                          <div key={col.key} className="mobile-card-row">
                            <div className="mobile-card-label">{col.label}</div>
                            <div className="mobile-card-value">{displayValue}</div>
                          </div>
                        );
                      })}
                    
                    {/* Actions */}
                    {(() => {
                      const actionsCol = columns.find(col => col.key === 'actions');
                      if (actionsCol && actionsCol.render) {
                        const actions = actionsCol.render(null, row);
                        if (React.isValidElement(actions)) {
                          return (
                            <div className="mobile-card-actions">
                              {actions}
                            </div>
                          );
                        }
                      }
                      return null;
                    })()}
                  </div>
                );
              })}
            </div>
          )}

      {/* Pagination */}
      {(pagination || processedData.length > itemsPerPage) && (
        <div className="pagination">
          <div className="pagination-info">
            Showing {pagination ? 
              `${((pagination.page - 1) * (pagination.limit || 10)) + 1}-${Math.min(pagination.page * (pagination.limit || 10), pagination.total || 0)}` :
              `${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, processedData.length)}`
            } of {pagination?.total || processedData.length} entries
          </div>
          <div className="pagination-controls">
            {!pagination && (
              <select 
                value={itemsPerPage} 
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="items-per-page"
              >
                <option value={10}>10 per page</option>
                <option value={25}>25 per page</option>
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
              </select>
            )}
            <button
              onClick={() => handlePageChange((pagination?.page || currentPage) - 1)}
              disabled={pagination ? !pagination.hasPrev : currentPage === 1}
              className="pagination-btn"
            >
              Previous
            </button>
            <div className="pagination-pages">
              {pagination && pagination.totalPages > 1 && (
                <>
                  {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                    let pageNum;
                    if (pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNum = pagination.totalPages - 4 + i;
                    } else {
                      pageNum = pagination.page - 2 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`pagination-btn ${pagination.page === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </>
              )}
            </div>
            <button
              onClick={() => handlePageChange((pagination?.page || currentPage) + 1)}
              disabled={pagination ? !pagination.hasNext : currentPage >= totalPages}
              className="pagination-btn"
            >
              Next
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default DataTable;
