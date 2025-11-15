import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { userService } from '../../services/userService';
import { shopService } from '../../services/shopService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const UserForm = ({ userId, onSuccess, onCancel, isModal = false }) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = userId || routeId;
  const isEdit = !!id;

  const { data: user } = useQuery(
    ['user', id],
    () => userService.getById(id),
    { enabled: isEdit }
  );

  const { data: shops } = useQuery('shops', () => shopService.getAll());

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: user?.data || {},
  });

  React.useEffect(() => {
    if (user?.data) {
      reset(user.data);
    }
  }, [user, reset]);

  const mutation = useMutation(
    (data) => (isEdit ? userService.update(id, data) : userService.create(data)),
    {
      onSuccess: () => {
        toast.success(`User ${isEdit ? 'updated' : 'created'} successfully`);
        queryClient.invalidateQueries('users');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/users');
        }
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Operation failed');
      },
    }
  );

  const onSubmit = (data) => {
    mutation.mutate(data);
  };

  const handleCancel = () => {
    if (isModal && onCancel) {
      onCancel();
    } else {
      navigate('/users');
    }
  };

  return (
    <div className={isModal ? 'form-container-modal' : ''}>
      <form onSubmit={handleSubmit(onSubmit)} className="user-form">
        <div className="form-grid">
          <Input
            label="Username"
            {...register('username', { required: 'Username is required' })}
            error={errors.username}
          />
          <Input
            label="Email"
            type="email"
            {...register('email', { required: 'Email is required' })}
            error={errors.email}
          />
          {!isEdit && (
            <Input
              label="Password"
              type="password"
              {...register('password', { required: !isEdit && 'Password is required' })}
              error={errors.password}
            />
          )}
          <Input
            label="Full Name"
            {...register('full_name')}
            error={errors.full_name}
          />
          <Input
            label="Phone"
            {...register('phone')}
            error={errors.phone}
          />
          <div className="form-group">
            <label htmlFor="role">
              Role <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="role"
              {...register('role', { 
                required: 'Role is required. Please select a role for the user.' 
              })}
              className={errors.role ? 'error' : ''}
            >
              <option value="">Select Role</option>
              <option value="staff">Staff</option>
              <option value="cashier">Cashier</option>
              <option value="manager">Manager</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <span className="error-message">{errors.role.message}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="shop_id">
              Shop <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <select
              id="shop_id"
              {...register('shop_id', { 
                required: 'Shop is required. Please select a shop for the user.' 
              })}
              className={errors.shop_id ? 'error' : ''}
            >
              <option value="">Select Shop</option>
              {shops?.data?.map((shop) => (
                <option key={shop.id} value={shop.id}>
                  {shop.name}
                </option>
              ))}
            </select>
            {errors.shop_id && (
              <span className="error-message">{errors.shop_id.message}</span>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              {...register('status')}
              className={errors.status ? 'error' : ''}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
            {errors.status && (
              <span className="error-message">{errors.status.message}</span>
            )}
          </div>
        </div>
        <div className="form-actions">
          <Button type="submit" loading={mutation.isLoading}>
            {isEdit ? 'Update User' : 'Create User'}
          </Button>
          <Button type="button" onClick={handleCancel} variant="secondary">
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
};

export default UserForm;


