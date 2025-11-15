import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userService } from '../../services/userService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import UserForm from './UserForm';

const Users = () => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [showModal, setShowModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery(
    ['users', page, limit],
    () => userService.getAll({ page, limit })
  );

  // Client-side filtering for search
  const filteredData = useMemo(() => {
    if (!searchTerm || !data?.data) return data?.data || [];
    const term = searchTerm.toLowerCase();
    return (data?.data || []).filter(user => 
      user.username?.toLowerCase().includes(term) ||
      user.email?.toLowerCase().includes(term) ||
      user.full_name?.toLowerCase().includes(term) ||
      user.role?.toLowerCase().includes(term) ||
      user.shop_name?.toLowerCase().includes(term) ||
      user.status?.toLowerCase().includes(term)
    );
  }, [data, searchTerm]);

  const deleteMutation = useMutation(userService.delete, {
    onSuccess: () => {
      toast.success('User deleted successfully');
      queryClient.invalidateQueries('users');
    },
    onError: () => {
      toast.error('Failed to delete user');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleAdd = () => {
    setEditingUserId(null);
    setShowModal(true);
  };

  const handleEdit = (id) => {
    setEditingUserId(id);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setEditingUserId(null);
  };

  const handleSuccess = () => {
    setShowModal(false);
    setEditingUserId(null);
  };

  const columns = [
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'full_name', label: 'Full Name' },
    { key: 'role', label: 'Role' },
    { key: 'shop_name', label: 'Shop' },
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
          <div className="actions">
            <Button onClick={() => handleEdit(row.id)} small>Edit</Button>
            <Button onClick={() => handleDelete(row.id)} variant="danger" small>Delete</Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Users</h1>
        <Button onClick={handleAdd}>+ Add User</Button>
      </div>
      <DataTable
        data={filteredData}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : data?.pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search users by username, email, name, role, shop, or status..."
        onSearch={setSearchTerm}
        onExport={(data) => {
          const csv = [
            ['Username', 'Email', 'Full Name', 'Role', 'Shop', 'Status'].join(','),
            ...data.map(u => [
              u.username || '',
              u.email || '',
              u.full_name || '',
              u.role || '',
              u.shop_name || '',
              u.status || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No users found"
        emptyIcon="👥"
      />
      
      {showModal && (
        <Modal
          title={editingUserId ? 'Edit User' : 'Add New User'}
          onClose={handleModalClose}
          size="medium"
        >
          <UserForm
            userId={editingUserId}
            onSuccess={handleSuccess}
            onCancel={handleModalClose}
            isModal={true}
          />
        </Modal>
      )}
    </div>
  );
};

export default Users;


