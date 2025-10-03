'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Home, Search, Coffee, Monitor } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const NotFoundPage: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);
    const [mounted, setMounted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        setMounted(true);
        const timer = setTimeout(() => setIsVisible(true), 100);
        return () => clearTimeout(timer);
    }, []);

    const handleGoBack = () => {
        router.back();
    };

    const handleGoHome = () => {
        router.push('/');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4 overflow-hidden relative">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Floating orbs */}
                <div className="absolute w-32 h-32 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-full blur-xl animate-pulse"
                    style={{
                        top: '10%',
                        right: '15%',
                        animationDuration: '6s'
                    }}
                />
                <div className="absolute w-24 h-24 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-full blur-lg animate-pulse"
                    style={{
                        top: '60%',
                        left: '10%',
                        animationDuration: '8s',
                        animationDelay: '2s'
                    }}
                />
                <div className="absolute w-16 h-16 bg-gradient-to-br from-accent/20 to-primary/10 rounded-full blur-md animate-bounce"
                    style={{
                        top: '30%',
                        left: '20%',
                        animationDuration: '4s',
                        animationDelay: '1s'
                    }}
                />
            </div>

            <div className="relative z-10 w-full max-w-4xl mx-auto">
                <div className={`transform transition-all duration-1000 ease-out ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-8 opacity-0'
                }`}>
                    
                    {/* Main 404 Card */}
                    <Card className="relative overflow-hidden border-0 shadow-2xl bg-background/80 backdrop-blur-sm">
                        <CardHeader className="text-center pb-8">
                            <CardDescription className="text-xl text-muted-foreground max-w-md mx-auto">
                                Oops! The page you&apos;re looking for seems to have wandered off into the digital void.
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-8">
                            {/* Animated Computer Scene */}
                            <div className="flex items-center justify-center gap-16 mb-8">
                                {/* 3D Computer */}
                                <div className={`relative transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-y-12'}`}>
                                    {/* Computer Base/Keyboard */}
                                    <div className="relative">
                                        <div className="w-80 h-6 bg-gradient-to-r from-muted to-muted/80 rounded-xl shadow-lg transform perspective-1000 rotate-x-45 border border-border/50"></div>

                                        {/* Keyboard Keys */}
                                        <div className="absolute top-1 start-4 end-4 flex flex-wrap gap-1">
                                            {[...Array(24)].map((_, i) => (
                                                <div
                                                    key={i}
                                                    className="w-3 h-2 bg-background/80 rounded-sm shadow-sm border border-border/30"
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    {/* Computer Screen */}
                                    <div className="relative -mt-2 ml-8">
                                        {/* Screen Bezel */}
                                        <div className="w-64 h-48 bg-gradient-to-br from-primary/20 via-secondary/20 to-primary/30 rounded-2xl p-4 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 border border-border">
                                            {/* Screen Content */}
                                            <div className="w-full h-full bg-gradient-to-br from-destructive/30 to-destructive/40 rounded-xl relative overflow-hidden shadow-inner">
                                                {/* 404 Dialog Box */}
                                                <div className="absolute top-1/2 start-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                                    <div className="bg-gradient-to-br from-background/90 to-background/80 rounded-lg p-6 shadow-xl min-w-32 border border-border">
                                                        {/* Close Button */}
                                                        <div className="flex justify-end mb-2">
                                                            <div className="w-4 h-4 bg-gradient-to-br from-destructive to-destructive/80 rounded-full flex items-center justify-center shadow-sm">
                                                                <span className="text-destructive-foreground text-xs font-bold">×</span>
                                                            </div>
                                                        </div>

                                                        {/* 404 Text */}
                                                        <div className="text-center">
                                                            <div
                                                                className={`text-6xl font-bold text-primary transform transition-all duration-1000 ${isVisible ? 'scale-100' : 'scale-150'}`}
                                                                style={{
                                                                    textShadow: '2px 2px 4px rgba(0,0,0,0.1)',
                                                                    animation: 'pulse 2s infinite'
                                                                }}
                                                            >
                                                                404
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Screen Reflection Effect */}
                                                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 rounded-xl"></div>
                                            </div>
                                        </div>

                                        {/* CD/DVD Tray */}
                                        <div className="absolute -bottom-2 start-2 w-16 h-3 bg-gradient-to-r from-orange-300 to-orange-400 rounded-r-lg shadow-md border-r border-t border-orange-400/50"></div>
                                    </div>
                                </div>

                                {/* Coffee Mug */}
                                <div className={`relative transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'}`}>
                                    {/* Mug Body */}
                                    <div className="w-16 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-b-2xl rounded-t-lg shadow-xl relative border border-orange-600/30">
                                        {/* Mug Handle */}
                                        <div className="absolute -right-3 top-4 w-6 h-8 border-4 border-orange-400 rounded-r-full"></div>

                                        {/* Coffee Surface */}
                                        <div className="absolute top-2 start-2 right-2 h-3 bg-gradient-to-r from-amber-800 to-amber-900 rounded-lg shadow-inner border border-amber-700/20"></div>

                                        {/* Floating sphere on coffee */}
                                        <div className="absolute -top-2 start-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-pink-300 to-orange-300 rounded-full animate-bounce shadow-lg border border-pink-400/30"
                                            style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                                    </div>

                                    {/* Steam Animation */}
                                    <div className="absolute -top-8 start-1/2 transform -translate-x-1/2">
                                        {[...Array(4)].map((_, i) => (
                                            <div
                                                key={i}
                                                className="absolute w-1 h-6 bg-muted-foreground/60 rounded-full opacity-60 animate-pulse"
                                                style={{
                                                    left: `${i * 3}px`,
                                                    animationDelay: `${i * 0.4}s`,
                                                    animationDuration: '3s',
                                                    transform: `rotate(${Math.random() * 10 - 5}deg)`
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button 
                                    onClick={handleGoBack}
                                    variant="outline" 
                                    size="lg"
                                    className="w-full sm:w-auto"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Go Back
                                </Button>
                                <Button 
                                    onClick={handleGoHome}
                                    size="lg"
                                    className="w-full sm:w-auto"
                                >
                                    <Home className="w-4 h-4 mr-2" />
                                    Go Home
                                </Button>
                            </div>

                            {/* Additional Help */}
                            <div className="text-center space-y-4">
                                <p className="text-sm text-muted-foreground">
                                    Need help finding something? Try these options:
                                </p>
                                <div className="flex flex-wrap justify-center gap-2">
                                    <Link href="/search">
                                        <Button variant="ghost" size="sm">
                                            <Search className="w-4 h-4 mr-2" />
                                            Search
                                        </Button>
                                    </Link>
                                    <Link href="/">
                                        <Button variant="ghost" size="sm">
                                            <Monitor className="w-4 h-4 mr-2" />
                                            Browse
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fun fact card */}
                    <Card className="mt-6 border-0 shadow-lg bg-background/60 backdrop-blur-sm">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-center gap-3 text-muted-foreground">
                                <Coffee className="w-5 h-5" />
                                <p className="text-sm text-center">
                                    Did you know? The first 404 error was discovered in 1990, 
                                    around the same time the World Wide Web was born!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Floating particles */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-1 h-1 bg-primary/30 rounded-full animate-ping"
                        style={{
                            left: `${20 + Math.random() * 60}%`,
                            top: `${15 + Math.random() * 70}%`,
                            animationDelay: `${Math.random() * 3}s`,
                            animationDuration: `${2 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default NotFoundPage;