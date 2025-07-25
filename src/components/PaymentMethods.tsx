import React from 'react';
import { CreditCard, Smartphone } from 'lucide-react';

interface PaymentMethodsProps {
    selectedMethod: string;
    onMethodChange: (method: string) => void;
}

export const PaymentMethods: React.FC<PaymentMethodsProps> = ({
    selectedMethod,
    onMethodChange
}) => {
    return (
        <div className="flex space-x-2 mb-6">
            <button
                onClick={() => onMethodChange('card')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-colors ${selectedMethod === 'card'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
            >
                <CreditCard className="w-4 h-4" />
                <span className="font-medium">Card</span>
            </button>

            <button
                onClick={() => onMethodChange('vodafone')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg border transition-colors ${selectedMethod === 'vodafone'
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
            >
                <div className="w-4 h-4 bg-red-600 rounded flex items-center justify-center">
                    <img src="/vodafone-icon.svg" alt="" />
                </div>
                <span className="font-medium">Vodafone Cash</span>
            </button>
        </div>
    );
};

