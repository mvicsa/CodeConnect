'use client'

import React, { useCallback, useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserInfoForm from './UserInfoForm';
import PasswordChangeForm from './PasswordChangeForm';
import { User, Settings, UserX, DollarSign, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { BlockedUsersList } from '@/components/block/BlockedUsersList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/axios';
import { toast } from 'sonner';

const SettingsPageClient = () => {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams?.get('tab') || 'profile');

  // Handle Stripe onboarding redirect query param
  useEffect(() => {
    const status = searchParams?.get('stripe_onboard');
    setActiveTab(searchParams?.get('tab') || 'profile');
    if (!status) return;
    if (status === 'success') {
      toast.success('Stripe connected successfully.');
    } else if (status === 'refresh') {
      toast.error('Please resume Stripe onboarding.');
    } else if (status === 'failure') {
      toast.error('Stripe connection failed.');
    } else if (status === 'pending') {
      toast.error('Stripe onboarding pending.');
    }

    // drop query params
    router.replace(window.location.pathname);
  }, [router, searchParams]);

  const [isConnecting, setIsConnecting] = useState(false);
  const [stripeStatus, setStripeStatus] = useState<{
    isConnected?: boolean;
    chargesEnabled?: boolean;
    payoutsEnabled?: boolean;
    detailsSubmitted?: boolean;
    message?: string;
  } | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);

  // Fetch Stripe Connect status
  const fetchStripeStatus = useCallback(async () => {
    try {
      setIsLoadingStatus(true);
      const response = await api.get('/stripe-connect/account-status');
      setStripeStatus(response.data);
    } catch {
      setStripeStatus(null);
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  // Load Stripe status on component mount
  useEffect(() => {
    fetchStripeStatus();
  }, [fetchStripeStatus]);

  const handleConnectStripe = useCallback(async () => {
    try {
      setIsConnecting(true);
      const response = await api.post('/stripe-connect/onboard', {});
      const url = response?.data?.url;
      if (url) {
        window.location.href = url;
      }
    } catch {
      toast.error('Failed to connect to Stripe!');
    } finally {
      setIsConnecting(false);
    }
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-5">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          router.push(`${window.location.pathname}`);
        }} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 mb-2">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="password" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="blocks" className="flex items-center gap-2">
              <UserX className="w-4 h-4" />
              Blocks
            </TabsTrigger>
            <TabsTrigger value="payouts" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Payouts
            </TabsTrigger>
          </TabsList>

          {/* Always render both tab contents to preserve state and handle query params */}
          <div>
            <div className={activeTab === "profile" ? "block" : "hidden"}>
              <Card>
                <CardHeader>
                  <CardTitle>Profile Information</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Update your personal information and profile details.
                  </p>
                </CardHeader>
                <CardContent>
                  <UserInfoForm />
                </CardContent>
              </Card>
            </div>

            <div className={activeTab === "password" ? "block" : "hidden"}>
              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Update your password to keep your account secure.
                  </p>
                </CardHeader>
                <CardContent>
                  <PasswordChangeForm />
                </CardContent>
              </Card>
            </div>

            <div className={activeTab === "blocks" ? "block" : "hidden"}>
              <Card className="mb-3">
                <CardHeader className="gap-0">
                  <div className="flex items-center flex-wrap justify-between gap-2">
                    <div>
                      <CardTitle className="mb-2">Blocked Users</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Manage users you have blocked.
                      </p>
                    </div>
                    <Link href={`/${locale}/blocks`}>
                      <Button variant="outline" size="sm">More details</Button>
                    </Link>
                  </div>
                </CardHeader>
              </Card>
              <BlockedUsersList  />
            </div>

            <div className={activeTab === "payouts" ? "block" : "hidden"}>
              <Card className="gap-4">
                <CardHeader>
                  <CardTitle>Stripe Connect</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Connect your Stripe account to receive payouts for paid sessions.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stripe Status Display */}
                  <div className="flex items-center justify-between p-3 bg-background/60 rounded-lg">
                    <div className="flex items-center gap-3">
                      {isLoadingStatus ? (
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      ) : stripeStatus?.isConnected ? (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600" />
                      )}
                      <div>
                        <p className="font-medium">
                          {isLoadingStatus 
                            ? 'Checking status...' 
                            : stripeStatus?.isConnected 
                              ? 'Connected to Stripe' 
                              : 'Not connected to Stripe'
                          }
                        </p>
                        {stripeStatus?.message && (
                          <p className="text-sm text-muted-foreground">
                            {stripeStatus.message}
                          </p>
                        )}
                      </div>
                    </div>
                    {stripeStatus?.isConnected && (
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-green-600 font-medium">Active</span>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      </div>
                    )}
                  </div>

                  {/* Connect/Reconnect Button */}
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleConnectStripe} 
                      disabled={isConnecting}
                      variant={stripeStatus?.isConnected ? "outline" : "default"}
                    >
                      {isConnecting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Connecting…
                        </>
                      ) : stripeStatus?.isConnected ? (
                        'Reconnect to Stripe'
                      ) : (
                        'Connect to Stripe'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPageClient;
