import { useState, useEffect, useMemo } from 'react';
import { useQuery } from 'react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { stockService } from '../../services/stockService';
import { shopService } from '../../services/shopService';
import DataTable from '../../components/Common/DataTable';
import Button from '../../components/Common/Button';

const Stock = () => {
  const navigate = useNavigate();
  const { user, currentShop } = useAuth();
  const [selectedShop, setSelectedShop] = useState('');
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
      // Admin/Manager can see all shops
      return allShops;
    } else {
      // Regular users can only see their shop
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

  // Determine if we should fetch all stock or by shop
  const shouldFetchAllStock = !selectedShop && isAdminOrManager;
  const effectiveShopId = selectedShop || (isAdminOrManager ? null : userShopId);

  // Fetch stock - either all (for admin/manager) or by shop
  const { data: stock, isLoading } = useQuery(
    ['stock', effectiveShopId, page, shouldFetchAllStock],
    () => {
      if (shouldFetchAllStock) {
        // Fetch all stock for admin/manager when no shop selected
        return stockService.getAll({ page, limit: 10 });
      } else {
        // Fetch stock by shop
        return stockService.getByShop(effectiveShopId, { page, limit: 10 });
      }
    },
    { 
      enabled: !!effectiveShopId || shouldFetchAllStock,
      keepPreviousData: true
    }
  );

  // Client-side filtering for search
  const filteredStock = useMemo(() => {
    if (!searchTerm || !stock?.data) return stock?.data || [];
    const term = searchTerm.toLowerCase();
    return (stock?.data || []).filter(item => 
      item.product_name?.toLowerCase().includes(term) ||
      item.sku?.toLowerCase().includes(term) ||
      item.shop_name?.toLowerCase().includes(term)
    );
  }, [stock, searchTerm]);

  // Define columns - include shop name when showing all shops
  const allColumns = useMemo(() => {
    const baseColumns = [
      { key: 'product_name', label: 'Product' },
      { key: 'sku', label: 'SKU' },
      { key: 'quantity', label: 'Quantity' },
      { key: 'min_stock_level', label: 'Min Level' },
      { key: 'max_stock_level', label: 'Max Level' },
      { 
        key: 'buy_price', 
        label: 'Buy Price', 
        render: (value, row) => {
          const price = parseFloat(row?.buy_price || value || 0);
          return `Ksh ${price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
      { 
        key: 'sale_price', 
        label: 'Sale Price', 
        render: (value, row) => {
          const price = parseFloat(row?.sale_price || value || 0);
          return `Ksh ${price.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
      },
    ];

    // Add shop name column when showing all shops
    if (shouldFetchAllStock || (!selectedShop && isAdminOrManager)) {
      return [
        { key: 'shop_name', label: 'Shop' },
        ...baseColumns
      ];
    }

    return baseColumns;
  }, [shouldFetchAllStock, selectedShop, isAdminOrManager]);

  // Filter columns for mobile - show only: Product Name, Shop, Quantity
  const columns = useMemo(() => {
    if (isMobile) {
      // Mobile column order: Product Name, Shop, Quantity
      const mobileColumns = [];
      
      // Always add product_name
      const productCol = allColumns.find(c => c.key === 'product_name');
      if (productCol) {
        mobileColumns.push(productCol);
      }
      
      // Add shop_name if available (either in allColumns or if we're viewing all shops)
      const shopCol = allColumns.find(c => c.key === 'shop_name');
      if (shopCol) {
        mobileColumns.push(shopCol);
      } else if (shouldFetchAllStock || (!selectedShop && isAdminOrManager)) {
        // Add shop column even if not in allColumns when viewing all shops
        mobileColumns.push({ key: 'shop_name', label: 'Shop' });
      }
      
      // Always add quantity
      const quantityCol = allColumns.find(c => c.key === 'quantity');
      if (quantityCol) {
        mobileColumns.push(quantityCol);
      }
      
      return mobileColumns;
    }
    return allColumns;
  }, [isMobile, allColumns, shouldFetchAllStock, selectedShop, isAdminOrManager]);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Stock Management</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Button onClick={() => navigate('/stock/add')}>Add Stock</Button>
          <Button onClick={() => navigate('/stock/adjust')}>Adjust Stock</Button>
          <Button onClick={() => navigate('/stock/transactions')}>View Transactions</Button>
        </div>
      </div>
      <div className="form-group" style={{ marginBottom: '20px', maxWidth: '400px' }}>
        <label htmlFor="shop-select" style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>
          {isAdminOrManager ? 'Select Shop' : 'Shop'} 
          {!isAdminOrManager && userShopId && (
            <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal', marginLeft: '8px' }}>
              (Your shop)
            </span>
          )}
        </label>
        {shopsLoading ? (
          <select id="shop-select" disabled className="loading" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option>Loading shops...</option>
          </select>
        ) : shopsList.length === 0 ? (
          <select id="shop-select" disabled className="warning" style={{ width: '100%', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <option>No shops available</option>
          </select>
        ) : !isAdminOrManager ? (
          // Non-admin users see their shop only (disabled)
          <select
            id="shop-select"
            value={selectedShop || userShopId || ''}
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
            id="shop-select"
            value={selectedShop}
            onChange={(e) => {
              setSelectedShop(e.target.value);
              setPage(1); // Reset to first page when shop changes
            }}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              fontSize: '14px',
              backgroundColor: '#fff',
              cursor: 'pointer',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
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
        {!shopsLoading && shopsList.length === 0 && (
          <span style={{ fontSize: '12px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
            No shops found. Please create shops first.
          </span>
        )}
        {isAdminOrManager && !selectedShop && (
          <span style={{ fontSize: '12px', color: '#10b981', marginTop: '4px', display: 'block' }}>
            Showing stock for all shops
          </span>
        )}
      </div>
      {(selectedShop || shouldFetchAllStock || (!isAdminOrManager && userShopId)) && (
        <DataTable
          data={filteredStock}
          columns={columns}
          isLoading={isLoading}
          pagination={searchTerm ? null : stock?.pagination}
          onPageChange={setPage}
          searchable={true}
          searchPlaceholder="Search stock by product name, SKU, or shop..."
          onSearch={setSearchTerm}
          onExport={(data) => {
            const csv = [
              ['Shop', 'Product', 'SKU', 'Quantity', 'Min Level', 'Max Level', 'Buy Price', 'Sale Price'].join(','),
              ...data.map(s => [
                s.shop_name || '',
                s.product_name || '',
                s.sku || '',
                s.quantity || '0',
                s.min_stock_level || '0',
                s.max_stock_level || '0',
                s.buy_price || '0',
                s.sale_price || '0'
              ].join(','))
            ].join('\n');
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `stock-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
          }}
          emptyMessage="No stock found"
          emptyIcon="📦"
        />
      )}
    </div>
  );
};

export default Stock;


