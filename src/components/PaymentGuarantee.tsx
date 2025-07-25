import React from 'react';
import { RefreshCcw, DollarSign } from 'lucide-react';

export const GuaranteeSection = () => {
    return (
        <div className="space-y-4">
            <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <RefreshCcw className="w-5 h-5 text-success" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">100% REFUND GUARANTEE</h3>
                    <p className="text-sm text-muted-foreground">
                        If you are not completely satisfied with our service, get a full refund with no questions asked.
                    </p>
                </div>
            </div>

            <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-info/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-5 h-5 text-info" />
                </div>
                <div>
                    <h3 className="font-semibold text-foreground">NO HIDDEN FEES</h3>
                    <p className="text-sm text-muted-foreground">
                        Transparent pricing with no surprise charges. What you see is what you pay.
                    </p>
                </div>
            </div>
        </div>
    );
};
