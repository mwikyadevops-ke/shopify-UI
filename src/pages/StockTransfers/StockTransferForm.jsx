import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { stockTransferService } from '../../services/stockTransferService';
import { shopService } from '../../services/shopService';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const StockTransferForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors } } = useForm();

  const { data: shops, isLoading: shopsLoading } = useQuery(
    'shops', 
    () => shopService.getAll({ limit: 100 }), 
    { 
      staleTime: 5 * 60 * 1000,
      retry: 2
    }
  );
  const { data: products, isLoading: productsLoading } = useQuery(
    'products', 
    () => productService.getAll({ limit: 100 }), 
    { 
      staleTime: 5 * 60 * 1000,
      retry: 2
    }
  );

  const shopsList = shops?.data || [];
  const productsList = products?.data || [];

  const mutation = useMutation(stockTransferService.create, {
    onSuccess: () => {
      toast.success('Stock transfer created successfully');
      queryClient.invalidateQueries('stock-transfers');
      navigate('/stock-transfers');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create transfer');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="form-container">
      <h1>Create Stock Transfer</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="from_shop_id">From Shop</label>
          {shopsLoading ? (
            <select id="from_shop_id" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>Loading shops...</option>
            </select>
          ) : shopsList.length === 0 ? (
            <select id="from_shop_id" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>No shops available</option>
            </select>
          ) : (
            <select
              id="from_shop_id"
              {...register('from_shop_id', { required: 'From shop is required' })}
              className={errors.from_shop_id ? 'error' : ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: errors.from_shop_id ? '1px solid #ef4444' : '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >
              <option value="">Select Shop</option>
              {shopsList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          )}
          {errors.from_shop_id && <span className="error-message">{errors.from_shop_id.message}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="to_shop_id">To Shop</label>
          {shopsLoading ? (
            <select id="to_shop_id" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>Loading shops...</option>
            </select>
          ) : shopsList.length === 0 ? (
            <select id="to_shop_id" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>No shops available</option>
            </select>
          ) : (
            <select
              id="to_shop_id"
              {...register('to_shop_id', { required: 'To shop is required' })}
              className={errors.to_shop_id ? 'error' : ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: errors.to_shop_id ? '1px solid #ef4444' : '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >
              <option value="">Select Shop</option>
              {shopsList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          )}
          {errors.to_shop_id && <span className="error-message">{errors.to_shop_id.message}</span>}
        </div>
        <div className="form-group">
          <label htmlFor="product_id">Product</label>
          {productsLoading ? (
            <select id="product_id" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>Loading products...</option>
            </select>
          ) : productsList.length === 0 ? (
            <select id="product_id" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>No products available</option>
            </select>
          ) : (
            <select
              id="product_id"
              {...register('product_id', { required: 'Product is required' })}
              className={errors.product_id ? 'error' : ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: errors.product_id ? '1px solid #ef4444' : '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
                transition: 'border-color 0.2s, box-shadow 0.2s'
              }}
            >
              <option value="">Select Product</option>
              {productsList.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name} {product.sku && `(${product.sku})`}
                </option>
              ))}
            </select>
          )}
          {errors.product_id && <span className="error-message">{errors.product_id.message}</span>}
        </div>
        <Input
          label="Quantity"
          type="number"
          step="0.01"
          {...register('quantity', { required: 'Quantity is required', valueAsNumber: true })}
          error={errors.quantity}
        />
        <div className="form-group">
          <label>Notes</label>
          <textarea {...register('notes')} rows="4" />
        </div>
        <div className="form-actions">
          <Button type="submit" loading={mutation.isLoading}>Create Transfer</Button>
          <Button type="button" onClick={() => navigate('/stock-transfers')} variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default StockTransferForm;


