import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { quotationService } from '../../services/quotationService';
import Button from '../../components/Common/Button';
import toast from 'react-hot-toast';
import './QuotationDetail.css';

const QuotationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery(['quotation', id], () => quotationService.getById(id));

  if (isLoading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading...</div>;

  const quotation = data?.data;
  if (!quotation) return <div style={{ padding: '40px', textAlign: 'center' }}>Quotation not found</div>;

  const getStatusClass = (status) => {
    const statusMap = {
      draft: 'quotation-status-draft',
      sent: 'quotation-status-sent',
      accepted: 'quotation-status-accepted',
      rejected: 'quotation-status-rejected',
      expired: 'quotation-status-expired',
      cancelled: 'quotation-status-cancelled',
    };
    return statusMap[status] || 'quotation-status-draft';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateShort = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-KE');
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Quotation ${quotation.quotation_number}</title>
          <meta charset="utf-8">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 20px;
              color: #333;
              background: white;
              display: flex;
              justify-content: center;
            }
            .quotation-container {
              max-width: 700px;
              width: 100%;
              margin: 0 auto;
            }
            .quotation-header {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              margin-bottom: 25px;
              padding-bottom: 15px;
              border-bottom: 3px solid #333;
            }
            .quotation-header h1 {
              font-size: 24px;
              color: #333;
              margin: 0;
              font-weight: 700;
              letter-spacing: 1px;
            }
            .quotation-header .quotation-info {
              text-align: right;
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
              font-weight: 600;
              text-transform: uppercase;
            }
            .info-box p {
              margin: 6px 0;
              font-size: 12px;
            }
            .info-box .label {
              font-weight: 600;
              display: inline-block;
              width: 120px;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
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
            }
            .items-table td {
              padding: 10px 8px;
              border-bottom: 1px solid #e5e7eb;
              font-size: 12px;
            }
            .items-table tbody tr:nth-child(even) {
              background: #f9fafb;
            }
            .text-right { text-align: right; }
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
            .status-badge {
              display: inline-block;
              padding: 4px 10px;
              border-radius: 4px;
              font-size: 9px;
              font-weight: 600;
              text-transform: uppercase;
            }
            @media print {
              body { padding: 10mm; display: block; }
              .quotation-container { max-width: 100%; }
              @page { margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <div class="quotation-container">
            <div class="quotation-header">
              <div>
                <h1>QUOTATION</h1>
              </div>
              <div class="quotation-info">
                <div style="font-size: 16px; font-weight: 600; margin-bottom: 5px;">#${quotation.quotation_number}</div>
                <div style="color: #666; font-size: 13px;">${formatDate(quotation.quotation_date)}</div>
              </div>
            </div>

            <div class="info-section">
              <div class="info-box">
                <h3>From</h3>
                <p><span class="label">Shop:</span>${quotation.shop_name || 'All Shops'}</p>
                <p><span class="label">Date:</span>${formatDate(quotation.quotation_date)}</p>
              </div>
              <div class="info-box">
                <h3>To</h3>
                <p><span class="label">Supplier:</span>${quotation.supplier_name}</p>
                ${quotation.supplier_phone ? `<p><span class="label">Phone:</span>${quotation.supplier_phone}</p>` : ''}
                ${quotation.supplier_email ? `<p><span class="label">Email:</span>${quotation.supplier_email}</p>` : ''}
                ${quotation.supplier_address ? `<p><span class="label">Address:</span>${quotation.supplier_address}</p>` : ''}
              </div>
            </div>

            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 40px;">#</th>
                  <th>Item</th>
                  <th class="text-right" style="width: 80px;">Qty</th>
                  <th class="text-right" style="width: 100px;">Unit Price</th>
                  <th class="text-right" style="width: 100px;">Discount</th>
                  <th class="text-right" style="width: 120px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${quotation.items?.map((item, index) => `
                  <tr>
                    <td>${index + 1}</td>
                    <td>
                      <strong>${item.item_name}</strong>
                      ${item.item_description ? `<br><small style="color: #666;">${item.item_description}</small>` : ''}
                      ${item.item_sku ? `<br><small style="color: #666;">SKU: ${item.item_sku}</small>` : ''}
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
                  <span>Ksh ${parseFloat(quotation.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ${quotation.tax_amount > 0 ? `
                <div class="totals-row">
                  <span>Tax:</span>
                  <span>Ksh ${parseFloat(quotation.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ` : ''}
                ${quotation.discount_amount > 0 ? `
                <div class="totals-row">
                  <span>Discount:</span>
                  <span>Ksh ${parseFloat(quotation.discount_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                ` : ''}
                <div class="totals-row total">
                  <span>TOTAL:</span>
                  <span>Ksh ${parseFloat(quotation.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>

            ${quotation.valid_until ? `
            <div style="margin-top: 20px; padding: 12px; background: #fef3c7; border-radius: 6px; text-align: center;">
              <strong>Valid Until:</strong> ${formatDateShort(quotation.valid_until)}
            </div>
            ` : ''}

            ${quotation.notes ? `
            <div style="margin-top: 20px; padding: 10px; background: #f9f9f9; border-left: 3px solid #333;">
              <strong>Notes:</strong>
              <p style="margin-top: 5px; font-style: italic;">${quotation.notes}</p>
            </div>
            ` : ''}
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(printContent);
    printWindow.document.close();

    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 250);
    };
  };

  return (
    <div className="page-container">
      <div className="quotation-detail-container">
        {/* Action Buttons at the Top */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #e5e7eb'
        }}>
          <Button onClick={() => navigate('/quotations')} variant="secondary">Back</Button>
          <div style={{ display: 'flex', gap: '8px' }}>
            {quotation.status === 'draft' && (
              <Button onClick={() => navigate(`/quotations/${id}/edit`)} variant="secondary">
                Edit
              </Button>
            )}
            <Button onClick={handlePrint} variant="secondary">Print</Button>
          </div>
        </div>

        {/* Quotation Header */}
        <div style={{ 
          padding: '16px', 
          background: '#f9fafb', 
          borderRadius: '8px',
          border: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', color: '#111827', fontWeight: '700' }}>
                Quotation #{quotation.quotation_number}
              </h1>
              <div style={{ marginTop: '8px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                <span className={`quotation-status-badge ${getStatusClass(quotation.status)}`}>
                  {quotation.status?.charAt(0).toUpperCase() + quotation.status?.slice(1) || 'Draft'}
                </span>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>
                  {formatDate(quotation.quotation_date)}
                </span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Amount</div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#059669' }}>
                Ksh {parseFloat(quotation.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>

        {/* Supplier and Shop Information */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', color: '#374151' }}>Supplier Information</h3>
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{quotation.supplier_name}</span>
            </div>
            {quotation.supplier_phone && (
              <div className="info-row">
                <span className="info-label">Phone:</span>
                <span className="info-value">{quotation.supplier_phone}</span>
              </div>
            )}
            {quotation.supplier_email && (
              <div className="info-row">
                <span className="info-label">Email:</span>
                <span className="info-value">{quotation.supplier_email}</span>
              </div>
            )}
            {quotation.supplier_address && (
              <div className="info-row">
                <span className="info-label">Address:</span>
                <span className="info-value">{quotation.supplier_address}</span>
              </div>
            )}
          </div>

          <div style={{ padding: '16px', background: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '16px', color: '#374151' }}>Quotation Details</h3>
            <div className="info-row">
              <span className="info-label">Shop:</span>
              <span className="info-value">{quotation.shop_name || 'All Shops'}</span>
            </div>
            {quotation.valid_until && (
              <div className="info-row">
                <span className="info-label">Valid Until:</span>
                <span className="info-value">{formatDateShort(quotation.valid_until)}</span>
              </div>
            )}
            <div className="info-row">
              <span className="info-label">Created By:</span>
              <span className="info-value">{quotation.created_by_name || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '12px', fontSize: '16px', color: '#374151' }}>Items ({quotation.items?.length || 0})</h3>
          <table className="quotation-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>#</th>
                <th style={{ textAlign: 'left', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>Item</th>
                <th style={{ textAlign: 'right', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>Quantity</th>
                <th style={{ textAlign: 'right', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>Unit Price</th>
                <th style={{ textAlign: 'right', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>Discount</th>
                <th style={{ textAlign: 'right', padding: '12px', background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {quotation.items?.map((item, index) => (
                <tr key={item.id || index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                  <td style={{ padding: '12px' }}>{index + 1}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: '600' }}>{item.item_name}</div>
                    {item.item_description && (
                      <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>{item.item_description}</div>
                    )}
                    {item.item_sku && (
                      <div style={{ fontSize: '12px', color: '#6b7280' }}>SKU: {item.item_sku}</div>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    {parseFloat(item.quantity || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    Ksh {parseFloat(item.unit_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444' }}>
                    {parseFloat(item.discount || 0) > 0 ? (
                      <>- Ksh {parseFloat(item.discount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</>
                    ) : (
                      <>Ksh 0.00</>
                    )}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: '600' }}>
                    Ksh {parseFloat(item.total_price || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary */}
        <div style={{ 
          marginBottom: '20px', 
          padding: '20px', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '8px',
          color: 'white'
        }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', color: 'white' }}>Financial Summary</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="info-row" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
              <span className="info-label" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Subtotal:</span>
              <span className="info-value" style={{ fontWeight: '600' }}>
                Ksh {parseFloat(quotation.subtotal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {quotation.tax_amount > 0 && (
              <div className="info-row" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <span className="info-label" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Tax:</span>
                <span className="info-value" style={{ fontWeight: '600' }}>
                  Ksh {parseFloat(quotation.tax_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            {quotation.discount_amount > 0 && (
              <div className="info-row" style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
                <span className="info-label" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Discount:</span>
                <span className="info-value" style={{ fontWeight: '600' }}>
                  - Ksh {parseFloat(quotation.discount_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="info-row" style={{ 
              marginTop: '12px', 
              paddingTop: '12px', 
              borderTop: '2px solid rgba(255, 255, 255, 0.2)',
              gridColumn: '1 / -1'
            }}>
              <span className="info-label" style={{ fontSize: '18px', color: 'white' }}>Total:</span>
              <span className="info-value" style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
                Ksh {parseFloat(quotation.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {quotation.notes && (
          <div style={{ 
            marginBottom: '20px', 
            padding: '16px', 
            background: '#fff', 
            borderRadius: '8px',
            border: '1px solid #e5e7eb'
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '8px', fontSize: '16px', color: '#374151' }}>Notes</h3>
            <p style={{ margin: 0, color: '#6b7280', lineHeight: '1.6' }}>{quotation.notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuotationDetail;

