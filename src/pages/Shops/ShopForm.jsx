import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { shopService } from '../../services/shopService';
import toast from 'react-hot-toast';
import Button from '../../components/Common/Button';
import Input from '../../components/Common/Input';

const ShopForm = ({ shopId, onSuccess, onCancel, isModal = false }) => {
  const { id: routeId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const id = shopId || routeId;
  const isEdit = !!id;

  const { data: shop, isLoading } = useQuery(
    ['shop', id],
    () => shopService.getById(id),
    { enabled: isEdit }
  );

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: shop?.data || {},
  });

  React.useEffect(() => {
    if (shop?.data) {
      reset(shop.data);
    }
  }, [shop, reset]);

  const mutation = useMutation(
    (data) => (isEdit ? shopService.update(id, data) : shopService.create(data)),
    {
      onSuccess: () => {
        toast.success(`Shop ${isEdit ? 'updated' : 'created'} successfully`);
        queryClient.invalidateQueries('shops');
        if (isModal && onSuccess) {
          onSuccess();
        } else {
          navigate('/shops');
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
      navigate('/shops');
    }
  };

  if (isEdit && isLoading) {
    return <div className="text-center py-4">Loading...</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="shop-form">
      <div className="form-grid">
        <Input
          label="Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name}
        />
        <Input
          label="Location"
          {...register('location')}
          error={errors.location}
        />
        <Input
          label="Phone"
          {...register('phone')}
          error={errors.phone}
        />
        <Input
          label="Email"
          type="email"
          {...register('email')}
          error={errors.email}
        />
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
          {isEdit ? 'Update Shop' : 'Create Shop'}
        </Button>
        <Button type="button" onClick={handleCancel} variant="secondary">
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ShopForm;


