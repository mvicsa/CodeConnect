'use client';

import React, { useState, useEffect } from 'react';

const Animated404: React.FC = () => {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-purple-50 flex items-center justify-center p-4 overflow-hidden relative">

            {/* Background floating spheres */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Large floating sphere - top right */}
                <div
                    className="absolute w-32 h-20 bg-gradient-to-br from-pink-200/40 to-purple-200/30 rounded-full blur-sm animate-pulse"
                    style={{
                        top: '15%',
                        right: '10%',
                        borderRadius: '60% 40% 30% 70% / 60% 30% 70% 40%',
                        animationDuration: '4s'
                    }}
                />

                {/* Medium floating sphere - top right */}
                <div
                    className="absolute w-8 h-8 bg-gradient-to-br from-orange-300/50 to-pink-300/40 rounded-full animate-bounce"
                    style={{
                        top: '20%',
                        right: '5%',
                        animationDuration: '3s',
                        animationDelay: '1s'
                    }}
                />

                {/* Small floating sphere - below coffee */}
                <div
                    className="absolute w-6 h-6 bg-gradient-to-br from-purple-300/60 to-pink-300/40 rounded-full animate-bounce"
                    style={{
                        top: '45%',
                        right: '15%',
                        animationDuration: '2.5s',
                        animationDelay: '0.5s'
                    }}
                />
            </div>

            <div className={`relative z-10 flex items-center justify-center gap-16 transform transition-all duration-1000 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                }`}>

                {/* 3D Computer */}
                <div className={`relative transform transition-all duration-700 ${isVisible ? 'scale-100 rotate-0' : 'scale-75 rotate-y-12'
                    }`}>

                    {/* Computer Base/Keyboard */}
                    <div className="relative">
                        <div className="w-80 h-6 bg-gradient-to-r from-gray-200 to-purple-200 rounded-xl shadow-lg transform perspective-1000 rotate-x-45 border border-gray-300/50"></div>

                        {/* Keyboard Keys */}
                        <div className="absolute top-1 left-4 right-4 flex flex-wrap gap-1">
                            {[...Array(24)].map((_, i) => (
                                <div
                                    key={i}
                                    className="w-3 h-2 bg-white/80 rounded-sm shadow-sm border border-gray-300/30"
                                    style={{ animationDelay: `${i * 0.1}s` }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Computer Screen */}
                    <div className="relative -mt-2 ml-8">
                        {/* Screen Bezel */}
                        <div className="w-64 h-48 bg-gradient-to-br from-pink-200 via-purple-200 to-pink-300 rounded-2xl p-4 shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500 border border-gray-300">

                            {/* Screen Content */}
                            <div className="w-full h-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl relative overflow-hidden shadow-inner">

                                {/* 404 Dialog Box */}
                                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                                    <div className="bg-gradient-to-br from-pink-50 to-orange-50 rounded-lg p-6 shadow-xl min-w-32 border border-gray-200">

                                        {/* Close Button */}
                                        <div className="flex justify-end mb-2">
                                            <div className="w-4 h-4 bg-gradient-to-br from-red-400 to-red-500 rounded-full flex items-center justify-center shadow-sm">
                                                <span className="text-white text-xs font-bold">×</span>
                                            </div>
                                        </div>

                                        {/* 404 Text */}
                                        <div className="text-center">
                                            <div
                                                className={`text-6xl font-bold text-gray-800 transform transition-all duration-1000 ${isVisible ? 'scale-100' : 'scale-150'
                                                    }`}
                                                style={{
                                                    fontFamily: 'var(--font-family, system-ui)',
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
                        <div className="absolute -bottom-2 left-2 w-16 h-3 bg-gradient-to-r from-orange-300 to-orange-400 rounded-r-lg shadow-md border-r border-t border-orange-400/50"></div>
                    </div>
                </div>

                {/* Coffee Mug */}
                <div className={`relative transform transition-all duration-1000 delay-500 ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-8 opacity-0'
                    }`}>

                    {/* Mug Body */}
                    <div className="w-16 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-b-2xl rounded-t-lg shadow-xl relative border border-orange-600/30">

                        {/* Mug Handle */}
                        <div className="absolute -right-3 top-4 w-6 h-8 border-4 border-orange-400 rounded-r-full"></div>

                        {/* Coffee Surface */}
                        <div className="absolute top-2 left-2 right-2 h-3 bg-gradient-to-r from-amber-800 to-amber-900 rounded-lg shadow-inner border border-amber-700/20"></div>

                        {/* Floating sphere on coffee */}
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-gradient-to-br from-pink-300 to-orange-300 rounded-full animate-bounce shadow-lg border border-pink-400/30"
                            style={{ animationDuration: '2s', animationDelay: '1s' }}></div>
                    </div>

                    {/* Steam Animation */}
                    <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                        {[...Array(4)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-1 h-6 bg-gray-400/60 rounded-full opacity-60 animate-pulse"
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

            {/* Additional floating elements */}
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(8)].map((_, i) => (
                    <div
                        key={i}
                        className="absolute w-2 h-2 bg-purple-300/30 rounded-full animate-ping"
                        style={{
                            left: `${15 + Math.random() * 70}%`,
                            top: `${20 + Math.random() * 60}%`,
                            animationDelay: `${Math.random() * 4}s`,
                            animationDuration: `${3 + Math.random() * 2}s`,
                        }}
                    />
                ))}
            </div>

            {/* Status message */}
            <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 opacity-75">
                <div className="bg-white/80 backdrop-blur-sm text-gray-700 px-4 py-2 rounded-lg border border-gray-300/50 shadow-lg">
                    <p className="text-sm" style={{ fontFamily: 'var(--font-family, system-ui)' }}>
                        Page not found • Error 404
                    </p>
                </div>
            </div>

            <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-10px) rotate(2deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
};

export default Animated404;