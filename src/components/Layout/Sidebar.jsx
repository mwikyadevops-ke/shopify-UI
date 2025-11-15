import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isMobile = false, isOpen = false, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();

  // Close sidebar when clicking a link on mobile
  const handleLinkClick = () => {
    if (isMobile && onClose) {
      onClose();
    }
  };

  // Check if user is admin or manager
  const isAdminOrManager = () => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'admin' || userRole === 'manager';
  };

  // Check if user is staff
  const isStaff = () => {
    const userRole = user?.role?.toLowerCase();
    return userRole === 'staff';
  };

  // All menu items
  const allMenuItems = [
    { path: '/', label: 'Dashboard', icon: '📊', roles: ['admin', 'manager'] },
    { path: '/shops', label: 'Shops', icon: '🏪', roles: ['admin', 'manager'] },
    { path: '/users', label: 'Users', icon: '👥', roles: ['admin', 'manager'] },
    { path: '/products', label: 'Products', icon: '📦', roles: ['admin', 'manager'] },
    { path: '/categories', label: 'Category', icon: '📦', roles: ['admin', 'manager'] },
    { path: '/stock', label: 'Stock', icon: '📋', roles: ['admin', 'manager', 'staff'] },
    { path: '/stock-transfers', label: 'Transfers', icon: '🔄', roles: ['admin', 'manager'] },
    { path: '/sales', label: 'Sales', icon: '💰', roles: ['admin', 'manager', 'staff'] },
    { path: '/payments', label: 'Payments', icon: '💳', roles: ['admin', 'manager'] },
    { path: '/quotations', label: 'Quotations', icon: '📝', roles: ['admin', 'manager'] },
    { path: '/reports', label: 'Reports', icon: '📈', roles: ['admin', 'manager', 'staff'] },
    { path: '/alerts', label: 'Alerts', icon: '🔔', roles: ['admin', 'manager', 'staff'] },
  ];

  // Filter menu items based on user role
  const getVisibleMenuItems = () => {
    if (!user) return [];

    const userRole = user?.role?.toLowerCase();

    // Admin and Manager see all items
    if (isAdminOrManager()) {
      return allMenuItems;
    }

    // Staff only see Stock, Sales, and Reports
    if (isStaff()) {
      return allMenuItems.filter(item => 
        item.roles.includes('staff')
      );
    }

    // Default: show nothing if role is unknown
    return [];
  };

  const menuItems = getVisibleMenuItems();

  const sidebarClass = `sidebar ${isMobile && !isOpen ? 'mobile-hidden' : isMobile && isOpen ? 'mobile-visible' : ''}`;

  return (
    <aside className={sidebarClass}>
      <div className="sidebar-header">
        <h2>Shopify App</h2>
      </div>
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={handleLinkClick}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;


