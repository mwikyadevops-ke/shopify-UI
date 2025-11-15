import React from 'react';
import './Input.css';

const Input = React.forwardRef(({ label, error, ...props }, ref) => {
  return (
    <div className="input-group">
      {label && <label>{label}</label>}
      <input {...props} ref={ref} className={error ? 'error' : ''} />
      {error && <span className="error-message">{error.message}</span>}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;


