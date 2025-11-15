import './Button.css';

const Button = ({ children, onClick, type = 'button', variant = 'primary', loading, disabled, small, ...props }) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`btn btn-${variant} ${small ? 'btn-small' : ''}`}
      {...props}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;

