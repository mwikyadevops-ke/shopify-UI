import { useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { reportService } from '../../services/reportService';
import { alertService } from '../../services/alertService';
import { quotationService } from '../../services/quotationService';
import Button from '../../components/Common/Button';
import SimpleChart from '../../components/Common/SimpleChart';
import './Dashboard.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, currentShop } = useAuth();
  
  const { data: summary, isLoading } = useQuery('dashboard-summary', () =>
    reportService.getDashboardSummary()
  );

  // Get alert count for current user's shop (or all shops if admin/manager)
  const userShopId = user?.shop_id || currentShop?.id || null;
  const isAdminOrManager = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager';
  
  const { data: alertCount, isLoading: alertCountLoading } = useQuery(
    ['alert-count', userShopId],
    () => alertService.getCount(isAdminOrManager ? {} : { shop_id: userShopId }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider stale after 10 seconds
    }
  );

  // Fetch critical alerts for dashboard display
  const { data: criticalAlerts, isLoading: criticalAlertsLoading } = useQuery(
    ['critical-alerts', userShopId],
    () => alertService.getLowStock({ 
      alert_level: 'critical', 
      limit: 5,
      ...(isAdminOrManager ? {} : { shop_id: userShopId })
    }),
    {
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );

  // Get draft quotations count (only for admin/manager)
  const canManageQuotations = isAdminOrManager;
  const { data: draftQuotationsCount, isLoading: draftQuotationsLoading } = useQuery(
    ['draft-quotations-count', userShopId],
    () => quotationService.getDraftCount(isAdminOrManager ? {} : { shop_id: userShopId }),
    {
      enabled: canManageQuotations,
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );

  // Fetch recent draft quotations for dashboard display
  const { data: draftQuotations, isLoading: draftQuotationsLoadingData } = useQuery(
    ['draft-quotations', userShopId],
    () => quotationService.getAll({ 
      status: 'draft',
      limit: 5,
      page: 1,
      ...(isAdminOrManager ? {} : { shop_id: userShopId })
    }),
    {
      enabled: canManageQuotations,
      refetchInterval: 30000,
      staleTime: 10000,
    }
  );

  // Prepare chart data for sales comparison (must be called before any early returns)
  const stats = summary?.data || {};
  const salesChartData = useMemo(() => {
    return [
      { label: "Today's Sales", value: parseFloat(stats.today_sales || 0) },
      { label: 'Monthly Sales', value: parseFloat(stats.month_sales || 0) },
      { label: 'Yearly Sales', value: parseFloat(stats.year_sales || 0) },
    ];
  }, [stats]);

  if (isLoading) {
    return (
      <div className="dashboard" style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '16px', color: '#6b7280' }}>Loading dashboard...</div>
      </div>
    );
  }

  const alertsCount = alertCount?.data?.count || alertCount?.count || 0;
  const criticalAlertsList = criticalAlerts?.data || [];
  const quotationsCount = draftQuotationsCount?.count || 0;
  const draftQuotationsList = draftQuotations?.data || [];

  return (
    <div className="dashboard">
      <h1>Dashboard</h1>
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Today's Sales</h3>
          <p className="stat-value">Ksh {parseFloat(stats.today_sales || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <h3>Monthly Sales</h3>
          <p className="stat-value">Ksh {parseFloat(stats.month_sales || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <h3>Yearly Sales</h3>
          <p className="stat-value">Ksh {parseFloat(stats.year_sales || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="stat-card">
          <h3>Total Products</h3>
          <p className="stat-value">{stats.total_products || 0}</p>
        </div>
        <div 
          className="stat-card stat-card-alert" 
          style={{ 
            cursor: 'pointer',
            border: alertsCount > 0 ? '2px solid #ef4444' : undefined,
            backgroundColor: alertsCount > 0 ? '#fef2f2' : undefined
          }}
          onClick={() => navigate('/alerts')}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3>Low Stock Alerts</h3>
              <p className="stat-value" style={{ color: alertsCount > 0 ? '#dc2626' : undefined }}>
                {alertCountLoading ? '...' : alertsCount}
              </p>
            </div>
            {alertsCount > 0 && (
              <span style={{ 
                fontSize: '20px',
                animation: 'pulse 2s infinite'
              }}>⚠️</span>
            )}
          </div>
        </div>
        <div className="stat-card">
          <h3>Pending Transfers</h3>
          <p className="stat-value">{stats.pending_transfers || 0}</p>
        </div>
        {/* Draft Quotations Card (only for admin/manager) */}
        {canManageQuotations && (
          <div 
            className="stat-card stat-card-quotation" 
            style={{ 
              cursor: 'pointer',
              border: quotationsCount > 0 ? '2px solid #f59e0b' : undefined,
              backgroundColor: quotationsCount > 0 ? '#fffbeb' : undefined
            }}
            onClick={() => navigate('/quotations?status=draft')}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3>Pending Quotations</h3>
                <p className="stat-value" style={{ color: quotationsCount > 0 ? '#d97706' : undefined }}>
                  {draftQuotationsLoading ? '...' : quotationsCount}
                </p>
              </div>
              {quotationsCount > 0 && (
                <span style={{ 
                  fontSize: '20px',
                  animation: 'pulse 2s infinite'
                }}>📄</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Sales Comparison Chart */}
      {(stats.today_sales > 0 || stats.month_sales > 0 || stats.year_sales > 0) && (
        <div style={{ marginTop: '32px', display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          <SimpleChart
            data={salesChartData}
            title="Sales Overview"
            labelKey="label"
            valueKey="value"
          />
        </div>
      )}

      {/* Draft Quotations Section (only for admin/manager) */}
      {canManageQuotations && draftQuotationsList.length > 0 && (
        <div className="draft-quotations-section" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, color: '#d97706', fontSize: '18px' }}>📄 Draft Quotations Pending Send</h2>
            <Button onClick={() => navigate('/quotations?status=draft')} variant="secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
              View All
            </Button>
          </div>
          <div className="alerts-list">
            {draftQuotationsList.slice(0, 5).map((quotation, index) => (
              <div 
                key={quotation.id || index} 
                className="alert-item" 
                style={{ 
                  backgroundColor: '#fffbeb',
                  border: '1px solid #fde68a',
                  cursor: 'pointer'
                }}
                onClick={() => navigate(`/quotations/${quotation.id}`)}
              >
                <div className="alert-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '14px' }}>{quotation.quotation_number}</strong>
                      {quotation.supplier_name && (
                        <span style={{ color: '#6b7280', marginLeft: '8px', fontSize: '13px' }}>• {quotation.supplier_name}</span>
                      )}
                    </div>
                    {quotation.shop_name && (
                      <span style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{quotation.shop_name}</span>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Amount: <strong style={{ color: '#d97706' }}>Ksh {parseFloat(quotation.total_amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                    {quotation.supplier_email ? (
                      <span style={{ color: '#059669', fontSize: '12px' }}>✓ Email available</span>
                    ) : (
                      <span style={{ color: '#dc2626', fontSize: '12px' }}>⚠ No email</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Critical Alerts Section */}
      {criticalAlertsList.length > 0 && (
        <div className="critical-alerts-section" style={{ marginTop: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <h2 style={{ margin: 0, color: '#dc2626', fontSize: '18px' }}>Critical Stock Alerts</h2>
            <Button onClick={() => navigate('/alerts?alert_level=critical')} variant="secondary" style={{ fontSize: '14px', padding: '8px 16px' }}>
              View All
            </Button>
          </div>
          <div className="alerts-list">
            {criticalAlertsList.slice(0, 5).map((alert, index) => (
              <div key={alert.id || index} className="alert-item critical">
                <div className="alert-content">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <strong style={{ fontSize: '14px' }}>{alert.product_name}</strong>
                      {alert.sku && <span style={{ color: '#6b7280', marginLeft: '8px', fontSize: '13px' }}>({alert.sku})</span>}
                    </div>
                    {isAdminOrManager && alert.shop_name && (
                      <span style={{ color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{alert.shop_name}</span>
                    )}
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '13px', color: '#6b7280', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                    <span>Current: <strong style={{ color: '#dc2626' }}>{parseFloat(alert.current_quantity || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                    <span>Min Level: <strong>{parseFloat(alert.min_stock_level || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;


