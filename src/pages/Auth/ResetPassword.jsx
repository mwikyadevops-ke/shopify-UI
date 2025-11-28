import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import './Login.css';

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const { register, handleSubmit, formState: { errors }, watch } = useForm();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      toast.error('Invalid reset link');
      navigate('/login');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, navigate]);

  const password = watch('password');

  const onSubmit = async (data) => {
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    // Validate passwords match before submitting
    if (data.password !== data.passwordConfirmation) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // API expects: { token, newPassword }
      const response = await authService.resetPassword(
        token,
        data.password
      );
      if (response.success) {
        toast.success('Password reset successfully!');
        navigate('/login');
      } else {
        toast.error(response.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Reset Password</h2>
        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          Enter your new password below.
        </p>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="form-group">
            <label>New Password</label>
            <input
              type="password"
              {...register('password', {
                required: 'Password is required',
                minLength: {
                  value: 8,
                  message: 'Password must be at least 8 characters'
                }
              })}
              placeholder="Enter new password"
              className={errors.password ? 'error' : ''}
            />
            {errors.password && <span className="error">{errors.password.message}</span>}
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              {...register('passwordConfirmation', {
                required: 'Please confirm your password',
                validate: (value) =>
                  value === password || 'Passwords do not match'
              })}
              placeholder="Confirm new password"
              className={errors.passwordConfirmation ? 'error' : ''}
            />
            {errors.passwordConfirmation && (
              <span className="error">{errors.passwordConfirmation.message}</span>
            )}
          </div>
          <Button
            type="submit"
            loading={loading}
            style={{ width: '100%', marginTop: '10px' }}
          >
            Reset Password
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

export default ResetPassword;

