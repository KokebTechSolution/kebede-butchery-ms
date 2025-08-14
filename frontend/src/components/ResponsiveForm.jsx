import React from 'react';
import { Save, X, Plus, Edit } from 'lucide-react';

const ResponsiveForm = ({
  title,
  children,
  onSubmit,
  onCancel,
  submitText = "Save",
  cancelText = "Cancel",
  loading = false,
  className = "",
  showActions = true,
  maxWidth = "max-w-2xl"
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit && onSubmit(e);
  };

  return (
    <div className={`${maxWidth} mx-auto ${className}`}>
      <div className="mobile-card">
        {/* Form Header */}
        {title && (
          <div className="mb-6">
            <h2 className="text-responsive-lg font-semibold text-gray-900">{title}</h2>
          </div>
        )}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {children}
          </div>

          {/* Form Actions */}
          {showActions && (
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={loading}
                className="mobile-button flex-1 sm:flex-none flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Save size={16} />
                )}
                <span>{submitText}</span>
              </button>
              
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="mobile-button-secondary flex-1 sm:flex-none flex items-center justify-center space-x-2"
                >
                  <X size={16} />
                  <span>{cancelText}</span>
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

// Form Field Components
const FormField = ({ 
  label, 
  children, 
  error, 
  required = false,
  className = "" 
}) => {
  return (
    <div className={`form-group ${className}`}>
      {label && (
        <label className="form-label">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};

const FormInput = ({ 
  type = "text",
  placeholder,
  value,
  onChange,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`form-input ${className}`}
      {...props}
    />
  );
};

const FormSelect = ({ 
  options = [],
  value,
  onChange,
  placeholder = "Select an option",
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      className={`form-select ${className}`}
      {...props}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
};

const FormTextarea = ({ 
  placeholder,
  value,
  onChange,
  rows = 4,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <textarea
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      rows={rows}
      disabled={disabled}
      className={`form-textarea ${className}`}
      {...props}
    />
  );
};

const FormCheckbox = ({ 
  label,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <label className={`flex items-center space-x-3 cursor-pointer ${disabled ? 'opacity-50' : ''} ${className}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};

const FormRadio = ({ 
  label,
  value,
  checked,
  onChange,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <label className={`flex items-center space-x-3 cursor-pointer ${disabled ? 'opacity-50' : ''} ${className}`}>
      <input
        type="radio"
        value={value}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
        {...props}
      />
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  );
};

// Export components
ResponsiveForm.Field = FormField;
ResponsiveForm.Input = FormInput;
ResponsiveForm.Select = FormSelect;
ResponsiveForm.Textarea = FormTextarea;
ResponsiveForm.Checkbox = FormCheckbox;
ResponsiveForm.Radio = FormRadio;

export default ResponsiveForm; 