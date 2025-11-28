import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import DataTable from '../../components/Common/DataTable';
import './Reports.css';

const Reports = () => {
  const { user, currentShop } = useAuth();
  const [reportType, setReportType] = useState('sales');
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin or manager
  const isAdminOrManager = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'manager';
  }, [user]);

  // Get user's shop ID
  const userShopId = useMemo(() => {
    return user?.shop_id || currentShop?.id || null;
  }, [user, currentShop]);

  // Build filters with shop_id for staff
  const effectiveFilters = useMemo(() => {
    const baseFilters = { ...filters };
    // Staff only sees their shop's reports
    if (!isAdminOrManager && userShopId) {
      baseFilters.shop_id = userShopId;
    }
    return baseFilters;
  }, [filters, isAdminOrManager, userShopId]);

  const { data, isLoading } = useQuery(
    ['report', reportType, effectiveFilters],
    () => {
      switch (reportType) {
        case 'sales':
          return reportService.getSalesReport(effectiveFilters);
        case 'stock':
          return reportService.getStockReport(effectiveFilters);
        case 'products':
          return reportService.getProductSalesReport(effectiveFilters);
        case 'payments':
          return reportService.getPaymentReport(effectiveFilters);
        default:
          return reportService.getSalesReport(effectiveFilters);
      }
    }
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(row => 
      Object.values(row).some(val => 
        val != null && String(val).toLowerCase().includes(term)
      )
    );
  }, [data, searchTerm]);

  const getColumns = () => {
    switch (reportType) {
      case 'sales':
        return [
          { key: 'date', label: 'Date' },
          { key: 'shop_name', label: 'Shop' },
          { key: 'total_sales', label: 'Total Sales' },
          { 
            key: 'total_amount', 
            label: 'Total Amount', 
            render: (value, row) => {
              const amount = parseFloat(row?.total_amount || value || 0);
              return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          },
        ];
      case 'stock':
        return [
          { key: 'shop_name', label: 'Shop' },
          { key: 'product_name', label: 'Product' },
          { key: 'quantity', label: 'Quantity' },
          { key: 'stock_status', label: 'Status' },
        ];
      case 'products':
        return [
          { key: 'product_name', label: 'Product' },
          { key: 'total_quantity_sold', label: 'Quantity Sold' },
          { 
            key: 'total_revenue', 
            label: 'Revenue', 
            render: (value, row) => {
              const revenue = parseFloat(row?.total_revenue || value || 0);
              return `Ksh ${revenue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          },
        ];
      case 'payments':
        return [
          { key: 'payment_method', label: 'Method' },
          { key: 'date', label: 'Date' },
          { key: 'transaction_count', label: 'Transactions' },
          { 
            key: 'total_amount', 
            label: 'Total', 
            render: (value, row) => {
              const amount = parseFloat(row?.total_amount || value || 0);
              return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            }
          },
        ];
      default:
        return [];
    }
  };

  return (
    <div className="page-container">
      <h1>Reports</h1>
      <div style={{ marginBottom: '20px' }}>
        <label>Report Type: </label>
        <select value={reportType} onChange={(e) => setReportType(e.target.value)}>
          <option value="sales">Sales Report</option>
          <option value="stock">Stock Report</option>
          <option value="products">Product Sales Report</option>
          <option value="payments">Payment Report</option>
        </select>
      </div>
      <DataTable
        data={filteredData}
        columns={getColumns()}
        isLoading={isLoading}
        searchable={true}
        searchPlaceholder={`Search ${reportType} report...`}
        onSearch={setSearchTerm}
        onExport={(data) => {
          const columns = getColumns();
          const csv = [
            columns.map(c => c.label).join(','),
            ...data.map(row => 
              columns.map(col => {
                const val = row[col.key];
                if (col.render) {
                  const result = col.render(val, row);
                  return typeof result === 'string' ? result.replace(/,/g, ';') : (val || '');
                }
                return val != null ? String(val).replace(/,/g, ';') : '';
              }).join(',')
            )
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage={`No ${reportType} report data found`}
        emptyIcon="📊"
      />
    </div>
  );
};

export default Reports;


