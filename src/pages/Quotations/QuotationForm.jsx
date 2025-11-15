import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useMemo } from 'react';
import { quotationService } from '../../services/quotationService';
import { shopService } from '../../services/shopService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const QuotationForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { id } = useParams();
  const isEdit = !!id;

  const { register, handleSubmit, control, formState: { errors }, watch, setValue, reset } = useForm({
    defaultValues: {
      supplier_name: '',
      supplier_email: '',
      supplier_phone: '',
      supplier_address: '',
      shop_id: '',
      items: [{ item_name: '', item_description: '', item_sku: '', quantity: 1, unit_price: 0, discount: 0 }],
      apply_tax: false,
      discount_amount: 0,
      valid_until: '',
      notes: '',
      status: 'draft',
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const items = watch('items');
  const applyTax = watch('apply_tax');
  const discountAmount = watch('discount_amount') || 0;

  const { data: shops } = useQuery('shops', () => shopService.getAll({ limit: 100 }));
  
  // Fetch quotation if editing
  const { data: quotationData, isLoading: quotationLoading } = useQuery(
    ['quotation', id],
    () => quotationService.getById(id),
    { enabled: isEdit }
  );

  const quotation = quotationData?.data;

  // Load quotation data when editing
  useEffect(() => {
    if (quotation && isEdit) {
      reset({
        supplier_name: quotation.supplier_name || '',
        supplier_email: quotation.supplier_email || '',
        supplier_phone: quotation.supplier_phone || '',
        supplier_address: quotation.supplier_address || '',
        shop_id: quotation.shop_id || '',
        items: quotation.items && quotation.items.length > 0 
          ? quotation.items.map(item => ({
              item_name: item.item_name || '',
              item_description: item.item_description || '',
              item_sku: item.item_sku || '',
              quantity: parseFloat(item.quantity || 1),
              unit_price: parseFloat(item.unit_price || 0),
              discount: parseFloat(item.discount || 0),
            }))
          : [{ item_name: '', item_description: '', item_sku: '', quantity: 1, unit_price: 0, discount: 0 }],
        apply_tax: quotation.tax_amount > 0 && Math.abs(quotation.tax_amount - (quotation.subtotal * 0.16)) < 0.01,
        discount_amount: parseFloat(quotation.discount_amount || 0),
        valid_until: quotation.valid_until ? new Date(quotation.valid_until).toISOString().split('T')[0] : '',
        notes: quotation.notes || '',
        status: quotation.status || 'draft',
      });
    }
  }, [quotation, isEdit, reset]);

  // Calculate totals dynamically
  const calculateTotals = useMemo(() => {
    if (!items || items.length === 0) {
      return { subtotal: 0, tax: 0, total: 0 };
    }

    const subtotal = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity || 0);
      const unitPrice = parseFloat(item.unit_price || 0);
      const itemDiscount = parseFloat(item.discount || 0);
      const itemTotal = (quantity * unitPrice) - itemDiscount;
      return sum + itemTotal;
    }, 0);

    // Calculate tax if enabled (16% of subtotal)
    const tax = applyTax ? subtotal * 0.16 : 0;

    const discount = parseFloat(discountAmount || 0);
    const total = subtotal + tax - discount;

    return { subtotal, tax, total };
  }, [items, applyTax, discountAmount]);


  const mutation = useMutation(
    (data) => isEdit ? quotationService.update(id, data) : quotationService.create(data),
    {
      onSuccess: () => {
        toast.success(`Quotation ${isEdit ? 'updated' : 'created'} successfully`);
        queryClient.invalidateQueries('quotations');
      queryClient.invalidateQueries('draft-quotations'); // Invalidate draft list
      queryClient.invalidateQueries('draft-quotations-count'); // Invalidate draft count
        navigate('/quotations');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'create'} quotation`);
      },
    }
  );

  const onSubmit = (data) => {
    const quotationData = {
      supplier_name: data.supplier_name,
      supplier_email: data.supplier_email || undefined,
      supplier_phone: data.supplier_phone || undefined,
      supplier_address: data.supplier_address || undefined,
      shop_id: data.shop_id ? Number(data.shop_id) : undefined,
      items: data.items.map(item => ({
        item_name: item.item_name,
        item_description: item.item_description || undefined,
        item_sku: item.item_sku || undefined,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount: Number(item.discount || 0),
      })),
      apply_tax: data.apply_tax === true || data.apply_tax === 'true',
      discount_amount: Number(data.discount_amount || 0),
      valid_until: data.valid_until || undefined,
      notes: data.notes || undefined,
      status: data.status || 'draft',
    };

    // Remove undefined values
    Object.keys(quotationData).forEach(key => {
      if (quotationData[key] === undefined) {
        delete quotationData[key];
      }
    });

    // Remove undefined from nested items
    quotationData.items = quotationData.items.map(item => {
      Object.keys(item).forEach(key => {
        if (item[key] === undefined) {
          delete item[key];
        }
      });
      return item;
    });

    console.log('📋 Quotation data:', quotationData);
    mutation.mutate(quotationData);
  };

  if (quotationLoading && isEdit) {
    return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;
  }

  return (
    <div className="form-container">
      <h1>{isEdit ? 'Edit Quotation' : 'Create Quotation'}</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Supplier Information */}
        <div style={{ 
          marginBottom: '24px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Supplier Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input
              label="Supplier Name *"
              {...register('supplier_name', { required: 'Supplier name is required' })}
              error={errors.supplier_name}
            />
            <Input
              label="Supplier Email"
              type="email"
              {...register('supplier_email')}
              error={errors.supplier_email}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <Input
              label="Supplier Phone"
              {...register('supplier_phone')}
              error={errors.supplier_phone}
            />
            <div className="form-group">
              <label>Shop (Optional)</label>
              <select {...register('shop_id')}>
                <option value="">All Shops</option>
                {shops?.data?.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div className="form-group">
              <label>Supplier Address</label>
              <textarea {...register('supplier_address')} rows="3" placeholder="Supplier address..." />
            </div>
          </div>
        </div>

        {/* Items */}
        <h3>Items</h3>
        {fields.map((field, index) => (
          <div key={field.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '15px', borderRadius: '6px', background: '#fff' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <Input
                label="Item Name *"
                {...register(`items.${index}.item_name`, { required: 'Item name is required' })}
                error={errors.items?.[index]?.item_name}
                placeholder="Enter item name"
              />
              <Input
                label="Item SKU"
                {...register(`items.${index}.item_sku`)}
                error={errors.items?.[index]?.item_sku}
                placeholder="SKU (optional)"
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div className="form-group">
                <label>Item Description</label>
                <textarea 
                  {...register(`items.${index}.item_description`)} 
                  rows="2"
                  placeholder="Item description (optional)"
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: '12px', alignItems: 'end' }}>
              <Input
                label="Quantity *"
                type="number"
                step="0.01"
                {...register(`items.${index}.quantity`, { 
                  required: 'Quantity is required',
                  valueAsNumber: true,
                  min: { value: 0.01, message: 'Quantity must be greater than 0' }
                })}
                error={errors.items?.[index]?.quantity}
              />
              <Input
                label="Unit Price (Ksh) *"
                type="number"
                step="0.01"
                {...register(`items.${index}.unit_price`, { 
                  required: 'Unit price is required',
                  valueAsNumber: true,
                  min: { value: 0, message: 'Unit price must be 0 or greater' }
                })}
                error={errors.items?.[index]?.unit_price}
              />
              <Input
                label="Discount (Ksh)"
                type="number"
                step="0.01"
                {...register(`items.${index}.discount`, { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Discount cannot be negative' }
                })}
                error={errors.items?.[index]?.discount}
              />
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                  Total
                </label>
                <div style={{ 
                  padding: '10px 12px', 
                  background: '#f3f4f6', 
                  borderRadius: '6px', 
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#059669'
                }}>
                  Ksh {(
                    (parseFloat(watch(`items.${index}.quantity`) || 0) * parseFloat(watch(`items.${index}.unit_price`) || 0)) -
                    parseFloat(watch(`items.${index}.discount`) || 0)
                  ).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              {fields.length > 1 && (
                <Button 
                  type="button" 
                  onClick={() => remove(index)} 
                  variant="danger"
                  style={{ height: 'fit-content' }}
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
        <Button type="button" onClick={() => append({ item_name: '', item_description: '', item_sku: '', quantity: 1, unit_price: 0, discount: 0 })}>
          Add Item
        </Button>

        {/* Summary Section */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#6b7280', fontWeight: '500' }}>Subtotal:</span>
              <span style={{ fontWeight: '600' }}>
                Ksh {calculateTotals.subtotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {applyTax && calculateTotals.tax > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280', fontWeight: '500' }}>
                  Tax (16%):
                </span>
                <span style={{ fontWeight: '600' }}>
                  Ksh {calculateTotals.tax.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

        {/* VAT and Tax Section */}
        <div style={{ 
          marginTop: '24px', 
          padding: '20px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#374151' }}>Tax & Discount</h3>
          
          <div className="form-group">
            <label>Apply 16% Tax</label>
            <select 
              {...register('apply_tax')}
              onChange={(e) => {
                const value = e.target.value === 'true';
                setValue('apply_tax', value);
                // Clear tax calculation when tax is disabled
                if (!value) {
                  // No tax selected - ensure tax is 0
                  // The calculateTotals will handle this, but we can explicitly clear it
                }
              }}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                fontSize: '14px',
                backgroundColor: '#fff',
                cursor: 'pointer',
              }}
            >
              <option value="false">No Tax</option>
              <option value="true">Apply 16% Tax</option>
            </select>
            {applyTax && (
              <div style={{ 
                marginTop: '8px', 
                padding: '8px 12px', 
                background: '#dbeafe', 
                borderRadius: '6px',
                fontSize: '13px',
                color: '#1e40af'
              }}>
                Tax will be automatically calculated as 16% of subtotal: <strong>Ksh {calculateTotals.tax.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
              </div>
            )}
          </div>
          
          <Input 
            label="Discount Amount (Ksh)" 
            type="number" 
            step="0.01" 
            {...register('discount_amount', { valueAsNumber: true })} 
          />
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
          <Input
            label="Valid Until"
            type="date"
            {...register('valid_until')}
            error={errors.valid_until}
          />
          <div className="form-group">
            <label>Status</label>
            <select {...register('status')}>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="expired">Expired</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="form-group" style={{ marginTop: '16px' }}>
          <label>Notes</label>
          <textarea {...register('notes')} rows="4" placeholder="Additional notes..." />
        </div>

        <div className="form-actions">
          <Button type="submit" loading={mutation.isLoading}>
            {isEdit ? 'Update Quotation' : 'Create Quotation'}
          </Button>
          <Button type="button" onClick={() => navigate('/quotations')} variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default QuotationForm;

