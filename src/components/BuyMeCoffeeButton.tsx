import { useEffect } from 'react';

interface BuyMeCoffeeButtonProps {
  onButtonLoad?: () => void;
}

export default function BuyMeCoffeeButton({ onButtonLoad }: BuyMeCoffeeButtonProps) {
  useEffect(() => {
    // Trigger onButtonLoad when component mounts
    if (onButtonLoad) {
      onButtonLoad();
    }
  }, [onButtonLoad]);

  return (
    <div className="flex justify-center">
      <a 
        href="https://www.buymeacoffee.com/magnumben" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block hover:opacity-90 transition-opacity"
      >
        <img 
          src="https://cdn.buymeacoffee.com/buttons/v2/default-violet.png" 
          alt="Buy Me A Coffee" 
          className="h-[60px] w-[217px]"
        />
      </a>
    </div>
  );
}