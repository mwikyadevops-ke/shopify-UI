import Modal from './Modal';
import Button from './Button';
import './ConfirmModal.css';

const ConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'primary',
  isLoading = false,
  icon = '⚠️'
}) => {
  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal
      title={title}
      onClose={onClose}
      size="small"
    >
      <div className="confirm-modal-content">
        <div className="confirm-modal-icon">
          {icon}
        </div>
        <div className="confirm-modal-message">
          {message.split('\n').map((line, index) => (
            <div key={index} style={{ marginBottom: index < message.split('\n').length - 1 ? '8px' : '0' }}>
              {line}
            </div>
          ))}
        </div>
        <div className="confirm-modal-actions">
          <Button
            onClick={onClose}
            variant="secondary"
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            onClick={handleConfirm}
            variant={variant}
            loading={isLoading}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmModal;

