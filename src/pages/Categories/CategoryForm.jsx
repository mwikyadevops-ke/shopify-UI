import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "react-query";
import { useEffect } from "react";
import toast from "react-hot-toast";
import Button from "../../components/Common/Button";
import Input from "../../components/Common/Input";
import { categoryService } from "../../services/categoryService";

const CategoryForm = ({ categoryId, onSuccess, onCancel }) => {
    const queryClient = useQueryClient();
    const isEdit = !!categoryId;

    // Fetch category data if editing
    const { data: categoryData, isLoading: categoryLoading } = useQuery(
        ['category', categoryId],
        () => categoryService.getById(categoryId),
        { enabled: isEdit }
    );

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        defaultValues: categoryData?.data || {},
    });

    // Reset form when category data loads
    useEffect(() => {
        if (categoryData?.data) {
            reset(categoryData.data);
        }
    }, [categoryData, reset]);

    const mutation = useMutation(
        (data) => (isEdit ? categoryService.update(categoryId, data) : categoryService.create(data)),
        {
            onSuccess: () => {
                toast.success(`Category ${isEdit ? 'updated' : 'created'} successfully`);
                queryClient.invalidateQueries("categories");
                reset();
                if (onSuccess) onSuccess();
            },
            onError: (error) => {
                const errorMessage = error.response?.data?.message || `Failed to ${isEdit ? 'update' : 'save'} category`;
                toast.error(errorMessage);
                console.error('Category save error:', error);
            },
        }
    );

    const onSubmit = (data) => {
        // Trim whitespace from text fields
        const cleanData = {
            ...data,
            name: data.name?.trim(),
            description: data.description?.trim(),
        };
        mutation.mutate(cleanData);
    };

    if (isEdit && categoryLoading) {
        return <div className="text-center py-4">Loading category...</div>;
    }

    return (
        <form onSubmit={handleSubmit(onSubmit)}>
            <div className="form-grid">
                <div className="form-group form-group-full">
                    <Input
                        label="Category Name"
                        {...register("name", { 
                            required: "Category name is required",
                            minLength: {
                                value: 2,
                                message: "Category name must be at least 2 characters"
                            }
                        })}
                        error={errors.name}
                        placeholder="Enter category name"
                    />
                </div>
                <div className="form-group form-group-full">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        {...register("description")}
                        rows={3}
                        placeholder="Enter category description (optional)"
                        className={errors.description ? 'error' : ''}
                    />
                    {errors.description && (
                        <span className="error-message">{errors.description.message}</span>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="status">Status</label>
                    <select
                        id="status"
                        {...register("status")}
                        className={errors.status ? 'error' : ''}
                    >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                    </select>
                    {errors.status && (
                        <span className="error-message">{errors.status.message}</span>
                    )}
                </div>
            </div>

            <div className="form-actions">
                <Button type="submit" loading={mutation.isLoading}>
                    {isEdit ? 'Update Category' : 'Create Category'}
                </Button>
                {onCancel && (
                    <Button type="button" onClick={onCancel} variant="secondary">
                        Cancel
                    </Button>
                )}
            </div>
        </form>
    );
};

export default CategoryForm;
