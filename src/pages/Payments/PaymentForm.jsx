import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { paymentService } from '../../services/paymentService';
import { saleService } from '../../services/saleService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const PaymentForm = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const saleIdParam = searchParams.get('sale_id');
  
  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
    defaultValues: {
      sale_id: saleIdParam || '',
      payment_method: 'cash',
      amount: 0,
    },
  });

  // Use sale_id from URL if available, otherwise from form
  const selectedSaleId = saleIdParam || watch('sale_id');
  const paymentAmount = watch('amount') || 0;

  // Only fetch sales list if we need to show the sale selector
  const { data: sales } = useQuery(
    'sales', 
    () => saleService.getAll({ limit: 100 }),
    { enabled: !saleIdParam } // Only fetch when sale selector is needed
  );
  
  // Fetch selected sale details to show balance
  const { data: selectedSaleData } = useQuery(
    ['sale', selectedSaleId],
    () => saleService.getById(selectedSaleId),
    { enabled: !!selectedSaleId }
  );

  const selectedSale = selectedSaleData?.data;
  const totalAmount = parseFloat(selectedSale?.total_amount || 0);
  const totalPaid = parseFloat(selectedSale?.total_paid || 0);
  const balanceDue = totalAmount - totalPaid;

  // Auto-fill amount with balance due if available
  useEffect(() => {
    if (selectedSale && balanceDue > 0 && (!paymentAmount || paymentAmount === 0)) {
      setValue('amount', balanceDue);
    }
  }, [selectedSale, balanceDue, setValue]);

  const mutation = useMutation(paymentService.create, {
    onSuccess: () => {
      toast.success('Payment processed successfully');
      queryClient.invalidateQueries('payments');
      queryClient.invalidateQueries('sales'); // Refresh sales list
      queryClient.invalidateQueries(['sale', selectedSaleId]); // Refresh sale detail
      
      // If we came from sale detail page, go back there, otherwise go to payments list
      if (saleIdParam) {
        navigate(`/sales/${selectedSaleId}`);
      } else {
        navigate('/payments');
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to process payment');
    },
  });

  const onSubmit = (data) => {
    // If sale_id is from URL parameter, use it instead of form data
    const paymentData = saleIdParam 
      ? {
          ...data,
          sale_id: Number(saleIdParam), // Use sale_id from URL
        }
      : data;

    mutation.mutate(paymentData);
  };

  return (
    <div className="form-container">
      <h1>Process Payment</h1>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Only show sale selection if no sale_id in URL */}
        {!saleIdParam && (
          <div className="form-group">
            <label>Sale</label>
            <select 
              {...register('sale_id', { required: 'Sale is required' })}
            >
              <option value="">Select Sale</option>
              {sales?.data?.map((sale) => {
                const saleTotal = parseFloat(sale.total_amount || 0);
                const salePaid = parseFloat(sale.total_paid || 0);
                const saleBalance = saleTotal - salePaid;
                
                return (
                  <option key={sale.id} value={sale.id}>
                    {sale.sale_number} - Ksh {saleTotal.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
                    {saleBalance > 0 ? ` (Balance: Ksh ${saleBalance.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})` : ' (Paid)'}
                  </option>
                );
              })}
            </select>
            {errors.sale_id && <span className="error">{errors.sale_id.message}</span>}
          </div>
        )}

        {/* Show sale info when sale_id is from URL */}
        {saleIdParam && selectedSale && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: '#f0f9ff', 
            borderRadius: '8px',
            border: '1px solid #0ea5e9'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#0c4a6e' }}>Processing Payment For</h3>
              <span style={{ fontSize: '14px', color: '#0369a1', fontWeight: '600' }}>
                {selectedSale.sale_number}
              </span>
            </div>
          </div>
        )}

        {/* Show Sale Summary if sale is selected */}
        {selectedSale && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', color: '#374151' }}>Sale Summary</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Sale #:</span>
                <span style={{ fontWeight: '600' }}>{selectedSale.sale_number}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Customer:</span>
                <span style={{ fontWeight: '600' }}>{selectedSale.customer_name || 'Walk-in Customer'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Amount:</span>
                <span style={{ fontWeight: '600', color: '#059669' }}>
                  Ksh {totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#6b7280' }}>Total Paid:</span>
                <span style={{ fontWeight: '600', color: '#10b981' }}>
                  Ksh {totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                paddingTop: '8px',
                borderTop: '1px solid #e5e7eb',
                gridColumn: '1 / -1',
                fontSize: '16px'
              }}>
                <span style={{ fontWeight: '600', color: balanceDue > 0 ? '#ef4444' : '#10b981' }}>Balance Due:</span>
                <span style={{ fontWeight: '700', color: balanceDue > 0 ? '#ef4444' : '#10b981' }}>
                  Ksh {balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="form-group">
          <label>Payment Method</label>
          <select {...register('payment_method', { required: 'Payment method is required' })}>
            <option value="">Select Method</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="mobile_money">Mobile Money</option>
            <option value="mpesa">M-Pesa</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="credit">Credit</option>
            <option value="other">Other</option>
          </select>
          {errors.payment_method && <span className="error">{errors.payment_method.message}</span>}
        </div>
        
        <Input
          label="Amount"
          type="number"
          step="0.01"
          {...register('amount', { 
            required: 'Amount is required', 
            valueAsNumber: true,
            min: {
              value: 0.01,
              message: 'Amount must be greater than 0'
            },
            validate: (value) => {
              if (selectedSale && balanceDue > 0) {
                const amount = parseFloat(value || 0);
                if (amount > balanceDue) {
                  return `Amount cannot exceed balance due (Ksh ${balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
                }
              }
              return true;
            }
          })}
          error={errors.amount}
          placeholder={balanceDue > 0 ? balanceDue.toString() : '0.00'}
        />
        
        {selectedSale && balanceDue > 0 && (
          <div style={{ 
            marginTop: '-8px', 
            marginBottom: '16px', 
            fontSize: '12px', 
            color: '#6b7280' 
          }}>
            Maximum: Ksh {balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}

        {watch('payment_method') && watch('payment_method') !== 'cash' && (
          <Input
            label="Reference Number"
            {...register('reference_number')}
            placeholder="e.g., Transaction ID, Receipt Number"
            error={errors.reference_number}
          />
        )}

        <div className="form-group">
          <label>Notes</label>
          <textarea {...register('notes')} rows="4" placeholder="Payment notes (optional)" />
        </div>

        {selectedSale && balanceDue > 0 && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: paymentAmount > 0 && paymentAmount <= balanceDue ? '#d1fae5' : '#fee2e2',
            borderRadius: '6px',
            border: `1px solid ${paymentAmount > 0 && paymentAmount <= balanceDue ? '#10b981' : '#ef4444'}`,
            fontSize: '14px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>Payment Amount:</span>
              <span style={{ fontWeight: '600' }}>
                Ksh {parseFloat(paymentAmount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#6b7280' }}>
              <span>Remaining Balance After Payment:</span>
              <span style={{ fontWeight: '600' }}>
                Ksh {Math.max(0, balanceDue - parseFloat(paymentAmount || 0)).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )}

        <div className="form-actions">
          <Button type="submit" loading={mutation.isLoading}>Process Payment</Button>
          <Button 
            type="button" 
            onClick={() => {
              if (saleIdParam) {
                navigate(`/sales/${selectedSaleId}`);
              } else {
                navigate('/payments');
              }
            }} 
            variant="secondary"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PaymentForm;


