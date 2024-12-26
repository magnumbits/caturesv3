import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from './PhoneInput';
import OTPInput from './OTPInput';

interface AuthModalProps {
  onClose: () => void;
}

export default function AuthModal({ onClose }: AuthModalProps) {
  const [step, setStep] = useState<'phone' | 'verify'>('phone');
  const [currentPhone, setCurrentPhone] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, verifyOTP } = useAuth();
  const navigate = useNavigate();

  const handleSendCode = async (phone: string) => {
    try {
      setIsLoading(true);
      setError('');
      await signIn(phone);
      setCurrentPhone(phone);
      setStep('verify');
    } catch (err) {
      setError('Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      setIsLoading(true);
      setError('');
      await verifyOTP(currentPhone, code);
      onClose();
      navigate('/upload');
    } catch (err) {
      setError('Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-4 w-full max-w-sm relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-primary-purple mb-2">Welcome to Catures!</h2>
        <p className="text-gray-600 text-sm mb-4">
          {step === 'phone' 
            ? 'Sign in with your phone number to start creating caricatures!'
            : 'Enter the verification code sent to your phone'
          }
        </p>

        {step === 'phone' ? (
          <PhoneInput
            onSubmit={handleSendCode}
            isLoading={isLoading}
            error={error}
          />
        ) : (
          <OTPInput
            onSubmit={handleVerify}
            onBack={() => setStep('phone')}
            isLoading={isLoading}
            error={error}
          />
        )}
      </div>
    </div>
  );
}