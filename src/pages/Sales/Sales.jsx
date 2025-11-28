import { useState, useMemo, useEffect } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { saleService } from '../../services/saleService';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import SaleCreate from './SaleCreate';
import './Sales.css';

const Sales = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, isLoading } = useQuery(
    ['sales', page, statusFilter],
    () => saleService.getAll({ 
      page, 
      limit: 10,
      ...(statusFilter && { status: statusFilter })
    }),
    {}
  );

  // Get payment status from backend fields (simplified - backend now always provides these)
  const getPaymentStatus = (sale) => {
    // Backend now provides payment_status field directly
    const paymentStatus = sale?.payment_status?.toLowerCase() || 'unpaid';
    const totalPaid = parseFloat(sale?.total_paid || 0);
    const totalAmount = parseFloat(sale?.total_amount || 0);

    // Use backend payment_status field if available
    if (paymentStatus === 'paid' || paymentStatus === 'fully_paid') {
      return { status: 'paid', label: 'Paid', amount: totalPaid, balance: totalAmount - totalPaid };
    } else if (paymentStatus === 'partial' || paymentStatus === 'partially_paid') {
      return { status: 'partial', label: 'Partial', amount: totalPaid, balance: totalAmount - totalPaid };
    } else {
      // unpaid or pending
      return { status: 'unpaid', label: 'Unpaid', amount: 0, balance: totalAmount };
    }
  };

  const allColumns = [
    { 
      key: 'sale_number', 
      label: 'Sale #',
      render: (value, row) => (
        <strong style={{ color: '#667eea' }}>{value || row?.sale_number || '-'}</strong>
      )
    },
    { key: 'shop_name', label: 'Shop' },
    { 
      key: 'customer_name', 
      label: 'Customer',
      render: (value, row) => {
        if (!row) return value || '-';
        return (
          <div>
            <div>{row.customer_name || value || 'Walk-in Customer'}</div>
            {row.customer_phone && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{row.customer_phone}</div>
            )}
          </div>
        );
      }
    },
    { 
      key: 'items_count', 
      label: 'Items',
      render: (value, row) => {
        if (!row) return value || 0;
        // Backend now provides items_count field directly
        const itemsCount = row.items_count || value || 0;
        return (
          <span style={{ fontSize: '14px', fontWeight: '500' }}>
            {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
          </span>
        );
      }
    },
    { 
      key: 'total_amount', 
      label: 'Total', 
      render: (value, row) => {
        const amount = parseFloat(row?.total_amount || value || 0);
        return (
          <strong style={{ fontSize: '16px', color: '#059669' }}>
            Ksh {amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        );
      }
    },
    { 
      key: 'payment_status', 
      label: 'Payment',
      render: (value, row) => {
        if (!row) return value || '-';
        const paymentStatus = getPaymentStatus(row);
        const totalAmount = parseFloat(row.total_amount || 0);
        const totalPaid = parseFloat(row.total_paid || 0);
        const balance = totalAmount - totalPaid;
        
        return (
          <div>
            <div className={`payment-indicator ${paymentStatus.status}`} style={{ marginBottom: '4px' }}>
              <span>{paymentStatus.status === 'paid' ? '●' : paymentStatus.status === 'partial' ? '◐' : '○'}</span>
              <span>{paymentStatus.label}</span>
            </div>
            {balance > 0 && (
              <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '4px' }}>
                Balance: Ksh {balance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
            {totalPaid > 0 && (
              <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                Paid: Ksh {totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            )}
          </div>
        );
      }
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value, row) => {
        const status = row?.status || value || 'pending';
        const statusColors = {
          completed: 'sale-status-completed',
          pending: 'sale-status-pending',
          cancelled: 'sale-status-cancelled',
          refunded: 'sale-status-refunded',
        };
        return (
          <span className={`sale-status-badge ${statusColors[status] || 'sale-status-pending'}`}>
            {status}
          </span>
        );
      }
    },
    { 
      key: 'sale_date', 
      label: 'Date', 
      render: (value, row) => {
        if (!row && !value) return '-';
        const dateValue = row?.sale_date || value;
        if (!dateValue) return '-';
        try {
          const date = new Date(dateValue);
          if (isNaN(date.getTime())) return '-';
          return (
            <div>
              <div>{date.toLocaleDateString('en-KE')}</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                {date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        } catch (e) {
          return '-';
        }
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => {
        if (!row || !row.id) return null;
        const totalAmount = parseFloat(row.total_amount || 0);
        const totalPaid = parseFloat(row.total_paid || 0);
        const balanceDue = totalAmount - totalPaid;
        const hasBalance = balanceDue > 0;

        return (
          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => navigate(`/sales/${row.id}`)}
              className="btn-icon-only btn-secondary"
              title="View"
            >
              👁️
            </button>
            {hasBalance && (
              <button
                onClick={() => navigate(`/payments/new?sale_id=${row.id}`)}
                className="btn-icon-only btn-primary"
                title="Pay"
              >
                💰
              </button>
            )}
          </div>
        );
      },
    },
  ];

  // Filter columns for mobile - show only: Date, Items, Amount, Shop
  const columns = useMemo(() => {
    if (isMobile) {
      // Create mobile-specific column order: Date, Items, Amount, Shop, Actions
      const mobileColumnOrder = ['sale_date', 'items_count', 'total_amount', 'shop_name', 'actions'];
      const mobileColumns = [];
      
      mobileColumnOrder.forEach(key => {
        const col = allColumns.find(c => c.key === key);
        if (col) {
          // Simplify date display for mobile
          if (key === 'sale_date') {
            mobileColumns.push({
              ...col,
              render: (value, row) => {
                if (!row && !value) return '-';
                const dateValue = row?.sale_date || value;
                if (!dateValue) return '-';
                try {
                  const date = new Date(dateValue);
                  if (isNaN(date.getTime())) return '-';
                  return date.toLocaleDateString('en-KE', { 
                    day: '2-digit', 
                    month: 'short',
                    year: 'numeric'
                  });
                } catch (e) {
                  return '-';
                }
              }
            });
          } else {
            mobileColumns.push(col);
          }
        }
      });
      
      return mobileColumns;
    }
    return allColumns;
  }, [isMobile]);

  // Filter data client-side for search
  const filteredData = useMemo(() => {
    if (!searchTerm) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(sale => 
      sale.sale_number?.toLowerCase().includes(term) ||
      sale.customer_name?.toLowerCase().includes(term) ||
      sale.customer_phone?.toLowerCase().includes(term) ||
      sale.customer_email?.toLowerCase().includes(term) ||
      sale.shop_name?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const handleCreateSuccess = () => {
    setShowSaleModal(false);
    // Query invalidation is handled in SaleCreate component
  };

  const handleCreateCancel = () => {
    setShowSaleModal(false);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Sales</h1>
        <Button onClick={() => setShowSaleModal(true)}>New Sale</Button>
      </div>

      {/* Sale Create Modal */}
      {showSaleModal && (
        <Modal
          title="Create New Sale"
          onClose={handleCreateCancel}
          size="extra-large"
        >
          <SaleCreate
            isModal={true}
            onSuccess={handleCreateSuccess}
            onCancel={handleCreateCancel}
          />
        </Modal>
      )}

      {/* Filters */}
      <div className="sales-filters">
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            <option value="">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
            <option value="refunded">Refunded</option>
          </select>
        </div>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search by sale #, customer, phone, email, or shop..."
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onExport={(data) => {
          const csv = [
            ['Sale #', 'Shop', 'Customer', 'Phone', 'Items', 'Total', 'Payment Status', 'Status', 'Date'].join(','),
            ...data.map(s => [
              s.sale_number || '',
              s.shop_name || '',
              s.customer_name || '',
              s.customer_phone || '',
              s.items_count || '0',
              s.total_amount || '0',
              s.payment_status || '',
              s.status || '',
              s.sale_date || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `sales-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No sales found"
        emptyIcon="💰"
      />
    </div>
  );
};

export default Sales;


