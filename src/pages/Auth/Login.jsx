import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import './Login.css';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Trim email and password to remove any whitespace
      const email = data.email?.trim() || '';
      const password = data.password?.trim() || '';
      
      const result = await login(email, password);
      if (result.success) {
        toast.success('Login successful! Welcome back.', {
          duration: 3000,
        });
        navigate('/');
      } else {
        // Show detailed error message
        toast.error(result.message || 'Login failed. Please check your credentials.', {
          duration: 6000,
        });
      }
    } catch (error) {
      // Fallback error handling
      const errorMessage = error?.message || 'An unexpected error occurred. Please try again.';
      toast.error(errorMessage, {
        duration: 6000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please enter a valid email address'
                },
                setValueAs: (value) => value?.trim()
              })}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password', { 
                required: 'Password is required',
                minLength: {
                  value: 6,
                  message: 'Password must be at least 6 characters'
                },
                setValueAs: (value) => value?.trim()
              })}
              placeholder="Enter your password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>
          <div style={{ textAlign: 'right', marginBottom: '15px' }}>
            <Link
              to="/forgot-password"
              style={{
                color: '#667eea',
                textDecoration: 'none',
                fontSize: '14px'
              }}
            >
              Forgot Password?
            </Link>
          </div>
          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;


