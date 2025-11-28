import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { productService } from '../../services/productService';
import { categoryService } from '../../services/categoryService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const ProductForm = ({ productId, onSuccess, onCancel, isModal = false }) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = productId || routeId;
  const isEdit = !!id;

  const { data: product, isLoading: productLoading } = useQuery(
    ['product', id],
    () => productService.getById(id),
    { enabled: isEdit }
  );

  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useQuery(
    ['categories', 'all', 'active'],
    () => categoryService.getAll({ page: 1, limit: 100, status: 'active' }),
    { 
      staleTime: 5 * 60 * 1000,
      retry: 2
    }
  );

  // Extract categories array from response
  // Handle both array and object response structures
  let categories = [];
  if (categoriesData) {
    if (Array.isArray(categoriesData)) {
      // Direct array response
      categories = categoriesData;
    } else if (Array.isArray(categoriesData.data)) {
      // Nested data array
      categories = categoriesData.data;
    } else if (categoriesData.success && categoriesData.data) {
      // Response with success flag
      categories = Array.isArray(categoriesData.data) ? categoriesData.data : [];
    }
  }

  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm({
    defaultValues: {
      default_min_stock_level: 0,
      ...(product?.data || {}),
    },
  });

  // Watch category_id to track current selection
  const selectedCategoryId = watch('category_id');

  // Reset form when product data loads, ensuring category_id is properly set as string
  React.useEffect(() => {
    if (product?.data) {
      // Ensure category_id is converted to string if it's a number
      const productData = {
        ...product.data,
        category_id: product.data.category_id ? String(product.data.category_id) : null,
        default_min_stock_level: product.data.default_min_stock_level ?? 0,
      };
      reset(productData);
    }
  }, [product, reset]);

  // Ensure category is selected when categories load (handles case where categories load after product)
  React.useEffect(() => {
    if (product?.data?.category_id && categories.length > 0 && selectedCategoryId !== String(product.data.category_id)) {
      const categoryIdString = String(product.data.category_id);
      reset({
        ...product.data,
        category_id: categoryIdString,
      }, {
        keepDefaultValues: false
      });
    }
  }, [product, categories, selectedCategoryId, reset]);

  const mutation = useMutation(
    (data) => (isEdit ? productService.update(id, data) : productService.create(data)),
    {
      onSuccess: () => {
        toast.success(`Product ${isEdit ? 'updated' : 'created'} successfully`);
        queryClient.invalidateQueries('products');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/products');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Operation failed');
      },
    }
  );

  const onSubmit = (data) => {
    // Ensure default_min_stock_level defaults to 0 if not provided or invalid
    const submitData = {
      ...data,
      default_min_stock_level: (data.default_min_stock_level !== undefined && data.default_min_stock_level !== null && !isNaN(data.default_min_stock_level))
        ? Number(data.default_min_stock_level)
        : 0,
    };
    mutation.mutate(submitData);
  };

  const handleCancel = () => {
    if (isModal && onCancel) {
      onCancel();
    } else {
      navigate('/products');
    }
  };

  if (isEdit && productLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="product-form">
      <div className="form-grid">
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name}
        />
        <Input
          label="SKU"
          {...register('sku')}
          error={errors.sku}
        />
        <div className="form-group">
          <label htmlFor="category_id">Category</label>
          {categoriesLoading ? (
            <select id="category_id" disabled className="loading">
              <option>Loading categories...</option>
            </select>
          ) : categoriesError ? (
            <select id="category_id" disabled className="error">
              <option>Error loading categories</option>
            </select>
          ) : categories.length === 0 ? (
            <select id="category_id" disabled className="warning">
              <option>No categories available</option>
            </select>
          ) : (
            <select
              id="category_id"
              {...register('category_id', {
                setValueAs: (value) => {
                  // Convert empty string to null, and ensure numbers are strings
                  if (value === '' || value === null || value === undefined) {
                    return null;
                  }
                  return String(value);
                }
              })}
              className={errors.category_id ? 'error' : ''}
            >
              <option value="">Select Category</option>
              {categories.map((category) => (
                <option key={category.id} value={String(category.id)}>
                  {category.name} {category.status && `(${category.status})`}
                </option>
              ))}
            </select>
          )}
          {errors.category_id && (
            <span className="error-message">{errors.category_id.message}</span>
          )}
          {!categoriesLoading && !categoriesError && categories.length === 0 && (
            <span className="warning-message" style={{ fontSize: '12px', color: '#f59e0b' }}>
              No categories found. Please create categories first.
            </span>
          )}
        </div>
        <Input
          label="Barcode"
          {...register('barcode')}
          error={errors.barcode}
        />
        <Input
          label="Default Min Stock Level (Optional)"
          type="number"
          step="1"
          placeholder="0"
          {...register('default_min_stock_level', { 
            valueAsNumber: true,
            min: {
              value: 0,
              message: 'Min stock level must be 0 or greater'
            },
            validate: (value) => {
              // Allow empty/undefined (will default to 0 on backend)
              if (value === undefined || value === null || value === '' || isNaN(value)) {
                return true;
              }
              return Number(value) >= 0 || 'Min stock level must be 0 or greater';
            }
          })}
          error={errors.default_min_stock_level}
        />
        <div className="form-group form-group-full">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            {...register('description')}
            rows="4"
            className={errors.description ? 'error' : ''}
          />
          {errors.description && (
            <span className="error-message">{errors.description.message}</span>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            {...register('status')}
            className={errors.status ? 'error' : ''}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="discontinued">Discontinued</option>
          </select>
          {errors.status && (
            <span className="error-message">{errors.status.message}</span>
          )}
        </div>
      </div>
      <div className="form-actions">
        <Button type="submit" loading={mutation.isLoading}>
          {isEdit ? 'Update Product' : 'Create Product'}
        </Button>
        <Button type="button" onClick={handleCancel} variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductForm;


