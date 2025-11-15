import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { categoryService } from '../../services/categoryService';
import toast from 'react-hot-toast';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import Modal from '../../components/Common/Modal';
import CategoryForm from './CategoryForm';

const CategoryList = () => {
    const queryClient = useQueryClient();
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [showForm, setShowForm] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ Fetch categories
    const { data, isLoading, error } = useQuery(
        ['categories', page, limit],
        () => categoryService.getAll({ page, limit }),
        { 
            keepPreviousData: true,
            retry: 2,
            onError: (error) => {
                console.error('Failed to fetch categories:', error);
            }
        }
    );

    const categories = data?.data || [];

    // Client-side filtering for search
    const filteredData = useMemo(() => {
        if (!searchTerm || !categories) return categories;
        const term = searchTerm.toLowerCase();
        return categories.filter(category => 
            category.name?.toLowerCase().includes(term) ||
            category.description?.toLowerCase().includes(term) ||
            category.status?.toLowerCase().includes(term)
        );
    }, [categories, searchTerm]);

    // ✅ Delete mutation
    const deleteMutation = useMutation(categoryService.delete, {
        onSuccess: () => {
            toast.success('Category deleted successfully');
            queryClient.invalidateQueries('categories');
        },
        onError: (error) => {
            const errorMessage = error.response?.data?.message || 'Failed to delete category';
            toast.error(errorMessage);
            console.error('Delete category error:', error);
        },
    });

    const handleDelete = (id) => {
        if (window.confirm('Are you sure you want to delete this category? This action cannot be undone.')) {
            deleteMutation.mutate(id);
        }
    };

    const handleEdit = (category) => {
        setEditingCategory(category);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingCategory(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        queryClient.invalidateQueries('categories');
    };

    const columns = [
        { 
            key: 'name', 
            label: 'Name',
            render: (value, row) => <strong>{value || row?.name || '-'}</strong>
        },
        { 
            key: 'description', 
            label: 'Description',
            render: (value, row) => {
                const desc = row?.description || value;
                return desc || <span style={{ color: '#999' }}>No description</span>;
            }
        },
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
                    <div className="flex gap-2">
                        <Button 
                            variant="primary" 
                            onClick={() => handleEdit(row)}
                            size="small"
                        >
                            Edit
                        </Button>
                        <Button 
                            variant="danger" 
                            onClick={() => handleDelete(row.id)}
                            size="small"
                            loading={deleteMutation.isLoading && deleteMutation.variables === row.id}
                        >
                            Delete
                        </Button>
                    </div>
                );
            },
        },
    ];

    return (
        <div className="page-container">
            {/* ✅ Header with Add button */}
            <div className="page-header">
                <h1>Product Categories</h1>
                <Button variant="success" onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Close' : '+ Add New Category'}
                </Button>
            </div>

            {/* ✅ Modal Form */}
            {showForm && (
                <Modal
                    title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'Add New Category'}
                    onClose={handleFormClose}
                    size="small"
                >
                    <CategoryForm
                        categoryId={editingCategory?.id}
                        onSuccess={handleFormSuccess}
                        onCancel={handleFormClose}
                    />
                </Modal>
            )}

            {/* ✅ Table */}
            {isLoading && <p>Loading categories...</p>}
            {error && <p className="text-red-500">Failed to load categories</p>}

            <DataTable
                data={filteredData}
                columns={columns}
                isLoading={isLoading}
                pagination={searchTerm ? null : data?.pagination}
                onPageChange={setPage}
                searchable={true}
                searchPlaceholder="Search categories by name, description, or status..."
                onSearch={setSearchTerm}
                onExport={(data) => {
                    const csv = [
                        ['Name', 'Description', 'Status'].join(','),
                        ...data.map(c => [
                            c.name || '',
                            c.description || '',
                            c.status || ''
                        ].join(','))
                    ].join('\n');
                    const blob = new Blob([csv], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `categories-${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                    window.URL.revokeObjectURL(url);
                }}
                emptyMessage="No categories found"
                emptyIcon="📂"
            />
        </div>
    );
};

export default CategoryList;
