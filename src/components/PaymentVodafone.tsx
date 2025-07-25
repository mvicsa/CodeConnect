import React from 'react';

interface VodafoneFormData {
    vodafoneNumber: string;
}

interface VodafonePaymentFormProps {
    formData: VodafoneFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const VodafonePaymentForm: React.FC<VodafonePaymentFormProps> = ({
    formData,
    onInputChange
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Vodafone number
                </label>
                <input
                    type="tel"
                    name="vodafoneNumber"
                    value={formData.vodafoneNumber}
                    onChange={onInputChange}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="+20"
                />
                <p className="text-xs text-muted-foreground mt-1">
                    Enter your registered Vodafone Cash number
                </p>
            </div>
        </div>
    );
};

