import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm();

  const password = watch('newPassword');

  const onSubmit = async (data) => {
    // Validate passwords match before submitting
    if (data.newPassword !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      // API expects: { currentPassword, newPassword }
      const response = await authService.changePassword(
        data.currentPassword,
        data.newPassword
      );
      
      if (response.success) {
        toast.success('Password changed successfully!');
        reset();
      } else {
        // Handle case where API returns success: false with a message
        toast.error(response.message || 'Failed to change password');
      }
    } catch (error) {
      // Handle axios errors - check multiple possible error response structures
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error?.message ||
        error.message ||
        'An error occurred while changing password';
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-container">
        {/* User Information Section */}
        <div className="profile-section">
          <h2>Account Information</h2>
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Username:</span>
              <span className="info-value">{user?.username || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Full Name:</span>
              <span className="info-value">{user?.full_name || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user?.email || '-'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Role:</span>
              <span className="info-value">{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '-'}</span>
            </div>
            {user?.shop_name && (
              <div className="info-row">
                <span className="info-label">Shop:</span>
                <span className="info-value">{user.shop_name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Password Section */}
        <div className="profile-section">
          <h2>Change Password</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="password-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                {...register('currentPassword', {
                  required: 'Current password is required'
                })}
                placeholder="Enter your current password"
                className={errors.currentPassword ? 'error' : ''}
              />
              {errors.currentPassword && (
                <span className="error-message">{errors.currentPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                {...register('newPassword', {
                  required: 'New password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  }
                })}
                placeholder="Enter your new password"
                className={errors.newPassword ? 'error' : ''}
              />
              {errors.newPassword && (
                <span className="error-message">{errors.newPassword.message}</span>
              )}
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                {...register('confirmPassword', {
                  required: 'Please confirm your new password',
                  validate: (value) =>
                    value === password || 'Passwords do not match'
                })}
                placeholder="Confirm your new password"
                className={errors.confirmPassword ? 'error' : ''}
              />
              {errors.confirmPassword && (
                <span className="error-message">{errors.confirmPassword.message}</span>
              )}
            </div>

            <div className="form-actions">
              <Button
                type="submit"
                variant="primary"
                loading={loading}
              >
                Change Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;

