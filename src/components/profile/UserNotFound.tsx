'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { UserX, Search, Home, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface UserNotFoundProps {
  username?: string;
}

export default function UserNotFound({ username }: UserNotFoundProps) {
  const router = useRouter();

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-xl mx-auto">
        <CardContent className="pt-8 pb-6 text-center space-y-6">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center">
                <UserX className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                <Search className="w-4 h-4 text-destructive-foreground" />
              </div>
            </div>
          </div>

          {/* Title and Description */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              User Not Found
            </h1>
            <div className="space-y-1">
              {username ? (
                <p className="text-muted-foreground">
                  The user <span className="font-medium text-foreground">@{username}</span> doesn&apos;t exist or may have been deleted.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  The user you&apos;re looking for doesn&apos;t exist or may have been deleted.
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Please check the username and try again.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={() => router.back()} 
              variant="default" 
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
            
            <div className="flex gap-2">
              <Button asChild variant="outline" className="flex-1">
                <Link href="/">
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="flex-1">
                <Link href="/search">
                  <Search className="w-4 h-4 mr-2" />
                  Search Users
                </Link>
              </Button>
            </div>
          </div>

          {/* Suggestions */}
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-3">
              You might want to:
            </p>
            <div className="text-sm text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>Check the spelling of the username</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>Search for similar usernames</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-muted-foreground rounded-full" />
                <span>Browse other profiles</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
