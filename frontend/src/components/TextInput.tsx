import React from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  disabled = false,
  placeholder = "Enter text to analyze for PII...",
  maxLength = 10000
}) => {
  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.9;
  const isOverLimit = characterCount > maxLength;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-medium text-gray-700">
          Text to Analyze
        </label>
        <div className={`text-xs ${isOverLimit ? 'text-error' : isNearLimit ? 'text-warning' : 'text-gray-500'}`}>
          {characterCount.toLocaleString()} / {maxLength.toLocaleString()} characters
        </div>
      </div>

      <div className="relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={8}
          className={`
            w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none
            ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}
            ${isOverLimit ? 'border-error focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
          `}
          style={{ minHeight: '200px' }}
        />
        
        {isOverLimit && (
          <div className="absolute top-2 right-2">
            <div className="bg-error text-white text-xs px-2 py-1 rounded">
              Text too long
            </div>
          </div>
        )}
      </div>

      {isOverLimit && (
        <p className="text-sm text-error">
          Text exceeds maximum length of {maxLength.toLocaleString()} characters. 
          Please reduce the text by {(characterCount - maxLength).toLocaleString()} characters.
        </p>
      )}

      {value.length === 0 && (
        <p className="text-sm text-gray-500">
          Paste or type text containing potential PII data. Supported formats include:
          phone numbers, emails, names, addresses, ID numbers, and more.
        </p>
      )}
    </div>
  );
};

export default TextInput;