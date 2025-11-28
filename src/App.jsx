import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout/Layout';
import ErrorBoundary from './components/Common/ErrorBoundary';
import Login from './pages/Auth/Login';
import ForgotPassword from './pages/Auth/ForgotPassword';
import ResetPassword from './pages/Auth/ResetPassword';
import Dashboard from './pages/Dashboard/Dashboard';
import Shops from './pages/Shops/Shops';
import ShopForm from './pages/Shops/ShopForm';
import Users from './pages/Users/Users';
import UserForm from './pages/Users/UserForm';
import Products from './pages/Products/Products';
import ProductForm from './pages/Products/ProductForm';
import Stock from './pages/Stock/Stock';
import StockAdd from './pages/Stock/StockAdd';
import StockAdjust from './pages/Stock/StockAdjust';
import StockTransactions from './pages/Stock/StockTransactions';
import StockTransfers from './pages/StockTransfers/StockTransfers';
import StockTransferForm from './pages/StockTransfers/StockTransferForm';
import Sales from './pages/Sales/Sales';
import SaleCreate from './pages/Sales/SaleCreate';
import SaleDetail from './pages/Sales/SaleDetail';
import Payments from './pages/Payments/Payments';
import PaymentForm from './pages/Payments/PaymentForm';
import Reports from './pages/Reports/Reports';
import CategoryPage from './pages/Categories/CategoryPage';
import Alerts from './pages/Alerts/Alerts';
import Quotations from './pages/Quotations/Quotations';
import QuotationForm from './pages/Quotations/QuotationForm';
import QuotationDetail from './pages/Quotations/QuotationDetail';
import Profile from './pages/Profile/Profile';

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

// Role-based route protection
function RoleProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  const userRole = user?.role?.toLowerCase();
  const hasAccess = allowedRoles.some(role => role.toLowerCase() === userRole);

  if (!hasAccess) {
    // Redirect staff to stock page if they try to access restricted routes
    if (userRole === 'staff') {
      return <Navigate to="/stock" replace />;
    }
    // Redirect others to dashboard
    return <Navigate to="/" replace />;
  }

  return children;
}

// Dashboard redirect - All authenticated users can see Dashboard (with role-based content)
function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // All authenticated users can see Dashboard
  return <Dashboard />;
}

function App() {
  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
        {/* Dashboard - Admin/Manager only, Staff redirected to Stock */}
        <Route 
          index 
          element={
            <DashboardRedirect />
          } 
        />
        
        {/* Admin/Manager only routes */}
        <Route 
          path="shops" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <Shops />
            </RoleProtectedRoute>
          } 
        />
        {/* Add Shop - Admin only */}
        <Route 
          path="shops/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <ShopForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="shops/:id/edit" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <ShopForm />
            </RoleProtectedRoute>
          } 
        />
        {/* Users - Admin only */}
        <Route 
          path="users" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <Users />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="users/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="users/:id/edit" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <UserForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="products" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <Products />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="products/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <ProductForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="products/:id/edit" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <ProductForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="categories" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <CategoryPage />
            </RoleProtectedRoute>
          } 
        />
        {/* Stock Transfers - Admin only */}
        <Route 
          path="stock-transfers" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <StockTransfers />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="stock-transfers/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin']}>
              <StockTransferForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="payments" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <Payments />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="payments/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <PaymentForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="quotations" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <Quotations />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="quotations/new" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <QuotationForm />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="quotations/:id" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <QuotationDetail />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="quotations/:id/edit" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <QuotationForm />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Stock - All roles (admin, manager, staff) */}
        <Route path="stock" element={<Stock />} />
        <Route path="stock/transactions" element={<StockTransactions />} />
        
        {/* Stock Add/Adjust - Admin/Manager only */}
        <Route 
          path="stock/add" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <StockAdd />
            </RoleProtectedRoute>
          } 
        />
        <Route 
          path="stock/adjust" 
          element={
            <RoleProtectedRoute allowedRoles={['admin', 'manager']}>
              <StockAdjust />
            </RoleProtectedRoute>
          } 
        />
        
        {/* Sales - All roles (admin, manager, staff) */}
        <Route path="sales" element={<Sales />} />
        <Route path="sales/new" element={<SaleCreate />} />
        <Route path="sales/:id" element={<SaleDetail />} />
        
        {/* Reports - All roles (admin, manager, staff) */}
        <Route path="reports" element={<Reports />} />
        
        {/* Alerts - All roles (admin, manager, staff) */}
        <Route path="alerts" element={<Alerts />} />
        
        {/* Profile - All roles (admin, manager, staff) */}
        <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </ErrorBoundary>
  );
}

export default App;


