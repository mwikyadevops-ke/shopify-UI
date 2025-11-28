import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { shopService } from '../../services/shopService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import ShopForm from './ShopForm';

const Shops = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingShopId, setEditingShopId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { data, isLoading } = useQuery(
    ['shops', page, limit],
    () => shopService.getAll({ page, limit })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(shop => 
      shop.name?.toLowerCase().includes(term) ||
      shop.location?.toLowerCase().includes(term) ||
      shop.phone?.toLowerCase().includes(term) ||
      shop.email?.toLowerCase().includes(term) ||
      shop.status?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const deleteMutation = useMutation(shopService.delete, {
    onSuccess: () => {
      toast.success('Shop deleted successfully');
      queryClient.invalidateQueries('shops');
    },
    onError: () => {
      toast.error('Failed to delete shop');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this shop?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setEditingShopId(null);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    setEditingShopId(id);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingShopId(null);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingShopId(null);
  };

  const allColumns = [
    { key: 'name', label: 'Name' },
    { key: 'location', label: 'Location' },
    { key: 'phone', label: 'Phone' },
    { key: 'email', label: 'Email' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value, row) => {
        const status = row?.status || value || 'active';
        return (
          <span className={`status-badge status-${status}`}>
            {status}
          </span>
        );
      }
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (value, row) => {
        if (!row || !row.id) return null;
        return (
          <div className="actions" style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
            <button
              onClick={() => handleEdit(row.id)}
              className="btn-icon-only btn-secondary"
              title="Edit"
            >
              ✏️
            </button>
            <button
              onClick={() => handleDelete(row.id)}
              className="btn-icon-only btn-danger"
              title="Delete"
            >
              🗑️
            </button>
          </div>
        );
      },
    },
  ];

  // Filter columns for mobile - show only: Name, Location, Phone, Status
  const columns = useMemo(() => {
    if (isMobile) {
      const mobileColumnOrder = ['name', 'location', 'phone', 'status', 'actions'];
      const mobileColumns = [];
      
      mobileColumnOrder.forEach(key => {
        const col = allColumns.find(c => c.key === key);
        if (col) {
          mobileColumns.push(col);
        }
      });
      
      return mobileColumns;
    }
    return allColumns;
  }, [isMobile]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Shops</h1>
        <Button onClick={handleAdd}>+ Add Shop</Button>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search shops by name, location, phone, email, or status..."
        onSearch={setSearchTerm}
        onExport={(data) => {
          const csv = [
            ['Name', 'Location', 'Phone', 'Email', 'Status'].join(','),
            ...data.map(s => [
              s.name || '',
              s.location || '',
              s.phone || '',
              s.email || '',
              s.status || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `shops-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No shops found"
        emptyIcon="🏪"
      />
      
      {showModal && (
        <Modal
          title={editingShopId ? 'Edit Shop' : 'Add New Shop'}
          onClose={handleModalClose}
          size="medium"
        >
          <ShopForm
            shopId={editingShopId}
            onSuccess={handleSuccess}
            onCancel={handleModalClose}
            isModal={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default Shops;

