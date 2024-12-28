import { useState } from 'react';
import * as Select from '@radix-ui/react-select';
import { ChevronDown } from 'lucide-react';
import { countryCodes } from '../utils/countryUtils'; 

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
  isLoading?: boolean;
  error?: string;
}

export default function PhoneInput({ onSubmit, isLoading, error }: PhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [selectedCountryId, setSelectedCountryId] = useState('in');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const country = countryCodes.find(c => c.id === selectedCountryId);
    const formattedPhone = phone.startsWith('+') ? phone : `${country?.code}${phone}`;
    onSubmit(formattedPhone);
  };
  
  const selectedCountry = countryCodes.find(c => c.id === selectedCountryId);
  const displayCode = selectedCountry?.code || '+91';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Phone Number
        </label>
        <div className="flex gap-1 max-w-[280px]">
          <Select.Root value={selectedCountryId} onValueChange={setSelectedCountryId}>
            <Select.Trigger className="border rounded-lg px-2 py-1.5 text-sm border-primary-purple text-primary-purple w-[72px] flex items-center justify-between">
              <Select.Value>{displayCode}</Select.Value>
              <Select.Icon className="flex">
                <ChevronDown size={14} />
              </Select.Icon>
            </Select.Trigger>
            
            <Select.Portal>
              <Select.Content position="popper" sideOffset={5} className="z-50 bg-white rounded-lg shadow-lg border border-gray-200 max-h-[300px] overflow-auto">
                <Select.ScrollUpButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                  <ChevronDown className="rotate-180" size={14} />
                </Select.ScrollUpButton>
                <Select.Viewport>
                  {countryCodes.map((country) => (
                    <Select.Item
                      key={country.id}
                      value={country.id}
                      className="flex items-center px-2 py-1.5 text-sm hover:bg-gray-100 cursor-pointer outline-none data-[highlighted]:bg-gray-100"
                    >
                      <Select.ItemText>
                        {country.name} ({country.code})
                      </Select.ItemText>
                    </Select.Item>
                  ))}
                </Select.Viewport>
                <Select.ScrollDownButton className="flex items-center justify-center h-6 bg-white text-gray-700 cursor-default">
                  <ChevronDown size={14} />
                </Select.ScrollDownButton>
              </Select.Content>
            </Select.Portal>
          </Select.Root>

          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
            placeholder="Phone number"
            className="border rounded-lg px-2 py-1.5 text-sm flex-1 min-w-0 border-gray-300 focus:border-primary-purple focus:ring-1 focus:ring-primary-purple"
            maxLength={10}
          />
        </div>
      </div>
      
      {error && (
        <p className="text-red-500 text-xs">{error}</p>
      )}

      <button
        type="submit"
        disabled={isLoading || phone.length < 10}
        className="w-full bg-primary-purple text-white rounded-lg py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {isLoading ? 'Sending code...' : 'Send verification code'}
      </button>
    </form>
  );
}