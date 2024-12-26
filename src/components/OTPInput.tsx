import { useState } from 'react';

interface OTPInputProps {
  onSubmit: (code: string) => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function OTPInput({ onSubmit, onBack, isLoading, error }: OTPInputProps) {
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(code);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Verification Code
        </label>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter verification code"
          className="w-full border rounded-lg px-3 py-1.5 text-sm border-gray-300 focus:border-primary-purple focus:ring-1 focus:ring-primary-purple"
          maxLength={6}
        />
      </div>

      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || code.length < 6}
        className="w-full bg-primary-purple text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Verifying...' : 'Verify code'}
      </button>

      <button
        type="button"
        onClick={onBack}
        className="w-full text-primary-purple text-sm"
      >
        Use a different phone number
      </button>
    </form>
  );
}