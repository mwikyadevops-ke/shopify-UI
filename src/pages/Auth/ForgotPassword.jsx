import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import './Login.css';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.forgotPassword(data.email);
      if (response.success) {
        setEmailSent(true);
        toast.success('Password reset link has been sent to your email');
      } else {
        toast.error(response.message || 'Failed to send reset email');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <div className="login-container">
        <div className="login-card">
          <h2>Check Your Email</h2>
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p style={{ marginBottom: '20px', color: '#666' }}>
              We've sent a password reset link to your email address.
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <Link to="/login" style={{ color: '#667eea', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Forgot Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              placeholder="Enter your email"
              className={errors.email ? 'error' : ''}
            />
            {errors.email && <span className="error">{errors.email.message}</span>}
          </div>
          <Button
            type="submit"
            loading={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            Send Reset Link
          </Button>
          <div style={{ textAlign: 'center', marginTop: '20px' }}>
            <Link to="/login" style={{ color: '#667eea', textDecoration: 'none' }}>
              ← Back to Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;

