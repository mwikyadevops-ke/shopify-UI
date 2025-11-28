import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { saleService } from '../../services/saleService';
import { shopService } from '../../services/shopService';
import { productService } from '../../services/productService';
import { stockService } from '../../services/stockService';
import { paymentService } from '../../services/paymentService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';
import './SaleCreate.css';

const SaleCreate = ({ isModal = false, onSuccess, onCancel }) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, currentShop } = useAuth();
  const { register, handleSubmit, control, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      shop_id: '',
      items: [{ product_id: '', quantity: 1, unit_price: 0, discount: 0 }],
      tax_amount: 0,
      discount_amount: 0,
      apply_vat: false,
      payment_method: 'cash',
      amount_paid: 0,
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const shopId = watch('shop_id');
  const items = watch('items');
  const taxAmount = watch('tax_amount') || 0;
  const discountAmount = watch('discount_amount') || 0;
  const amountPaid = watch('amount_paid') || 0;
  const applyVat = watch('apply_vat') || false;
  
  // Store payment data temporarily to use after sale creation
  const pendingPaymentData = useRef(null);

  // Check if user is admin or manager
  const isAdminOrManager = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'manager';
  }, [user]);

  // Get user's shop ID
  const userShopId = useMemo(() => {
    return user?.shop_id || currentShop?.id || null;
  }, [user, currentShop]);

  const { data: shops } = useQuery('shops', () => shopService.getAll({ limit: 100 }));

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

  // Auto-set shop_id for staff on mount
  useEffect(() => {
    if (!isAdminOrManager && userShopId && !shopId) {
      setValue('shop_id', String(userShopId));
    }
  }, [isAdminOrManager, userShopId, shopId, setValue]);
  const { data: productsData, isLoading: productsLoading, error: productsError } = useQuery(
    'products',
    () => productService.getAll({ limit: 100 })
  );

  // Extract products array from response (handle different response structures)
  const products = Array.isArray(productsData) 
    ? productsData 
    : (Array.isArray(productsData?.data) 
        ? productsData.data 
        : (productsData?.success && Array.isArray(productsData?.data) 
            ? productsData.data 
            : []));
  
  // Fetch stock for the selected shop to get prices
  const { data: stockData } = useQuery(
    ['stock', 'shop', shopId],
    () => stockService.getByShop(shopId, { limit: 100 }),
    { enabled: !!shopId }
  );

  const stockItems = stockData?.data || [];

  // Function to get stock item by product_id
  const getStockItem = (productId) => {
    return stockItems.find(stock => stock.product_id === Number(productId) || stock.product_id?.toString() === productId);
  };

  // Auto-fill price when product is selected
  const handleProductChange = (index, productId) => {
    if (productId && shopId) {
      const stockItem = getStockItem(productId);
      if (stockItem && stockItem.sale_price) {
        setValue(`items.${index}.unit_price`, stockItem.sale_price);
      }
    }
  };

  // Auto-fill prices when shop changes
  useEffect(() => {
    if (shopId && stockItems.length > 0) {
      fields.forEach((field, index) => {
        const productId = watch(`items.${index}.product_id`);
        if (productId) {
          const stockItem = getStockItem(productId);
          if (stockItem && stockItem.sale_price) {
            setValue(`items.${index}.unit_price`, stockItem.sale_price);
          }
        }
      });
    }
  }, [shopId, stockItems, fields, watch, setValue]);

  // Auto-calculate VAT when checkbox is toggled or subtotal changes
  useEffect(() => {
    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = parseFloat(item.unit_price || 0);
      const itemDiscount = parseFloat(item.discount || 0);
      const itemTotal = (quantity * unitPrice) - itemDiscount;
      return sum + itemTotal;
    }, 0);

    if (applyVat) {
      const vatAmount = subtotal * 0.16;
      setValue('tax_amount', vatAmount);
    } else {
      // Clear tax when VAT checkbox is unchecked
      setValue('tax_amount', 0);
    }
  }, [applyVat, items, setValue]);

  // Calculate totals dynamically
  const calculateTotals = useMemo(() => {
    if (!items || items.length === 0) {
      return { subtotal: 0, total: 0, balance: 0 };
    }

    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = parseFloat(item.unit_price || 0);
      const itemDiscount = parseFloat(item.discount || 0);
      const itemTotal = (quantity * unitPrice) - itemDiscount;
      return sum + itemTotal;
    }, 0);

    const tax = parseFloat(taxAmount || 0);
    const discount = parseFloat(discountAmount || 0);
    const total = subtotal + tax - discount;
    const paid = parseFloat(amountPaid || 0);
    const balance = total - paid;

    return { subtotal, total, balance, paid };
  }, [items, taxAmount, discountAmount, amountPaid]);

  // Auto-fill amount paid with total when payment method is cash and user hasn't entered anything
  useEffect(() => {
    if (calculateTotals.total > 0) {
      const paymentMethod = watch('payment_method');
      const currentAmountPaid = watch('amount_paid');
      // Auto-fill with total for cash payments only if user hasn't entered anything
      if (paymentMethod === 'cash' && (!currentAmountPaid || currentAmountPaid === 0)) {
        setValue('amount_paid', calculateTotals.total);
      }
    }
  }, [calculateTotals.total, watch, setValue, watch]);

  // Separate mutation for payment processing
  const paymentMutation = useMutation(paymentService.create, {
    onSuccess: () => {
      toast.success('Sale created and payment processed successfully');
      queryClient.invalidateQueries('sales');
      queryClient.invalidateQueries('payments');
      queryClient.invalidateQueries(['sale']); // Refresh sale detail if viewing
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        navigate('/sales');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Sale created but failed to process payment. Please process payment manually.');
      // Still show success and handle modal/redirect appropriately
      queryClient.invalidateQueries('sales');
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        navigate('/sales');
      }
    },
  });

  const saleMutation = useMutation(saleService.create, {
    onSuccess: (response) => {
      // Get the created sale ID from response
      const createdSale = response?.data || response;
      const saleId = createdSale?.id || createdSale?.data?.id;
      
      // Get payment data from ref (stored before mutation)
      const paymentData = pendingPaymentData.current;

      if (saleId) {
        // If payment details provided, automatically process payment
        if (paymentData && paymentData.amount && parseFloat(paymentData.amount) > 0) {
          const paymentPayload = {
            sale_id: Number(saleId),
            payment_method: paymentData.payment_method || 'cash',
            amount: Number(paymentData.amount),
            ...(paymentData.reference_number && { reference_number: paymentData.reference_number }),
            ...(paymentData.notes && { notes: paymentData.notes }),
          };

          // Remove undefined values
          Object.keys(paymentPayload).forEach(key => {
            if (paymentPayload[key] === undefined) {
              delete paymentPayload[key];
            }
          });

          // Clear the ref
          pendingPaymentData.current = null;
          paymentMutation.mutate(paymentPayload);
        } else {
          // No payment, just show success and handle modal/redirect
          pendingPaymentData.current = null;
          toast.success('Sale created successfully');
          queryClient.invalidateQueries('sales');
          queryClient.invalidateQueries('payments');
          if (isModal && onSuccess) {
            onSuccess();
          } else {
            navigate('/sales');
          }
        }
      } else {
        pendingPaymentData.current = null;
        toast.success('Sale created successfully');
        queryClient.invalidateQueries('sales');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/sales');
        }
      }
    },
    onError: (error) => {
      pendingPaymentData.current = null;
      toast.error(error.response?.data?.message || 'Failed to create sale');
    },
  });

  const onSubmit = (data) => {
    // Store payment data in ref for use after sale creation
    pendingPaymentData.current = data.amount_paid && parseFloat(data.amount_paid) > 0 ? {
      amount: data.amount_paid,
      payment_method: data.payment_method || 'cash',
      reference_number: data.reference_number,
      notes: data.payment_notes,
    } : null;

    // Prepare sale data (without payment info - we'll process payment separately)
    const saleData = {
      shop_id: Number(data.shop_id),
      customer_name: data.customer_name || undefined,
      customer_email: data.customer_email || undefined,
      customer_phone: data.customer_phone || undefined,
      items: data.items.map(item => ({
        product_id: Number(item.product_id),
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount || 0),
      })),
      tax_amount: Number(data.tax_amount || 0),
      discount_amount: Number(data.discount_amount || 0),
      notes: data.notes || undefined,
    };

    // Remove undefined values
    Object.keys(saleData).forEach(key => {
      if (saleData[key] === undefined) {
        delete saleData[key];
      }
    });
    
    // Create sale - payment will be processed automatically in onSuccess
    saleMutation.mutate(saleData);
  };

  const handleCancel = () => {
    if (isModal && onCancel) {
      onCancel();
    } else {
      navigate('/sales');
    }
  };

  return (
    <div className={`form-container ${isModal ? 'form-container-modal' : ''}`}>
      {!isModal && <h1>Create Sale</h1>}
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="form-group">
          <label>Shop</label>
          {!isAdminOrManager && userShopId ? (
            // Staff sees their shop only (disabled)
            <select 
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
            <select {...register('shop_id', { required: 'Shop is required' })}>
              <option value="">Select Shop</option>
              {shopsList.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <Input label="Customer Name" {...register('customer_name')} />
        <Input label="Customer Email" type="email" {...register('customer_email')} />
        <Input label="Customer Phone" {...register('customer_phone')} />

        <h3>Items</h3>
        {fields.map((field, index) => {
          const productId = watch(`items.${index}.product_id`);
          const stockItem = getStockItem(productId);
          const availableStock = stockItem?.quantity || 0;
          const salePrice = stockItem?.sale_price || 0;

          return (
            <div key={field.id} className="sale-item-card" style={{ border: '1px solid #ddd', padding: '10px', marginBottom: '10px', borderRadius: '4px' }}>
              {/* Product Selection Row */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label>Product</label>
                <select 
                  {...register(`items.${index}.product_id`, { 
                    required: true,
                    onChange: (e) => {
                      handleProductChange(index, e.target.value);
                    }
                  })}
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '6px',
                    border: errors.items?.[index]?.product_id ? '1px solid #ef4444' : '1px solid #d1d5db',
                    fontSize: '14px',
                    backgroundColor: '#fff',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select Product</option>
                  {productsLoading ? (
                    <option disabled>Loading products...</option>
                  ) : productsError ? (
                    <option disabled>Error loading products</option>
                  ) : products && products.length > 0 ? (
                    products.map((product) => {
                      const productStock = getStockItem(product.id);
                      const stockQty = productStock?.quantity || 0;
                      const price = productStock?.sale_price || 0;
                      return (
                        <option key={product.id} value={product.id}>
                          {product.name} {price > 0 ? `- Ksh ${parseFloat(price).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : ''} {stockQty > 0 ? `(Stock: ${stockQty})` : '(Out of Stock)'}
                        </option>
                      );
                    })
                  ) : (
                    <option disabled>No products available</option>
                  )}
                </select>
                {productsLoading && (
                  <span style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', display: 'block' }}>
                    Loading products...
                  </span>
                )}
                {productsError && (
                  <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    Error loading products: {productsError.message || 'Unknown error'}
                  </span>
                )}
                {!productsLoading && !productsError && (!products || products.length === 0) && (
                  <span style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                    No products available. Please create products first.
                  </span>
                )}
                {productId && stockItem && (
                  <span style={{ fontSize: '12px', color: availableStock > 0 ? '#10b981' : '#ef4444', marginTop: '4px', display: 'block' }}>
                    Available: {availableStock} {availableStock === 0 && '- Out of Stock'}
                  </span>
                )}
                {errors.items?.[index]?.product_id && (
                  <span style={{ fontSize: '12px', color: '#ef4444', marginTop: '4px', display: 'block' }}>
                    {errors.items[index].product_id.message || 'Product is required'}
                  </span>
                )}
              </div>
              
              {/* Quantity, Price, Discount, Amount Row */}
              <div className="sale-item-grid" style={{ display: 'grid', gridTemplateColumns: index === 0 ? '1fr 1fr 1fr 1fr' : '1fr 1fr 1fr 1fr auto', gap: '10px', alignItems: 'start' }}>
                <Input 
                  label="Quantity" 
                  type="number" 
                  {...register(`items.${index}.quantity`, { 
                    valueAsNumber: true,
                    min: {
                      value: 0.01,
                      message: 'Quantity must be greater than 0'
                    },
                    validate: (value) => {
                      if (productId && stockItem) {
                        return Number(value) <= availableStock || `Quantity cannot exceed available stock (${availableStock})`;
                      }
                      return true;
                    },
                    onChange: () => {
                      // Trigger recalculation
                    }
                  })}
                  error={errors.items?.[index]?.quantity}
                />
                <Input 
                  label="Unit Price" 
                  type="number" 
                  step="0.01"
                  placeholder={salePrice > 0 ? salePrice.toString() : ''}
                  {...register(`items.${index}.unit_price`, { 
                    valueAsNumber: true,
                    required: 'Unit price is required',
                    min: {
                      value: 0,
                      message: 'Unit price must be 0 or greater'
                    },
                    onChange: () => {
                      // Trigger recalculation
                    }
                  })} 
                  error={errors.items?.[index]?.unit_price}
                />
                <Input 
                  label="Discount" 
                  type="number" 
                  step="0.01" 
                  {...register(`items.${index}.discount`, { 
                    valueAsNumber: true,
                    min: {
                      value: 0,
                      message: 'Discount cannot be negative'
                    },
                    onChange: () => {
                      // Trigger recalculation
                    }
                  })} 
                  error={errors.items?.[index]?.discount}
                />
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '5px', display: 'block' }}>Amount</label>
                  <div style={{ 
                    padding: '10px 12px', 
                    borderRadius: '6px', 
                    border: '1px solid #d1d5db',
                    backgroundColor: '#f9fafb',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#059669',
                    minHeight: '42px',
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    boxSizing: 'border-box'
                  }}>
                    Ksh {(() => {
                      const quantity = parseFloat(watch(`items.${index}.quantity`) || 0);
                      const unitPrice = parseFloat(watch(`items.${index}.unit_price`) || 0);
                      const discount = parseFloat(watch(`items.${index}.discount`) || 0);
                      const amount = (quantity * unitPrice) - discount;
                      return amount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    })()}
                  </div>
                </div>
                {index > 0 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    title="Remove item"
                    style={{
                      height: '42px',
                      width: '42px',
                      padding: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#fee2e2',
                      border: '1px solid #fecaca',
                      borderRadius: '6px',
                      color: '#dc2626',
                      cursor: 'pointer',
                      fontSize: '18px',
                      fontWeight: '600',
                      transition: 'all 0.2s',
                      lineHeight: 1,
                      marginTop: '24px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#fecaca';
                      e.currentTarget.style.borderColor = '#f87171';
                      e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#fee2e2';
                      e.currentTarget.style.borderColor = '#fecaca';
                      e.currentTarget.style.transform = 'scale(1)';
                    }}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          );
        })}
        <Button type="button" onClick={() => append({ product_id: '', quantity: 1, unit_price: 0, discount: 0 })}>
          Add Item
        </Button>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              {...register('apply_vat')}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
            <span style={{ fontSize: '16px', fontWeight: '500' }}>Apply 16% VAT</span>
          </label>
        </div>
        <Input 
          label="Tax Amount" 
          type="number" 
          step="0.01" 
          {...register('tax_amount', { valueAsNumber: true })} 
          disabled={applyVat}
          style={applyVat ? { backgroundColor: '#f3f4f6', cursor: 'not-allowed' } : {}}
        />
        <Input label="Discount Amount" type="number" step="0.01" {...register('discount_amount', { valueAsNumber: true })} />

        {/* Summary Section */}
        <div className="summary-section" style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Summary</h3>
          <div className="summary-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Subtotal:</span>
              <span style={{ fontWeight: '600' }}>
                Ksh {calculateTotals.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {taxAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Tax:</span>
                <span style={{ fontWeight: '600' }}>
                  Ksh {parseFloat(taxAmount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {discountAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>Discount:</span>
                <span style={{ fontWeight: '600', color: '#ef4444' }}>
                  - Ksh {parseFloat(discountAmount).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              paddingTop: '12px',
              borderTop: '2px solid #e5e7eb',
              gridColumn: '1 / -1'
            }}>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#374151' }}>Total Amount:</span>
              <span style={{ fontSize: '20px', fontWeight: '700', color: '#059669' }}>
                Ksh {calculateTotals.total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="payment-section" style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: '#fef3c7', 
          borderRadius: '8px',
          border: '1px solid #fbbf24'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#92400e' }}>Payment Information</h3>
          <div className="payment-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                {...register('payment_method', { required: 'Payment method is required' })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '6px',
                  border: errors.payment_method ? '1px solid #ef4444' : '1px solid #d1d5db',
                  fontSize: '14px',
                  backgroundColor: '#fff',
                  cursor: 'pointer',
                }}
              >
                <option value="cash">Cash</option>
                <option value="card">Card</option>
                <option value="mobile_money">Mobile Money</option>
                <option value="mpesa">M-Pesa</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="credit">Credit</option>
                <option value="other">Other</option>
              </select>
              {errors.payment_method && <span className="error-message">{errors.payment_method.message}</span>}
            </div>
            <Input
              label="Amount Paid"
              type="number"
              step="0.01"
              placeholder={calculateTotals.total > 0 ? calculateTotals.total.toString() : '0.00'}
              {...register('amount_paid', { 
                valueAsNumber: true,
                min: {
                  value: 0,
                  message: 'Amount paid cannot be negative'
                },
                validate: (value) => {
                  const paid = parseFloat(value || 0);
                  const total = calculateTotals.total;
                  if (paid > total) {
                    return `Amount paid cannot exceed total amount (Ksh ${total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
                  }
                  return true;
                },
                onChange: () => {
                  // Trigger balance recalculation
                }
              })}
              error={errors.amount_paid}
            />
          </div>
          
          {/* Balance Display */}
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: calculateTotals.balance <= 0 ? '#d1fae5' : '#fee2e2',
            borderRadius: '6px',
            border: `2px solid ${calculateTotals.balance <= 0 ? '#10b981' : '#ef4444'}`
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ 
                fontSize: '16px', 
                fontWeight: '600',
                color: calculateTotals.balance <= 0 ? '#065f46' : '#991b1b'
              }}>
                {calculateTotals.balance <= 0 ? '✓ Fully Paid' : calculateTotals.balance < calculateTotals.total ? 'Balance Due' : 'Unpaid'}
              </span>
              <span style={{ 
                fontSize: '20px', 
                fontWeight: '700',
                color: calculateTotals.balance <= 0 ? '#10b981' : '#ef4444'
              }}>
                Ksh {Math.abs(calculateTotals.balance).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {calculateTotals.balance > 0 && calculateTotals.balance < calculateTotals.total && (
              <div style={{ 
                marginTop: '8px', 
                fontSize: '12px', 
                color: '#92400e',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Total: Ksh {calculateTotals.total.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>Paid: Ksh {calculateTotals.paid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <span>Due: Ksh {calculateTotals.balance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
          </div>

          {/* Reference Number for non-cash payments */}
          {watch('payment_method') && watch('payment_method') !== 'cash' && (
            <div style={{ marginTop: '16px' }}>
              <Input
                label="Reference Number (Optional)"
                {...register('reference_number')}
                placeholder="e.g., Transaction ID, Receipt Number"
                error={errors.reference_number}
              />
            </div>
          )}
          
          <div style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Payment Notes (Optional)</label>
              <textarea 
                {...register('payment_notes')} 
                rows="3"
                placeholder="Additional payment information..."
              />
            </div>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '24px' }}>
          <label>Notes</label>
          <textarea {...register('notes')} rows="4" placeholder="Sale notes..." />
        </div>

        <div className="form-actions">
          <Button 
            type="submit" 
            loading={saleMutation.isLoading || paymentMutation.isLoading}
          >
            {paymentMutation.isLoading ? 'Processing Payment...' : saleMutation.isLoading ? 'Creating Sale...' : 'Create Sale'}
          </Button>
          <Button type="button" onClick={handleCancel} variant="secondary" disabled={saleMutation.isLoading || paymentMutation.isLoading}>Cancel</Button>
        </div>
      </form>
    </div>
  );
};

export default SaleCreate;

