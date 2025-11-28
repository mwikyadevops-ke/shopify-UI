import { useState } from 'react';
import { useQuery } from 'react-query';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { alertService } from '../../services/alertService';
import { quotationService } from '../../services/quotationService';
import './Header.css';

const Header = ({ onMenuToggle, isMobile = false }) => {
  const { user, currentShop, logout, switchShop, getAvailableShops } = useAuth();
  const navigate = useNavigate();
  const [showShopSelector, setShowShopSelector] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const availableShops = getAvailableShops();
  const hasMultipleShops = availableShops.length > 1;

  // Get alert count for notification badge
  const userShopId = user?.shop_id || currentShop?.id || null;
  const isAdminOrManager = user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'manager';
  const canManageQuotations = isAdminOrManager; // Only admin/manager can see quotations
  
  const { data: alertCount } = useQuery(
    ['alert-count-header', userShopId],
    () => alertService.getCount(isAdminOrManager ? {} : { shop_id: userShopId }),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider stale after 10 seconds
    }
  );

  // Get draft quotations count (only for admin/manager)
  const { data: draftQuotationsCount } = useQuery(
    ['draft-quotations-count', userShopId],
    () => quotationService.getDraftCount(isAdminOrManager ? {} : { shop_id: userShopId }),
    {
      enabled: canManageQuotations,
      refetchInterval: 30000, // Refetch every 30 seconds
      staleTime: 10000, // Consider stale after 10 seconds
    }
  );

  const alertsCount = alertCount?.data?.count || alertCount?.count || 0;
  const quotationsCount = draftQuotationsCount?.count || 0;

  const handleShopChange = (shop) => {
    switchShop(shop);
    setShowShopSelector(false);
    // Optionally refresh the page or update data
    window.location.reload();
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          {isMobile && (
            <button 
              className="mobile-menu-btn"
              onClick={onMenuToggle}
              aria-label="Toggle menu"
            >
              ☰
            </button>
          )}
          <h1>Shopify Management System</h1>
        </div>
        <div className="header-right">
          {/* Alerts Notification Badge */}
          <button
            className="alerts-badge-btn"
            onClick={() => navigate('/alerts')}
            style={{
              position: 'relative',
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
            }}
          >
            <span>🔔 Alerts</span>
            {alertsCount > 0 && (
              <span
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  minWidth: '20px',
                  textAlign: 'center',
                }}
              >
                {alertsCount > 99 ? '99+' : alertsCount}
              </span>
            )}
          </button>

          {/* Quotations Notification Badge (only for admin/manager) */}
          {canManageQuotations && (
            <button
              className="quotations-badge-btn"
              onClick={() => navigate('/quotations?status=draft')}
              style={{
                position: 'relative',
                padding: '8px 16px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
              }}
            >
              <span>📄 Quotations</span>
              {quotationsCount > 0 && (
                <span
                  style={{
                    backgroundColor: '#f59e0b',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '2px 8px',
                    fontSize: '12px',
                    fontWeight: '600',
                    minWidth: '20px',
                    textAlign: 'center',
                  }}
                >
                  {quotationsCount > 99 ? '99+' : quotationsCount}
                </span>
              )}
            </button>
          )}

          {hasMultipleShops && (
            <div className="shop-selector-container">
              <button
                className="shop-selector-btn"
                onClick={() => setShowShopSelector(!showShopSelector)}
              >
                <span>🏪 {currentShop?.name || 'Select Shop'}</span>
                <span className="dropdown-arrow">▼</span>
              </button>
              {showShopSelector && (
                <>
                  <div
                    className="shop-selector-overlay"
                    onClick={() => setShowShopSelector(false)}
                  />
                  <div className="shop-selector-dropdown">
                    {availableShops.map((shop) => (
                      <button
                        key={shop.id}
                        className={`shop-option ${
                          currentShop?.id === shop.id ? 'active' : ''
                        }`}
                        onClick={() => handleShopChange(shop)}
                      >
                        {shop.name}
                        {currentShop?.id === shop.id && ' ✓'}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          <div className="user-info">
            <button
              onClick={() => navigate('/profile')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '4px 8px',
                borderRadius: '4px',
                transition: 'background-color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
              title="View Profile"
            >
              <span>👤</span>
              <span>{user?.full_name || user?.username || 'User'}</span>
              <span className="user-role">({user?.role})</span>
            </button>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;


