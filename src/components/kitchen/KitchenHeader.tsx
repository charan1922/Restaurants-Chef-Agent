"use client";

import { useTheme } from "@/contexts/ThemeContext";
import { Clock, Wifi, WifiOff } from "lucide-react";
import { useState, useEffect } from "react";

interface KitchenHeaderProps {
    isConnected?: boolean;
}

export function KitchenHeader({ isConnected = true }: KitchenHeaderProps) {
    const { theme } = useTheme();
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
            <div className="flex h-16 items-center justify-between px-6">
                {/* Left - Restaurant Name */}
                <div className="flex items-center gap-3">
                    <span className="text-3xl">👨‍🍳</span>
                    <div>
                        <h1
                            className="text-xl font-bold"
                            style={{ color: theme.primaryColor }}
                        >
                            {theme.tenantName}
                        </h1>
                        <p className="text-xs text-muted-foreground">Kitchen Display System</p>
                    </div>
                </div>

                {/* Right - Time and Status */}
                <div className="flex items-center gap-6">
                    {/* Current Time */}
                    <div className="flex items-center gap-2 text-2xl font-mono font-bold">
                        <Clock className="h-5 w-5 text-muted-foreground" />
                        <span>
                            {currentTime.toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                                second: "2-digit",
                                hour12: false,
                            })}
                        </span>
                    </div>

                    {/* Connection Status */}
                    <div className="flex items-center gap-2">
                        {isConnected ? (
                            <>
                                <Wifi className="h-5 w-5 text-green-500" />
                                <span className="text-sm text-green-500 font-medium">Connected</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-5 w-5 text-red-500" />
                                <span className="text-sm text-red-500 font-medium">Disconnected</span>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}
