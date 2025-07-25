import React from 'react';

interface CardFormData {
    cardNumber: string;
    expiry: string;
    cvc: string;
    country: string;
}

interface CardPaymentFormProps {
    formData: CardFormData;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
    onCardNumberChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
    formData,
    onInputChange,
    onCardNumberChange
}) => {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Card number
                </label>
                <input
                    type="text"
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={onCardNumberChange}
                    maxLength={19}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                    placeholder="1234 1234 1234 1234"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Expiry
                    </label>
                    <input
                        type="text"
                        name="expiry"
                        value={formData.expiry}
                        onChange={onInputChange}
                        maxLength={5}
                        className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="MM / YY"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        CVC
                    </label>
                    <input
                        type="text"
                        name="cvc"
                        value={formData.cvc}
                        onChange={onInputChange}
                        maxLength={4}
                        className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                        placeholder="CVC"
                    />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                    Country
                </label>
                <select
                    name="country"
                    value={formData.country}
                    onChange={onInputChange}
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                >
                    <option value="Egypt">Egypt</option>
                    <option value="Saudi Arabia">Saudi Arabia</option>
                    <option value="UAE">United Arab Emirates</option>
                    <option value="Jordan">Jordan</option>
                    <option value="Lebanon">Lebanon</option>
                </select>
            </div>
        </div>
    );
};
