import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { stockTransferService } from '../../services/stockTransferService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import ConfirmModal from '../../components/Common/ConfirmModal';

const StockTransfers = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    type: null, // 'complete' | 'cancel' | 'approve' | 'reject'
    transferId: null,
    transferData: null,
  });

  const { data, isLoading } = useQuery(
    ['stock-transfers', page],
    () => stockTransferService.getAll({ page, limit: 10 })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(transfer => 
      transfer.transfer_number?.toLowerCase().includes(term) ||
      transfer.product_name?.toLowerCase().includes(term) ||
      transfer.from_shop_name?.toLowerCase().includes(term) ||
      transfer.to_shop_name?.toLowerCase().includes(term) ||
      transfer.status?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const completeMutation = useMutation(stockTransferService.complete, {
    onSuccess: () => {
      toast.success('Transfer completed successfully');
      queryClient.invalidateQueries('stock-transfers');
      setConfirmModal({ isOpen: false, type: null, transferId: null, transferData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete transfer');
    },
  });

  const cancelMutation = useMutation(stockTransferService.cancel, {
    onSuccess: () => {
      toast.success('Transfer cancelled successfully');
      queryClient.invalidateQueries('stock-transfers');
      setConfirmModal({ isOpen: false, type: null, transferId: null, transferData: null });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel transfer');
    },
  });

  const approveMutation = useMutation(
    (id) => stockTransferService.approve ? stockTransferService.approve(id) : stockTransferService.complete(id),
    {
      onSuccess: () => {
        toast.success('Transfer approved successfully');
        queryClient.invalidateQueries('stock-transfers');
        setConfirmModal({ isOpen: false, type: null, transferId: null, transferData: null });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to approve transfer');
      },
    }
  );

  const rejectMutation = useMutation(
    (id) => stockTransferService.reject ? stockTransferService.reject(id) : stockTransferService.cancel(id),
    {
      onSuccess: () => {
        toast.success('Transfer rejected successfully');
        queryClient.invalidateQueries('stock-transfers');
        setConfirmModal({ isOpen: false, type: null, transferId: null, transferData: null });
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to reject transfer');
      },
    }
  );

  const handleComplete = (transfer) => {
    setConfirmModal({
      isOpen: true,
      type: 'complete',
      transferId: transfer.id,
      transferData: transfer,
    });
  };

  const handleCancel = (transfer) => {
    setConfirmModal({
      isOpen: true,
      type: 'cancel',
      transferId: transfer.id,
      transferData: transfer,
    });
  };

  const handleApprove = (transfer) => {
    setConfirmModal({
      isOpen: true,
      type: 'approve',
      transferId: transfer.id,
      transferData: transfer,
    });
  };

  const handleReject = (transfer) => {
    setConfirmModal({
      isOpen: true,
      type: 'reject',
      transferId: transfer.id,
      transferData: transfer,
    });
  };

  const handleConfirmAction = () => {
    const { type, transferId } = confirmModal;
    
    switch (type) {
      case 'complete':
        completeMutation.mutate(transferId);
        break;
      case 'cancel':
        cancelMutation.mutate(transferId);
        break;
      case 'approve':
        approveMutation.mutate(transferId);
        break;
      case 'reject':
        rejectMutation.mutate(transferId);
        break;
      default:
        break;
    }
  };

  const closeConfirmModal = () => {
    if (!completeMutation.isLoading && !cancelMutation.isLoading && !approveMutation.isLoading && !rejectMutation.isLoading) {
      setConfirmModal({ isOpen: false, type: null, transferId: null, transferData: null });
    }
  };

  const getConfirmModalConfig = () => {
    const { type, transferData } = confirmModal;
    const isLoading = 
      completeMutation.isLoading || 
      cancelMutation.isLoading || 
      approveMutation.isLoading || 
      rejectMutation.isLoading;

    const transferInfo = transferData 
      ? `Transfer #${transferData.transfer_number || transferData.id}: ${transferData.product_name || 'Product'} (Qty: ${transferData.quantity || 'N/A'})`
      : '';

    switch (type) {
      case 'complete':
        return {
          title: 'Complete Stock Transfer',
          message: `Are you sure you want to mark this transfer as completed?\n\n${transferInfo}\n\nThis will finalize the transfer and update stock levels.`,
          confirmText: 'Complete Transfer',
          cancelText: 'Cancel',
          variant: 'primary',
          icon: '✅',
        };
      case 'cancel':
        return {
          title: 'Cancel Stock Transfer',
          message: `Are you sure you want to cancel this transfer?\n\n${transferInfo}\n\nThis action cannot be undone.`,
          confirmText: 'Cancel Transfer',
          cancelText: 'Keep Transfer',
          variant: 'danger',
          icon: '⚠️',
        };
      case 'approve':
        return {
          title: 'Approve Stock Transfer',
          message: `Are you sure you want to approve this transfer?\n\n${transferInfo}\n\nThis will allow the transfer to proceed.`,
          confirmText: 'Approve',
          cancelText: 'Cancel',
          variant: 'primary',
          icon: '✓',
        };
      case 'reject':
        return {
          title: 'Reject Stock Transfer',
          message: `Are you sure you want to reject this transfer?\n\n${transferInfo}\n\nThis will cancel the transfer request.`,
          confirmText: 'Reject',
          cancelText: 'Cancel',
          variant: 'danger',
          icon: '✗',
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

  const columns = [
    { key: 'transfer_number', label: 'Transfer #' },
    { key: 'product_name', label: 'Product' },
    { key: 'from_shop_name', label: 'From Shop' },
    { key: 'to_shop_name', label: 'To Shop' },
    { key: 'quantity', label: 'Quantity' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value, row) => {
        if (!row) return '-';
        const status = row.status || value || 'pending';
        const statusColors = {
          pending: { bg: '#fef3c7', text: '#92400e', label: 'Pending' },
          approved: { bg: '#dbeafe', text: '#1e40af', label: 'Approved' },
          completed: { bg: '#d1fae5', text: '#065f46', label: 'Completed' },
          cancelled: { bg: '#fee2e2', text: '#991b1b', label: 'Cancelled' },
          rejected: { bg: '#fee2e2', text: '#991b1b', label: 'Rejected' },
        };
        const style = statusColors[status] || statusColors.pending;
        return (
          <span style={{
            backgroundColor: style.bg,
            color: style.text,
            padding: '4px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
          }}>
            {style.label}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => {
        if (!row || !row.id) return null;
        const status = row.status || 'pending';
        const isLoading = 
          completeMutation.isLoading || 
          cancelMutation.isLoading || 
          approveMutation.isLoading || 
          rejectMutation.isLoading;
        const isCurrentTransfer = confirmModal.transferId === row.id;

        // Default to Complete/Cancel buttons (original behavior)
        // Approve/Reject buttons will show if transfer status requires approval
        // and backend supports approval workflow (detected via status = 'pending' needing approval)
        const useApprovalWorkflow = status === 'pending' && row.requires_approval === true;
        
        return (
          <div className="actions" style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {status === 'pending' && (
              <>
                {/* Show Approve/Reject if approval workflow is required */}
                {useApprovalWorkflow && typeof stockTransferService.approve === 'function' ? (
                  <>
                    <button
                      onClick={() => handleApprove(row)}
                      className="btn-icon-only btn-primary"
                      disabled={isLoading && !isCurrentTransfer}
                      title="Approve"
                    >
                      {isLoading && isCurrentTransfer && approveMutation.isLoading ? '⏳' : '✅'}
                    </button>
                    <button
                      onClick={() => handleReject(row)}
                      className="btn-icon-only btn-danger"
                      disabled={isLoading && !isCurrentTransfer}
                      title="Reject"
                    >
                      {isLoading && isCurrentTransfer && rejectMutation.isLoading ? '⏳' : '❌'}
                    </button>
                  </>
                ) : (
                  <>
                    {/* Default: Complete/Cancel buttons */}
                    <button
                      onClick={() => handleComplete(row)}
                      className="btn-icon-only btn-primary"
                      disabled={isLoading && !isCurrentTransfer}
                      title="Complete"
                    >
                      {isLoading && isCurrentTransfer && completeMutation.isLoading ? '⏳' : '✓'}
                    </button>
                    <button
                      onClick={() => handleCancel(row)}
                      className="btn-icon-only btn-danger"
                      disabled={isLoading && !isCurrentTransfer}
                      title="Cancel"
                    >
                      {isLoading && isCurrentTransfer && cancelMutation.isLoading ? '⏳' : '🚫'}
                    </button>
                  </>
                )}
              </>
            )}
            {/* Show Complete/Cancel for approved transfers */}
            {status === 'approved' && (
              <>
                <button
                  onClick={() => handleComplete(row)}
                  className="btn-icon-only btn-primary"
                  disabled={isLoading && !isCurrentTransfer}
                  title="Complete"
                >
                  {isLoading && isCurrentTransfer && completeMutation.isLoading ? '⏳' : '✓'}
                </button>
                <button
                  onClick={() => handleCancel(row)}
                  className="btn-icon-only btn-danger"
                  disabled={isLoading && !isCurrentTransfer}
                  title="Cancel"
                >
                  {isLoading && isCurrentTransfer && cancelMutation.isLoading ? '⏳' : '🚫'}
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const modalConfig = getConfirmModalConfig();

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Stock Transfers</h1>
        <Button onClick={() => navigate('/stock-transfers/new')}>New Transfer</Button>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search transfers by transfer #, product, shops, or status..."
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onExport={(data) => {
          const csv = [
            ['Transfer #', 'Product', 'From Shop', 'To Shop', 'Quantity', 'Status'].join(','),
            ...data.map(t => [
              t.transfer_number || '',
              t.product_name || '',
              t.from_shop_name || '',
              t.to_shop_name || '',
              t.quantity || '0',
              t.status || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `stock-transfers-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No stock transfers found"
        emptyIcon="🔄"
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
          completeMutation.isLoading || 
          cancelMutation.isLoading || 
          approveMutation.isLoading || 
          rejectMutation.isLoading
        }
      />
    </div>
  );
};

export default StockTransfers;


