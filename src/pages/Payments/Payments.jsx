import { useState, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { paymentService } from '../../services/paymentService';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';

const Payments = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery(
    ['payments', page],
    () => paymentService.getAll({ page, limit: 10 })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(payment => 
      payment.sale_number?.toLowerCase().includes(term) ||
      payment.shop_name?.toLowerCase().includes(term) ||
      payment.payment_method?.toLowerCase().includes(term) ||
      payment.status?.toLowerCase().includes(term) ||
      payment.reference_number?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const columns = [
    { key: 'sale_number', label: 'Sale #' },
    { key: 'shop_name', label: 'Shop' },
    { key: 'payment_method', label: 'Method' },
    { 
      key: 'amount', 
      label: 'Amount', 
      render: (value, row) => {
        const amount = parseFloat(row?.amount || value || 0);
        return `Ksh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    },
    { key: 'status', label: 'Status' },
    { 
      key: 'payment_date', 
      label: 'Date', 
      render: (value, row) => {
        if (!row && !value) return '-';
        const dateValue = row?.payment_date || value;
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
      <div className="page-header">
        <h1>Payments</h1>
        <Button onClick={() => navigate('/payments/new')}>New Payment</Button>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search payments by sale #, shop, method, status, or reference..."
        onSearch={setSearchTerm}
        onExport={(data) => {
          const csv = [
            ['Sale #', 'Shop', 'Method', 'Amount', 'Status', 'Date'].join(','),
            ...data.map(p => [
              p.sale_number || '',
              p.shop_name || '',
              p.payment_method || '',
              p.amount || '0',
              p.status || '',
              p.payment_date || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `payments-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No payments found"
        emptyIcon="💳"
      />
    </div>
  );
};

export default Payments;


