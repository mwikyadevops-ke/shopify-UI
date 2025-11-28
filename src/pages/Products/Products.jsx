import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import ProductForm from './ProductForm';

const Products = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery(
    ['products', page, limit],
    () => productService.getAll({ page, limit })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(product => 
      product.name?.toLowerCase().includes(term) ||
      product.sku?.toLowerCase().includes(term) ||
      product.category_name?.toLowerCase().includes(term) ||
      product.status?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const deleteMutation = useMutation(productService.delete, {
    onSuccess: () => {
      toast.success('Product deleted successfully');
      queryClient.invalidateQueries('products');
    },
    onError: () => {
      toast.error('Failed to delete product');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setEditingProductId(null);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    setEditingProductId(id);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingProductId(null);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingProductId(null);
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'category_name', label: 'Category' },
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

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Products</h1>
        <Button onClick={handleAdd}>+ Add Product</Button>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search products by name, SKU, category, or status..."
        onSearch={setSearchTerm}
        onExport={(data) => {
          const csv = [
            ['Name', 'SKU', 'Category', 'Status'].join(','),
            ...data.map(p => [
              p.name || '',
              p.sku || '',
              p.category_name || '',
              p.status || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `products-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No products found"
        emptyIcon="📦"
      />
      
      {showModal && (
        <Modal
          title={editingProductId ? 'Edit Product' : 'Add New Product'}
          onClose={handleModalClose}
          size="large"
        >
          <ProductForm
            productId={editingProductId}
            onSuccess={handleSuccess}
            onCancel={handleModalClose}
            isModal={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default Products;


