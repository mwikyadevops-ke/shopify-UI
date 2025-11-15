import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { stockService } from '../../services/stockService';
import DataTable from '../../components/Common/DataTable';

const StockTransactions = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery(
    ['stock-transactions', page, filters],
    () => stockService.getTransactions({ ...filters, page, limit: 10 })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(transaction => 
      transaction.product_name?.toLowerCase().includes(term) ||
      transaction.shop_name?.toLowerCase().includes(term) ||
      transaction.transaction_type?.toLowerCase().includes(term) ||
      transaction.created_by_name?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const columns = [
    { key: 'product_name', label: 'Product' },
    { key: 'shop_name', label: 'Shop' },
    { key: 'transaction_type', label: 'Type' },
    { key: 'quantity', label: 'Quantity' },
    { key: 'created_by_name', label: 'Created By' },
    { 
      key: 'created_at', 
      label: 'Date', 
      render: (value, row) => {
        if (!row && !value) return '-';
        const dateValue = row?.created_at || value;
        if (!dateValue) return '-';
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '-';
          return date.toLocaleDateString('en-KE');
        } catch (e) {
          return '-';
        }
      }
    },
  ];

  return (
    <div className="page-container">
      <h1>Stock Transactions</h1>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search transactions by product, shop, type, or creator..."
        onExport={(data) => {
          const csv = [
            ['Product', 'Shop', 'Type', 'Quantity', 'Created By', 'Date'].join(','),
            ...data.map(t => [
              t.product_name || '',
              t.shop_name || '',
              t.transaction_type || '',
              t.quantity || '0',
              t.created_by_name || '',
              t.created_at || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stock-transactions-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No stock transactions found"
        emptyIcon="📋"
      />
    </div>
  );
};

export default StockTransactions;


