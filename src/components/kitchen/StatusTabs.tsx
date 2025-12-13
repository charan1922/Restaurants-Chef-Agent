"use client";

import { cn } from "@/lib/utils";

interface StatusTabsProps {
    activeTab: string;
    onTabChange: (tab: string) => void;
    counts: {
        pending: number;
        confirmed: number;
        preparing: number;
        ready: number;
        served: number;
    };
}

const tabs = [
    { id: "pending", label: "NEW", color: "bg-yellow-500" },
    { id: "confirmed", label: "CONFIRMED", color: "bg-blue-500" },
    { id: "preparing", label: "PREPARING", color: "bg-orange-500" },
    { id: "ready", label: "READY", color: "bg-green-500" },
    { id: "served", label: "SERVED", color: "bg-gray-500" },
];

export function StatusTabs({ activeTab, onTabChange, counts }: StatusTabsProps) {
    return (
        <div className="flex gap-2 p-4 bg-card border-b overflow-x-auto">
            {tabs.map((tab) => {
                const count = counts[tab.id as keyof typeof counts] || 0;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={cn(
                            "flex items-center gap-2 px-4 py-3 rounded-lg font-semibold transition-all min-w-[120px]",
                            isActive
                                ? "bg-secondary text-foreground ring-2 ring-primary scale-105"
                                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                        )}
                    >
                        <span
                            className={cn(
                                "w-3 h-3 rounded-full",
                                tab.color,
                                count > 0 && !isActive && "animate-pulse"
                            )}
                        />
                        <span>{tab.label}</span>
                        <span
                            className={cn(
                                "ml-auto px-2 py-0.5 rounded-full text-sm font-bold",
                                isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                            )}
                        >
                            {count}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}
