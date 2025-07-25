'use client';

import React, { useState } from 'react';
import { Building2 } from 'lucide-react';
import { PaymentSummary } from '@/components/Payment';
import { PaymentMethods } from '@/components/PaymentMethods';
import { CardPaymentForm } from '@/components/PaymentForm';
import { VodafonePaymentForm } from '@/components/PaymentVodafone';
import { GuaranteeSection } from '@/components/PaymentGuarantee';
import { PaymentButton } from '@/components/PaymentBtn';
import Logo from '@/components/Logo';


interface FormData {
    cardNumber: string;
    expiry: string;
    cvc: string;
    country: string;
    vodafoneNumber: string;
}

const PaymentPage = () => {
    const [selectedMethod, setSelectedMethod] = useState('card');
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<FormData>({
        cardNumber: '',
        expiry: '',
        cvc: '',
        country: 'Egypt',
        vodafoneNumber: ''
    });

    // Sample payment items - you can make this dynamic
    const paymentItems = [
        { name: 'Business Registration', price: '$399' },
        { name: 'Legal Documentation', price: '$150' },
        { name: 'Tax ID Setup', price: '$99' }
    ];

    const total = '$648.00';

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const formatCardNumber = (value: string) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = matches && matches[0] || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length) {
            return parts.join(' ');
        } else {
            return v;
        }
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatCardNumber(e.target.value);
        setFormData(prev => ({
            ...prev,
            cardNumber: formatted
        }));
    };

    const handlePayment = async () => {
        setLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Handle payment logic here
            console.log('Processing payment:', {
                method: selectedMethod,
                ...formData,
                total
            });

            // You can add success handling, redirect, etc.
            alert('Payment processed successfully!');

        } catch (error) {
            console.error('Payment failed:', error);
            alert('Payment failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-muted/30 p-4 md:p-8">
            <div className="max-w-6xl mx-auto">
                <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                    <div className="grid md:grid-cols-2 gap-0">
                        {/* Left Section - Branding & Info */}
                        <div className="p-8 md:p-12 bg-gradient-to-br from-primary/5 via-primary/3 to-background">
                            <Logo />

                            {/* Service Illustration */}
                            <div className="mb-8 flex justify-center">
                                <div className="relative">
                                    <div className="w-32 h-32 bg-gradient-to-br from-primary/20 to-primary/40 rounded-full flex items-center justify-center">
                                        <Building2 className="w-16 h-16 text-primary" />
                                    </div>
                                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full animate-pulse"></div>
                                    <div className="absolute -bottom-1 -left-1 w-4 h-4 bg-primary/60 rounded-full animate-pulse delay-300"></div>
                                </div>
                            </div>

                            {/* Title & Description */}
                            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4 leading-tight">
                                Complete setting up your Business
                            </h1>

                            <p className="text-muted-foreground mb-8 leading-relaxed">
                                All-in-one solution for your business registration.
                                Get your company registered quickly with full legal compliance and documentation.
                            </p>

                            {/* Guarantees */}
                            <GuaranteeSection />
                        </div>

                        {/* Right Section - Payment Form */}
                        <div className="p-8 md:p-12">
                            {/* Payment Summary */}
                            <PaymentSummary items={paymentItems} total={total} />

                            {/* Payment Methods */}
                            <div className="mb-6">
                                <h3 className="text-lg font-semibold text-foreground mb-4">PAYMENT</h3>

                                <PaymentMethods
                                    selectedMethod={selectedMethod}
                                    onMethodChange={setSelectedMethod}
                                />

                                {/* Payment Forms */}
                                {selectedMethod === 'card' && (
                                    <CardPaymentForm
                                        formData={formData}
                                        onInputChange={handleInputChange}
                                        onCardNumberChange={handleCardNumberChange}
                                    />
                                )}

                                {selectedMethod === 'vodafone' && (
                                    <VodafonePaymentForm
                                        formData={formData}
                                        onInputChange={handleInputChange}
                                    />
                                )}
                            </div>

                            {/* Payment Button */}
                            <PaymentButton
                                total={total}
                                onClick={handlePayment}
                                loading={loading}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentPage;