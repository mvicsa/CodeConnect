

import React from 'react';

interface SummaryItem {
    name: string;
    price: string;
}

interface PaymentSummaryProps {
    items: SummaryItem[];
    total: string;
}

export const PaymentSummary: React.FC<PaymentSummaryProps> = ({ items, total }) => {
    return (
        <div className="mb-8">
            <h2 className="text-lg font-semibold text-foreground mb-6">SUMMARY</h2>
            <div className="space-y-3 mb-6">
                {items.map((item, index) => (
                    <div key={index} className="flex justify-between">
                        <span className="text-muted-foreground">{item.name}</span>
                        <span className="font-medium">{item.price}</span>
                    </div>
                ))}
            </div>
            <div className="border-t border-border pt-3">
                <div className="flex justify-between items-center">
                    <span className="font-semibold text-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">{total}</span>
                </div>
            </div>
        </div>
    );
};
