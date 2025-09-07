'use client'

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserInfoForm from './UserInfoForm';
import PasswordChangeForm from './PasswordChangeForm';
import { User, Settings, UserX } from 'lucide-react';
import { BlockedUsersList } from '@/components/block/BlockedUsersList';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useParams } from 'next/navigation';

const SettingsPageClient = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

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
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 mb-2">
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
          </TabsList>

          {/* Always render both tab contents to preserve state */}
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
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default SettingsPageClient;
