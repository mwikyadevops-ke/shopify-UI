import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { quotationService } from '../../services/quotationService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import ConfirmModal from '../../components/Common/ConfirmModal';
import './Quotations.css';

const Quotations = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'delete' | 'send' | 'accept' | 'reject' | 'cancel'
    quotationId: null,
    quotationData: null,
  });

  // Sync status filter with URL query parameter on mount
  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam && statusParam !== statusFilter) {
      setStatusFilter(statusParam);
      setPage(1); // Reset to first page when status changes
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // Update URL when status filter changes (but not from URL sync)
  const updateStatusFilter = (newStatus) => {
    setStatusFilter(newStatus);
    setPage(1);
    if (newStatus) {
      setSearchParams({ status: newStatus }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const { data, isLoading } = useQuery(
    ['quotations', page, statusFilter],
    () => quotationService.getAll({ page, limit: 10, status: statusFilter }),
    { keepPreviousData: true }
  );

  const deleteMutation = useMutation(quotationService.delete, {
    onSuccess: () => {
      toast.success('Quotation deleted successfully');
      queryClient.invalidateQueries('quotations');
      queryClient.invalidateQueries('draft-quotations'); // Invalidate draft count
      queryClient.invalidateQueries('draft-quotations-count'); // Invalidate draft count
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete quotation');
    },
  });

  const sendMutation = useMutation(quotationService.send, {
    onSuccess: (response) => {
      const message = response?.message || 'Quotation sent successfully via email';
      toast.success(message);
      queryClient.invalidateQueries('quotations');
      queryClient.invalidateQueries('draft-quotations'); // Invalidate draft list
      queryClient.invalidateQueries('draft-quotations-count'); // Invalidate draft count
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.message || 'Failed to send quotation via email';
      toast.error(errorMessage);
    },
  });

  const acceptMutation = useMutation(quotationService.accept, {
    onSuccess: () => {
      toast.success('Quotation accepted successfully');
      queryClient.invalidateQueries('quotations');
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept quotation');
    },
  });

  const rejectMutation = useMutation(quotationService.reject, {
    onSuccess: () => {
      toast.success('Quotation rejected successfully');
      queryClient.invalidateQueries('quotations');
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reject quotation');
    },
  });

  const cancelMutation = useMutation(quotationService.cancel, {
    onSuccess: () => {
      toast.success('Quotation cancelled successfully');
      queryClient.invalidateQueries('quotations');
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel quotation');
    },
  });

  const handleDelete = (quotation) => {
    setConfirmModal({
      isOpen: true,
      type: 'delete',
      quotationId: quotation.id,
      quotationData: quotation,
    });
  };

  const handleSend = (quotation) => {
    // Check if supplier email is available before sending
    if (!quotation.supplier_email) {
      toast.error('Cannot send quotation: Supplier email is required');
      return;
    }

    setConfirmModal({
      isOpen: true,
      type: 'send',
      quotationId: quotation.id,
      quotationData: quotation,
    });
  };

  const handleAccept = (quotation) => {
    setConfirmModal({
      isOpen: true,
      type: 'accept',
      quotationId: quotation.id,
      quotationData: quotation,
    });
  };

  const handleReject = (quotation) => {
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      quotationId: quotation.id,
      quotationData: quotation,
    });
  };

  const handleCancel = (quotation) => {
    setConfirmModal({
      isOpen: true,
      type: 'cancel',
      quotationId: quotation.id,
      quotationData: quotation,
    });
  };

  const handleConfirmAction = () => {
    const { type, quotationId } = confirmModal;
    
    switch (type) {
      case 'delete':
        deleteMutation.mutate(quotationId);
        break;
      case 'send':
        sendMutation.mutate(quotationId);
        break;
      case 'accept':
        acceptMutation.mutate(quotationId);
        break;
      case 'reject':
        rejectMutation.mutate(quotationId);
        break;
      case 'cancel':
        cancelMutation.mutate(quotationId);
        break;
      default:
        break;
    }
  };

  const closeConfirmModal = () => {
    if (!deleteMutation.isLoading && !sendMutation.isLoading && !acceptMutation.isLoading && !rejectMutation.isLoading && !cancelMutation.isLoading) {
      setConfirmModal({ isOpen: false, type: null, quotationId: null, quotationData: null });
    }
  };

  const getConfirmModalConfig = () => {
    const { type, quotationData } = confirmModal;
    const isLoading = 
      deleteMutation.isLoading || 
      sendMutation.isLoading || 
      acceptMutation.isLoading || 
      rejectMutation.isLoading || 
      cancelMutation.isLoading;

    const quotationInfo = quotationData 
      ? `Quotation #${quotationData.quotation_number || quotationData.id}: ${quotationData.supplier_name || 'Supplier'} (Total: Ksh ${parseFloat(quotationData.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`
      : '';

    switch (type) {
      case 'delete':
        return {
          title: 'Delete Quotation',
          message: `Are you sure you want to delete this quotation?\n\n${quotationInfo}\n\nThis action cannot be undone.`,
          confirmText: 'Delete',
          cancelText: 'Cancel',
          variant: 'danger',
          icon: '⚠️',
        };
      case 'send':
        return {
          title: 'Send Quotation via Email',
          message: `Are you sure you want to send this quotation to the supplier via email?\n\n${quotationInfo}\n\nEmail will be sent to: ${quotationData?.supplier_email || 'N/A'}\n\nThis will mark the quotation as sent.`,
          confirmText: 'Send Email',
          cancelText: 'Cancel',
          variant: 'primary',
          icon: '📤',
        };
      case 'accept':
        return {
          title: 'Accept Quotation',
          message: `Are you sure you want to accept this quotation?\n\n${quotationInfo}\n\nThis will mark the quotation as accepted.`,
          confirmText: 'Accept',
          cancelText: 'Cancel',
          variant: 'primary',
          icon: '✓',
        };
      case 'reject':
        return {
          title: 'Reject Quotation',
          message: `Are you sure you want to reject this quotation?\n\n${quotationInfo}\n\nThis will mark the quotation as rejected.`,
          confirmText: 'Reject',
          cancelText: 'Cancel',
          variant: 'danger',
          icon: '✗',
        };
      case 'cancel':
        return {
          title: 'Cancel Quotation',
          message: `Are you sure you want to cancel this quotation?\n\n${quotationInfo}\n\nThis will mark the quotation as cancelled.`,
          confirmText: 'Cancel',
          cancelText: 'Keep',
          variant: 'danger',
          icon: '⚠️',
        };
      default:
        return {
          title: 'Confirm Action',
          message: 'Are you sure you want to proceed?',
          confirmText: 'Confirm',
          cancelText: 'Cancel',
          variant: 'primary',
          icon: '⚠️',
        };
    }
  };

  const getStatusClass = (status) => {
    const statusMap = {
      draft: { bg: '#e5e7eb', text: '#374151', label: 'Draft' },
      sent: { bg: '#dbeafe', text: '#1e40af', label: 'Sent' },
      accepted: { bg: '#d1fae5', text: '#065f46', label: 'Accepted' },
      rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
      expired: { bg: '#fef3c7', text: '#92400e', label: 'Expired' },
      cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
    };
    return statusMap[status] || statusMap.draft;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns = [
    { 
      key: 'quotation_number', 
      label: 'Quotation #',
      render: (value, row) => {
        if (!row || !row.id) return value || '-';
        return (
          <Link to={`/quotations/${row.id}`} style={{ color: '#3b82f6', fontWeight: '600', textDecoration: 'none' }}>
            {value || '-'}
          </Link>
        );
      }
    },
    { 
      key: 'supplier_name', 
      label: 'Supplier',
      render: (value, row) => {
        if (!row) return value || '-';
        return (
          <div>
            <div style={{ fontWeight: '600' }}>{value || '-'}</div>
            {row.supplier_phone && (
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{row.supplier_phone}</div>
            )}
          </div>
        );
      }
    },
    { 
      key: 'shop_name', 
      label: 'Shop',
      render: (value) => value || 'All Shops'
    },
    { 
      key: 'items_count', 
      label: 'Items',
      render: (value) => value || 0
    },
    { 
      key: 'total_amount', 
      label: 'Total Amount',
      render: (value) => (
        <span style={{ fontWeight: '600', color: '#059669' }}>
          Ksh {parseFloat(value || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
      )
    },
    { 
      key: 'status', 
      label: 'Status',
      render: (value) => {
        const statusStyle = getStatusClass(value);
        return (
          <span style={{
            backgroundColor: statusStyle.bg,
            color: statusStyle.text,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {statusStyle.label}
          </span>
        );
      }
    },
    { 
      key: 'valid_until', 
      label: 'Valid Until',
      render: (value) => formatDate(value)
    },
    { 
      key: 'quotation_date', 
      label: 'Date',
      render: (value) => formatDate(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => {
        if (!row || !row.id) return null;
        const status = row.status || 'draft';
        const isLoading = 
          deleteMutation.isLoading || 
          sendMutation.isLoading || 
          acceptMutation.isLoading || 
          rejectMutation.isLoading || 
          cancelMutation.isLoading;
        const isCurrentQuotation = confirmModal.quotationId === row.id;

        return (
          <div className="actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              onClick={() => navigate(`/quotations/${row.id}`)}
              className="btn-icon-only btn-secondary"
              title="View"
            >
              👁️
            </button>
            {status === 'draft' && (
              <>
                <button
                  onClick={() => navigate(`/quotations/${row.id}/edit`)}
                  className="btn-icon-only btn-secondary"
                  title="Edit"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleSend(row)}
                  className="btn-icon-only btn-primary"
                  disabled={(isLoading && !isCurrentQuotation) || !row.supplier_email}
                  title={!row.supplier_email ? 'Supplier email is required to send quotation' : 'Send quotation via email'}
                >
                  {isLoading && isCurrentQuotation && sendMutation.isLoading ? '⏳' : '📧'}
                </button>
                <button
                  onClick={() => handleDelete(row)}
                  className="btn-icon-only btn-danger"
                  disabled={isLoading && !isCurrentQuotation}
                  title="Delete"
                >
                  {isLoading && isCurrentQuotation && deleteMutation.isLoading ? '⏳' : '🗑️'}
                </button>
              </>
            )}
            {status === 'sent' && (
              <>
                <button
                  onClick={() => handleAccept(row)}
                  className="btn-icon-only btn-primary"
                  disabled={isLoading && !isCurrentQuotation}
                  title="Accept"
                >
                  {isLoading && isCurrentQuotation && acceptMutation.isLoading ? '⏳' : '✅'}
                </button>
                <button
                  onClick={() => handleReject(row)}
                  className="btn-icon-only btn-danger"
                  disabled={isLoading && !isCurrentQuotation}
                  title="Reject"
                >
                  {isLoading && isCurrentQuotation && rejectMutation.isLoading ? '⏳' : '❌'}
                </button>
                <button
                  onClick={() => handleCancel(row)}
                  className="btn-icon-only btn-secondary"
                  disabled={isLoading && !isCurrentQuotation}
                  title="Cancel"
                >
                  {isLoading && isCurrentQuotation && cancelMutation.isLoading ? '⏳' : '🚫'}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  // Filter by search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data?.data || [];
    const searchLower = searchTerm.toLowerCase();
    return (data?.data || []).filter(quotation => 
      quotation.quotation_number?.toLowerCase().includes(searchLower) ||
      quotation.supplier_name?.toLowerCase().includes(searchLower) ||
      quotation.supplier_email?.toLowerCase().includes(searchLower) ||
      quotation.supplier_phone?.toLowerCase().includes(searchLower) ||
      quotation.shop_name?.toLowerCase().includes(searchLower)
    );
  }, [data, searchTerm]);

  const modalConfig = getConfirmModalConfig();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Quotations</h1>
        <Button onClick={() => navigate('/quotations/new')}>Create Quotation</Button>
      </div>

      {/* Filters */}
      <div className="quotations-filters" style={{ marginBottom: '16px' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            updateStatusFilter(e.target.value);
          }}
          style={{
            padding: '10px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            cursor: 'pointer',
            minWidth: '200px',
          }}
        >
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="rejected">Rejected</option>
          <option value="expired">Expired</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search by quotation #, supplier, phone, email, or shop..."
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onExport={(data) => {
          const csv = [
            ['Quotation #', 'Supplier', 'Phone', 'Email', 'Shop', 'Items', 'Total', 'Status', 'Valid Until'].join(','),
            ...data.map(q => [
              q.quotation_number || '',
              q.supplier_name || '',
              q.supplier_phone || '',
              q.supplier_email || '',
              q.shop_name || '',
              q.items_count || '0',
              q.total_amount || '0',
              q.status || '',
              q.valid_until || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `quotations-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No quotations found"
        emptyIcon="📄"
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={closeConfirmModal}
        onConfirm={handleConfirmAction}
        title={modalConfig.title}
        message={modalConfig.message}
        confirmText={modalConfig.confirmText}
        cancelText={modalConfig.cancelText}
        variant={modalConfig.variant}
        icon={modalConfig.icon}
        isLoading={
          deleteMutation.isLoading || 
          sendMutation.isLoading || 
          acceptMutation.isLoading || 
          rejectMutation.isLoading || 
          cancelMutation.isLoading
        }
      />
    </div>
  );
};

export default Quotations;

