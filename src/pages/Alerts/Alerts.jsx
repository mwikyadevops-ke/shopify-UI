import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { alertService } from '../../services/alertService';
import { shopService } from '../../services/shopService';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';
import './Alerts.css';

const Alerts = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, currentShop } = useAuth();
  const [selectedShop, setSelectedShop] = useState('');
  const [alertLevel, setAlertLevel] = useState(searchParams.get('alert_level') || '');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');

  // Check if user is admin or manager
  const isAdminOrManager = useMemo(() => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'manager';
  }, [user]);

  // Get user's shop ID
  const userShopId = useMemo(() => {
    return user?.shop_id || currentShop?.id || null;
  }, [user, currentShop]);

  // Fetch all shops (will be filtered based on role)
  const { data: shops, isLoading: shopsLoading } = useQuery(
    'shops', 
    () => shopService.getAll({ limit: 100 }), 
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
      if (userShopId) {
        return allShops.filter(shop => shop.id === userShopId);
      }
      return [];
    }
  }, [shops, isAdminOrManager, userShopId]);

  // Set default shop for non-admin users on mount
  useEffect(() => {
    if (!isAdminOrManager && userShopId && !selectedShop) {
      setSelectedShop(String(userShopId));
    }
  }, [isAdminOrManager, userShopId, selectedShop]);

  // Build query parameters
  const queryParams = useMemo(() => {
    const params = { page, limit: 10 };
    if (selectedShop) {
      params.shop_id = selectedShop;
    }
    if (alertLevel) {
      params.alert_level = alertLevel;
    }
    return params;
  }, [selectedShop, alertLevel, page]);

  // Fetch alerts
  const { data: alerts, isLoading, refetch } = useQuery(
    ['alerts', 'low-stock', queryParams],
    () => alertService.getLowStock(queryParams),
    { 
      enabled: isAdminOrManager || !!selectedShop,
      keepPreviousData: true,
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const alertsList = useMemo(() => {
    if (alerts?.data && Array.isArray(alerts.data)) {
      return alerts.data;
    }
    if (Array.isArray(alerts)) {
      return alerts;
    }
    return [];
  }, [alerts]);

  const pagination = alerts?.pagination || null;

  // Client-side filtering for search
  const filteredAlerts = useMemo(() => {
    if (!searchTerm || !alertsList) return alertsList;
    const term = searchTerm.toLowerCase();
    return alertsList.filter(alert => 
      alert.product_name?.toLowerCase().includes(term) ||
      alert.sku?.toLowerCase().includes(term) ||
      alert.shop_name?.toLowerCase().includes(term) ||
      alert.alert_level?.toLowerCase().includes(term)
    );
  }, [alertsList, searchTerm]);

  // Define columns
  const columns = useMemo(() => {
    const baseColumns = [
      { key: 'product_name', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { 
        key: 'current_quantity', 
        label: 'Current Quantity',
        render: (value, row) => {
          if (!row) return '-';
          return parseFloat(row.current_quantity || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      },
      { 
        key: 'min_stock_level', 
        label: 'Min Level',
        render: (value, row) => {
          if (!row) return '-';
          return parseFloat(row.min_stock_level || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      },
      { 
        key: 'alert_level', 
        label: 'Alert Level',
        render: (value, row) => {
          if (!row) return '-';
          const level = row.alert_level || 'warning';
          const levelColors = {
            critical: { bg: '#fee2e2', text: '#991b1b', label: 'Critical' },
            warning: { bg: '#fef3c7', text: '#92400e', label: 'Warning' },
            info: { bg: '#dbeafe', text: '#1e40af', label: 'Info' }
          };
          const style = levelColors[level] || levelColors.warning;
          return (
            <span style={{
              backgroundColor: style.bg,
              color: style.text,
              padding: '4px 12px',
              borderRadius: '12px',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {style.label}
            </span>
          );
        }
      },
    ];

    // Add shop name column when showing all shops
    if (isAdminOrManager && !selectedShop) {
      return [
        { key: 'shop_name', label: 'Shop' },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [isAdminOrManager, selectedShop]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Low Stock Alerts</h1>
        <Button onClick={() => refetch()} variant="secondary">
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="alerts-filters">
        {isAdminOrManager && (
          <div className="filter-group">
            <label htmlFor="shop-filter">Shop</label>
            {shopsLoading ? (
              <select id="shop-filter" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option>Loading shops...</option>
              </select>
            ) : shopsList.length === 0 ? (
              <select id="shop-filter" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
                <option>No shops available</option>
              </select>
            ) : (
              <select
                id="shop-filter"
                value={selectedShop}
                onChange={(e) => {
                  setSelectedShop(e.target.value);
                  setPage(1);
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
                <option value="">All Shops</option>
                {shopsList.map((shop) => (
                  <option key={shop.id} value={shop.id}>
                    {shop.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="filter-group">
          <label htmlFor="alert-level-filter">Alert Level</label>
          <select
            id="alert-level-filter"
            value={alertLevel}
            onChange={(e) => {
              const newLevel = e.target.value;
              setAlertLevel(newLevel);
              setPage(1);
              // Update URL query parameter
              if (newLevel) {
                setSearchParams({ alert_level: newLevel });
              } else {
                setSearchParams({});
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
            <option value="">All Levels</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Alerts Table */}
      <DataTable
        data={filteredAlerts}
        columns={columns}
        isLoading={isLoading}
        pagination={searchTerm ? null : pagination}
        onPageChange={setPage}
        searchable={true}
        searchPlaceholder="Search alerts by product name, SKU, or shop..."
        onSearch={(value) => {
          setSearchTerm(value);
          setPage(1);
        }}
        onExport={(data) => {
          const csv = [
            ['Shop', 'Product', 'SKU', 'Current Quantity', 'Min Level', 'Alert Level'].join(','),
            ...data.map(a => [
              a.shop_name || '',
              a.product_name || '',
              a.sku || '',
              a.current_quantity || '0',
              a.min_stock_level || '0',
              a.alert_level || ''
            ].join(','))
          ].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `alerts-${new Date().toISOString().split('T')[0]}.csv`;
          a.click();
          window.URL.revokeObjectURL(url);
        }}
        emptyMessage="No low stock alerts found"
        emptyIcon="🔔"
      />
    </div>
  );
};

export default Alerts;

