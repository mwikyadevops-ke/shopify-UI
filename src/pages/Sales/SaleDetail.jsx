import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { saleService } from '../../services/saleService';
import { shopService } from '../../services/shopService';
import Button from '../../components/Common/Button';
import toast from 'react-hot-toast';
import './SaleDetail.css';

const SaleDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery(['sale', id], () => saleService.getById(id));
  
  const sale = data?.data;
  
  // Fetch shop details if shop_id is available
  const { data: shopData } = useQuery(
    ['shop', sale?.shop_id],
    () => shopService.getById(sale?.shop_id),
    { enabled: !!sale?.shop_id }
  );

  const shop = shopData?.data;

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  if (!sale) return <div style={{ padding: '40px', textAlign: 'center' }}>Sale not found</div>;

  // Use backend fields directly - backend now always provides these
  const totalAmount = parseFloat(sale?.total_amount || 0);
  const totalPaid = parseFloat(sale?.total_paid || 0);
  const paymentStatus = sale?.payment_status?.toLowerCase() || 'unpaid';
  
  // Calculate balance
  const balanceDue = totalAmount - totalPaid;
  
  // Determine payment status from backend payment_status field
  const epsilon = 0.01;
  const isPaid = paymentStatus === 'paid' || paymentStatus === 'fully_paid' || balanceDue <= epsilon;
  const isPartiallyPaid = (paymentStatus === 'partial' || paymentStatus === 'partially_paid') && totalPaid > epsilon && balanceDue > epsilon;

  // Get status badge class
  const getStatusClass = (status) => {
    const statusMap = {
      completed: 'sale-status-completed',
      pending: 'sale-status-pending',
      cancelled: 'sale-status-cancelled',
      refunded: 'sale-status-refunded',
    };
    return statusMap[status] || 'sale-status-pending';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateShort = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    // Create a print-optimized version
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Sale ${sale.sale_number} - Invoice</title>
          <meta charset="utf-8">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
              font-size: 12px;
              color: #333;
              padding: 20px;
              background: white;
              display: flex;
              justify-content: center;
            }
            .invoice-container {
              max-width: 700px;
              width: 100%;
              margin: 0 auto;
            }
            .invoice-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 3px solid #333;
            }
            .invoice-header h1 {
              font-size: 24px;
              color: #333;
              margin: 0;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .invoice-header .sale-info {
              text-align: right;
            }
            .invoice-header .sale-number {
              font-size: 16px;
              font-weight: 600;
              margin-bottom: 5px;
              color: #555;
            }
            .invoice-header .sale-date {
              color: #666;
              font-size: 13px;
            }
            .info-section {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 25px;
              margin-bottom: 25px;
            }
            .info-box h3 {
              font-size: 13px;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #ddd;
              color: #333;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .info-box p {
              margin: 6px 0;
              font-size: 12px;
              line-height: 1.6;
            }
            .info-box .label {
              font-weight: 600;
              display: inline-block;
              width: 90px;
              color: #555;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
              page-break-inside: avoid;
            }
            .items-table thead {
              background: #333;
              color: white;
            }
            .items-table th {
              padding: 10px 8px;
              text-align: left;
              font-size: 10px;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .items-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .items-table tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            .items-table tbody tr:hover {
              background: #f3f4f6;
            }
            .text-right {
              text-align: right;
            }
            .text-center {
              text-align: center;
            }
            .totals-section {
              display: flex;
              justify-content: flex-end;
              margin-bottom: 25px;
            }
            .totals-box {
              width: 280px;
              border: 2px solid #333;
              padding: 15px;
              background: #fafafa;
            }
            .totals-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              font-size: 12px;
              padding: 4px 0;
            }
            .totals-row.total {
              font-size: 16px;
              font-weight: 700;
              margin-top: 12px;
              padding-top: 12px;
              border-top: 2px solid #333;
            }
            .payments-section {
              margin-top: 25px;
              page-break-inside: avoid;
            }
            .payments-section h3 {
              font-size: 13px;
              margin-bottom: 10px;
              padding-bottom: 5px;
              border-bottom: 2px solid #ddd;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .payments-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .payments-table th {
              background: #f3f4f6;
              padding: 8px;
              text-align: left;
              font-size: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              border-bottom: 2px solid #333;
            }
            .payments-table td {
              padding: 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .payments-total {
              font-weight: 700;
              background: #f3f4f6;
            }
            .balance-section {
              margin-top: 25px;
              padding: 20px;
              border: 2px solid ${isPaid ? '#10b981' : isPartiallyPaid ? '#f59e0b' : '#ef4444'};
              text-align: center;
              page-break-inside: avoid;
              background: ${isPaid ? '#f0fdf4' : isPartiallyPaid ? '#fffbeb' : '#fef2f2'};
              border-radius: 6px;
            }
            .balance-label {
              font-size: 13px;
              margin-bottom: 10px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .balance-value {
              font-size: 22px;
              font-weight: 700;
              color: ${isPaid ? '#10b981' : isPartiallyPaid ? '#f59e0b' : '#ef4444'};
            }
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .status-${sale.status} {
              background: ${sale.status === 'completed' ? '#d1fae5' : sale.status === 'pending' ? '#fef3c7' : sale.status === 'cancelled' ? '#fee2e2' : '#e5e7eb'};
              color: ${sale.status === 'completed' ? '#065f46' : sale.status === 'pending' ? '#92400e' : sale.status === 'cancelled' ? '#991b1b' : '#374151'};
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              font-size: 10px;
              color: #6b7280;
            }
            @media print {
              body {
                padding: 10mm;
                display: block;
              }
              .invoice-container {
                max-width: 100%;
              }
              @page {
                margin: 10mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="invoice-container">
          <div class="invoice-header">
            <div>
              <h1>INVOICE</h1>
              <p style="margin-top: 5px; color: #666;">Thank you for your business!</p>
            </div>
            <div class="sale-info">
              <div class="sale-number">Sale #${sale.sale_number}</div>
              <div class="sale-date">${formatDate(sale.sale_date)}</div>
              <div style="margin-top: 5px;">
                <span class="status-badge status-${sale.status}">${sale.status}</span>
              </div>
            </div>
          </div>

          <div class="info-section">
            <div class="info-box">
              <h3>Bill From</h3>
              <p><span class="label">Shop:</span>${sale.shop_name}</p>
              <p><span class="label">Date:</span>${formatDate(sale.sale_date)}</p>
            </div>
            <div class="info-box">
              <h3>Bill To</h3>
              <p><span class="label">Name:</span>${sale.customer_name || 'Walk-in Customer'}</p>
              ${sale.customer_phone ? `<p><span class="label">Phone:</span>${sale.customer_phone}</p>` : ''}
              ${sale.customer_email ? `<p><span class="label">Email:</span>${sale.customer_email}</p>` : ''}
            </div>
          </div>

          <table class="items-table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Product</th>
                <th class="text-right" style="width: 80px;">Qty</th>
                <th class="text-right" style="width: 100px;">Unit Price</th>
                <th class="text-right" style="width: 100px;">Discount</th>
                <th class="text-right" style="width: 120px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${sale.items?.map((item, index) => `
                <tr>
                  <td class="text-center">${index + 1}</td>
                  <td>
                    <strong>${item.product_name}</strong>
                    ${item.product_sku ? `<br><small style="color: #666;">SKU: ${item.product_sku}</small>` : ''}
                  </td>
                  <td class="text-right">${parseFloat(item.quantity || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right">Ksh ${parseFloat(item.unit_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td class="text-right">${parseFloat(item.discount || 0) > 0 ? `Ksh ${parseFloat(item.discount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'Ksh 0.00'}</td>
                  <td class="text-right"><strong>Ksh ${parseFloat(item.total_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="totals-section">
            <div class="totals-box">
              <div class="totals-row">
                <span>Subtotal:</span>
                <span>Ksh ${parseFloat(sale.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ${sale.tax_amount > 0 ? `
              <div class="totals-row">
                <span>Tax:</span>
                <span>Ksh ${parseFloat(sale.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              ${sale.discount_amount > 0 ? `
              <div class="totals-row">
                <span>Discount:</span>
                <span>Ksh ${parseFloat(sale.discount_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              ` : ''}
              <div class="totals-row total">
                <span>TOTAL:</span>
                <span>Ksh ${parseFloat(sale.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            </div>
          </div>

          ${sale.payments && sale.payments.length > 0 ? `
          <div class="payments-section">
            <h3 style="margin-bottom: 10px; font-size: 14px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">Payments</h3>
            <table class="payments-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Method</th>
                  <th class="text-right">Amount</th>
                  <th>Date</th>
                  <th class="text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                ${sale.payments.map((payment, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td style="text-transform: capitalize;">${payment.payment_method}</td>
                    <td class="text-right">Ksh ${parseFloat(payment.amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td>${formatDateShort(payment.payment_date)} ${formatTime(payment.payment_date)}</td>
                    <td class="text-center">
                      <span class="status-badge status-${payment.status}">${payment.status}</span>
                    </td>
                  </tr>
                `).join('')}
                <tr class="payments-total">
                  <td colspan="2"><strong>Total Paid:</strong></td>
                  <td class="text-right"><strong>Ksh ${parseFloat(totalPaid).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></td>
                  <td colspan="2"></td>
                </tr>
              </tbody>
            </table>
          </div>
          ` : ''}

          <div class="balance-section">
            <div class="balance-label">
              ${isPaid ? '✓ FULLY PAID' : isPartiallyPaid ? '⚠ PARTIALLY PAID' : 'BALANCE DUE'}
            </div>
            <div class="balance-value">
              Ksh ${Math.abs(balanceDue).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            ${isPartiallyPaid ? `
            <div style="margin-top: 10px; font-size: 11px;">
              Total: Ksh ${totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
              Paid: Ksh ${totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
              Due: Ksh ${balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            ` : ''}
          </div>

          ${sale.notes ? `
          <div style="margin-top: 30px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333;">
            <strong>Notes:</strong>
            <p style="margin-top: 5px; font-style: italic;">${sale.notes}</p>
          </div>
          ` : ''}

          <div class="footer">
            <p>This is a computer-generated invoice. No signature required.</p>
            <p style="margin-top: 5px;">Generated on ${new Date().toLocaleString('en-KE')}</p>
          </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();

    // Wait for content to load then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        // Optionally close after printing
        // printWindow.close();
      }, 250);
    };
  };

  const handleExport = () => {
    // Simple export to CSV
    const rows = [
      ['Sale Number', sale.sale_number],
      ['Date', formatDate(sale.sale_date)],
      ['Shop', sale.shop_name],
      ['Customer', sale.customer_name || 'Walk-in Customer'],
      ['Customer Phone', sale.customer_phone || 'N/A'],
      ['Customer Email', sale.customer_email || 'N/A'],
      ['Status', sale.status],
      [''],
      ['Items'],
      ['Product', 'Quantity', 'Unit Price', 'Discount', 'Total'],
      ...(sale.items || []).map(item => [
        item.product_name,
        item.quantity,
        item.unit_price,
        item.discount || 0,
        item.total_price,
      ]),
      [''],
      ['Subtotal', sale.subtotal],
      ['Tax', sale.tax_amount || 0],
      ['Discount', sale.discount_amount || 0],
      ['Total', sale.total_amount],
      [''],
      ['Payments'],
      ['Method', 'Amount', 'Date', 'Status'],
      ...(sale.payments || []).map(payment => [
        payment.payment_method,
        payment.amount,
        formatDate(payment.payment_date),
        payment.status,
      ]),
      [''],
      ['Total Paid', totalPaid],
      ['Balance Due', balanceDue],
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sale-${sale.sale_number}-${formatDateShort(sale.sale_date)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-container">
      <div className="sale-detail-container">
        {/* Action Buttons at the Top */}
        <div className="sale-detail-actions" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb',
          gap: '12px',
          flexWrap: 'wrap'
        }}>
          <Button onClick={() => navigate('/sales')} variant="secondary">Back</Button>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: '1', justifyContent: 'flex-end' }}>
            {balanceDue > 0 && (
              <Button 
                onClick={() => navigate(`/payments/new?sale_id=${sale.id}`)}
                variant="primary"
              >
                Process Payment
              </Button>
            )}
            <Button onClick={handlePrint} variant="secondary">Print</Button>
            <Button onClick={handleExport} variant="secondary">Export</Button>
          </div>
        </div>

        {/* Shop Details and Invoice Number Header */}
        <div className="sale-detail-header">
          <div style={{ 
            padding: '16px', 
            background: '#f9fafb', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <h2 style={{ margin: 0, marginBottom: '8px', fontSize: '20px', color: '#111827', fontWeight: '700' }}>
                  {shop?.name || sale.shop_name || 'Shop Name'}
                </h2>
                {shop?.location && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    📍 {shop.location}
                  </div>
                )}
                {shop?.phone && (
                  <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                    📞 {shop.phone}
                  </div>
                )}
                {shop?.email && (
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    ✉️ {shop.email}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px', fontWeight: '500' }}>
                  Invoice Number
                </div>
                <h1 style={{ margin: 0, fontSize: '28px', color: '#111827', fontWeight: '700', fontFamily: 'monospace', letterSpacing: '1px' }}>
                  {sale.sale_number}
                </h1>
                <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
                  <span className={`sale-status-badge ${getStatusClass(sale.status)}`}>
                    {sale.status}
                  </span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>
                    {formatDate(sale.sale_date)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="sale-info-grid">
          <div className="sale-info-card">
            <h3>Customer Information</h3>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{sale.customer_name || 'Walk-in Customer'}</span>
            </div>
            {sale.customer_phone && (
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{sale.customer_phone}</span>
              </div>
            )}
            {sale.customer_email && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{sale.customer_email}</span>
              </div>
            )}
            {!sale.customer_name && !sale.customer_phone && !sale.customer_email && (
              <div className="info-row">
                <span className="info-value" style={{ color: '#9ca3af', fontStyle: 'italic' }}>
                  No customer information
                </span>
              </div>
            )}
          </div>

          <div className="sale-info-card totals-card">
            <h3>Financial Summary</h3>
            <div className="info-row">
              <span className="info-label">Subtotal:</span>
              <span className="info-value">
                Ksh {parseFloat(sale.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {sale.tax_amount > 0 && (
              <div className="info-row">
                <span className="info-label">Tax:</span>
                <span className="info-value">
                  Ksh {parseFloat(sale.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {sale.discount_amount > 0 && (
              <div className="info-row">
                <span className="info-label">Discount:</span>
                <span className="info-value" style={{ color: '#fbbf24' }}>
                  - Ksh {parseFloat(sale.discount_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="info-row" style={{ marginTop: '12px', paddingTop: '12px', borderTop: '2px solid rgba(255, 255, 255, 0.2)' }}>
              <span className="info-label" style={{ fontSize: '18px' }}>Total:</span>
              <span className="info-value" style={{ fontSize: '24px', fontWeight: '700' }}>
                Ksh {parseFloat(sale.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        <div className="items-table-container">
          <h3>Items ({sale.items?.length || 0})</h3>
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="sale-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Product</th>
                <th className="text-right">Quantity</th>
                <th className="text-right">Unit Price</th>
                <th className="text-right">Discount</th>
                <th className="text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.items?.map((item, index) => (
                <tr key={item.id}>
                  <td>{index + 1}</td>
                  <td>
                    <div style={{ fontWeight: '500' }}>{item.product_name}</div>
                    {item.product_sku && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>SKU: {item.product_sku}</div>
                    )}
                  </td>
                  <td className="text-right">{parseFloat(item.quantity || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right">Ksh {parseFloat(item.unit_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                  <td className="text-right">
                    {parseFloat(item.discount || 0) > 0 ? (
                      <span style={{ color: '#ef4444' }}>
                        - Ksh {parseFloat(item.discount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Ksh 0.00</span>
                    )}
                  </td>
                  <td className="text-right" style={{ fontWeight: '600' }}>
                    Ksh {parseFloat(item.total_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>

        {sale.payments && sale.payments.length > 0 && (
          <div className="payments-table-container">
            <h3>Payments ({sale.payments.length})</h3>
            <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
              <table className="sale-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Method</th>
                  <th className="text-right">Amount</th>
                  <th>Date</th>
                  <th className="text-center">Status</th>
                  {sale.payments.some(p => p.reference_number) && <th>Reference</th>}
                </tr>
              </thead>
              <tbody>
                {sale.payments.map((payment, index) => (
                  <tr key={payment.id}>
                    <td>{index + 1}</td>
                    <td style={{ textTransform: 'capitalize' }}>{payment.payment_method}</td>
                    <td className="text-right" style={{ fontWeight: '600' }}>
                      Ksh {parseFloat(payment.amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div>{formatDateShort(payment.payment_date)}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>{formatTime(payment.payment_date)}</div>
                    </td>
                    <td className="text-center">
                      <span className={`sale-status-badge ${payment.status === 'completed' ? 'sale-status-completed' : payment.status === 'pending' ? 'sale-status-pending' : 'sale-status-cancelled'}`}>
                        {payment.status}
                      </span>
                    </td>
                    {sale.payments.some(p => p.reference_number) && (
                      <td style={{ fontFamily: 'monospace', fontSize: '12px', color: '#6b7280' }}>
                        {payment.reference_number || 'N/A'}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr style={{ background: '#f9fafb', fontWeight: '600' }}>
                  <td colSpan={sale.payments.some(p => p.reference_number) ? 5 : 4} style={{ textAlign: 'right', padding: '12px' }}>
                    Total Paid:
                  </td>
                  <td className="text-right" style={{ padding: '12px' }}>
                    Ksh {parseFloat(totalPaid).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
            </div>
          </div>
        )}

        <div className={`balance-section ${isPaid ? 'paid' : isPartiallyPaid ? '' : 'unpaid'}`}>
          <div className="balance-row">
            <span className="balance-label">
              {isPaid ? '✓ Fully Paid' : isPartiallyPaid ? '⚠ Partially Paid' : 'Balance Due'}
            </span>
            <span className="balance-value" style={{ color: isPaid ? '#10b981' : isPartiallyPaid ? '#f59e0b' : '#ef4444' }}>
              Ksh {Math.abs(balanceDue).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {isPartiallyPaid && (
            <div style={{ marginTop: '8px', fontSize: '14px', color: '#92400e' }}>
              Total: Ksh {totalAmount.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
              Paid: Ksh {totalPaid.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} | 
              Due: Ksh {balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          )}
          {balanceDue > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button 
                onClick={() => navigate(`/payments/new?sale_id=${sale.id}`)}
                variant="primary"
                size="medium"
              >
                Process Payment (Ksh {balanceDue.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaleDetail;


