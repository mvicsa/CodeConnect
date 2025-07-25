import React from 'react';
import { Shield } from 'lucide-react';

interface PaymentButtonProps {
    total: string;
    onClick: () => void;
    loading?: boolean;
}

export const PaymentButton: React.FC<PaymentButtonProps> = ({
    total,
    onClick,
    loading = false
}) => {
    return (
        <>
            <button
                onClick={onClick}
                disabled={loading}
                className="w-full bg-primary text-primary-foreground py-4 px-6 rounded-lg font-semibold text-lg hover:bg-primary/90 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? 'Processing...' : `PAY ${total} NOW`}
            </button>

            {/* Security Note */}
            <div className="flex items-center justify-center space-x-2 mt-4 text-sm text-muted-foreground">
                <Shield className="w-4 h-4" />
                <span>Secured by 256-bit SSL encryption</span>
            </div>
        </>
    );
};