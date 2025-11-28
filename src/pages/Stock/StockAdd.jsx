import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { stockService } from '../../services/stockService';
import { shopService } from '../../services/shopService';
import { productService } from '../../services/productService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const StockAdd = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, currentShop } = useAuth();
  const { register, handleSubmit, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      min_stock_level: '',
    }
  });

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

  // Fetch selected product details to get default_min_stock_level
  const { data: selectedProduct } = useQuery(
    ['product', productId],
    () => productService.getById(productId),
    { 
      enabled: !!productId,
      staleTime: 5 * 60 * 1000
    }
  );

  // Auto-populate min_stock_level with product's default_min_stock_level when product is selected
  useEffect(() => {
    if (selectedProduct?.data?.default_min_stock_level !== undefined && productId) {
      const defaultMinLevel = selectedProduct.data.default_min_stock_level ?? 0;
      setValue('min_stock_level', defaultMinLevel);
    }
  }, [selectedProduct, productId, setValue]);

  const mutation = useMutation(stockService.add, {
    onSuccess: () => {
      toast.success('Stock added successfully');
      queryClient.invalidateQueries('stock');
      reset(); // Reset form after success
      navigate('/stock');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to add stock');
    },
  });

  const onSubmit = (data) => {
    // Build submit data with required buy_price and sale_price
    const submitData = {
      shop_id: Number(data.shop_id),
      product_id: Number(data.product_id),
      quantity: Number(data.quantity),
      buy_price: Number(data.buy_price),
      sale_price: Number(data.sale_price),
      notes: data.notes || undefined,
      // Only include min_stock_level if explicitly provided and valid
      ...(data.min_stock_level !== '' && 
          data.min_stock_level !== null && 
          data.min_stock_level !== undefined && 
          !isNaN(data.min_stock_level) && 
          Number(data.min_stock_level) >= 0
        ? { min_stock_level: Number(data.min_stock_level) }
        : {}),
    };
    // Remove undefined values
    Object.keys(submitData).forEach(key => {
      if (submitData[key] === undefined) {
        delete submitData[key];
      }
    });
    mutation.mutate(submitData);
  };

  return (
    <div className="form-container">
      <h1>Add Stock</h1>
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
          label="Quantity"
          type="number"
          step="0.01"
          {...register('quantity', { required: 'Quantity is required', valueAsNumber: true })}
          error={errors.quantity}
        />
        <Input
          label="Buy Price (Required)"
          type="number"
          step="0.01"
          {...register('buy_price', { 
            required: 'Buy price is required', 
            valueAsNumber: true,
            min: {
              value: 0,
              message: 'Buy price must be 0 or greater'
            }
          })}
          error={errors.buy_price}
        />
        <Input
          label="Sale Price (Required)"
          type="number"
          step="0.01"
          {...register('sale_price', { 
            required: 'Sale price is required', 
            valueAsNumber: true,
            min: {
              value: 0,
              message: 'Sale price must be 0 or greater'
            }
          })}
          error={errors.sale_price}
        />
        <Input
          label="Min Stock Level (Optional)"
          type="number"
          step="1"
          placeholder={selectedProduct?.data?.default_min_stock_level !== undefined 
            ? `Default: ${selectedProduct.data.default_min_stock_level ?? 0}` 
            : 'Leave empty to use product default'
          }
          {...register('min_stock_level', {
            valueAsNumber: true,
            min: {
              value: 0,
              message: 'Min stock level must be 0 or greater'
            },
            validate: (value) => {
              if (value === '' || value === null || value === undefined) {
                return true; // Allow empty - backend will use product default
              }
              return Number(value) >= 0 || 'Min stock level must be 0 or greater';
            }
          })}
          error={errors.min_stock_level}
        />
        {selectedProduct?.data?.default_min_stock_level !== undefined && (
          <span style={{ fontSize: '12px', color: '#666', marginTop: '-10px', marginBottom: '10px', display: 'block' }}>
            Product default: {selectedProduct.data.default_min_stock_level ?? 0} (leave empty to use this value)
          </span>
        )}
        <div className="form-group">
          <label>Notes</label>
          <textarea {...register('notes')} rows="4" />
        </div>
        <div className="form-actions">
          <Button type="submit" loading={mutation.isLoading}>Add Stock</Button>
          <Button type="button" onClick={() => navigate('/stock')} variant="secondary">Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default StockAdd;


