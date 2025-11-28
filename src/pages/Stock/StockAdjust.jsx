import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { stockService } from '../../services/stockService';
import { shopService } from '../../services/shopService';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const StockAdjust = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, currentShop } = useAuth();
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  const shopId = watch('shop_id');
  const productId = watch('product_id');

  // Check if user is admin or manager
  const isAdminOrManager = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'manager';
  }, [user]);

  // Get user's shop ID
  const userShopId = useMemo(() => {
    return user?.shop_id || currentShop?.id || null;
  }, [user, currentShop]);
  
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

  // Filter shops based on user role
  const shopsList = useMemo(() => {
    const allShops = shops?.data || [];
    if (isAdminOrManager) {
      return allShops;
    } else {
      // Staff can only see their shop
      if (userShopId) {
        return allShops.filter(shop => shop.id === userShopId);
      }
      return [];
    }
  }, [shops, isAdminOrManager, userShopId]);

  const productsList = products?.data || [];
  const { data: currentStock } = useQuery(
    ['stock', shopId, productId],
    () => stockService.getByProduct(shopId, productId),
    { enabled: !!shopId && !!productId }
  );

  const mutation = useMutation(stockService.adjust, {
    onSuccess: () => {
      toast.success('Stock adjusted successfully');
      queryClient.invalidateQueries('stock');
      navigate('/stock');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to adjust stock');
    },
  });

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  return (
    <div className="form-container">
      <h1>Adjust Stock</h1>
      {currentStock?.data && (
        <div style={{ marginBottom: '20px', padding: '10px', background: '#f0f0f0', borderRadius: '4px' }}>
          Current Stock: {currentStock.data.quantity}
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label htmlFor="shop_id">Shop</label>
          {shopsLoading ? (
            <select id="shop_id" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>Loading shops...</option>
            </select>
          ) : shopsList.length === 0 ? (
            <select id="shop_id" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
              <option>No shops available</option>
            </select>
          ) : !isAdminOrManager && userShopId ? (
            // Staff sees their shop only (disabled)
            <select
              id="shop_id"
              {...register('shop_id', { required: 'Shop is required' })}
              disabled
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#f9fafb',
                cursor: 'not-allowed'
              }}
            >
              {shopsList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          ) : (
            // Admin/Manager can select shop
            <select
              id="shop_id"
              {...register('shop_id', { required: 'Shop is required' })}
              className={errors.shop_id ? 'error' : ''}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: errors.shop_id ? '1px solid #ef4444' : '1px solid #d1d5db',
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
          {errors.shop_id && <span className="error-message">{errors.shop_id.message}</span>}
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
          label="New Quantity"
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
          <Button type="submit" loading={mutation.isLoading}>Adjust Stock</Button>
          <Button type="button" onClick={() => navigate('/stock')} variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default StockAdjust;


