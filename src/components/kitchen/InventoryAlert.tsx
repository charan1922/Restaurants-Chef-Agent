"use client";

import { AlertTriangle, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface InventoryAlertProps {
    alerts: Array<{
        ingredientName: string;
        currentStock: number;
        reorderPoint: number;
        unit: string;
    }>;
}

export function InventoryAlert({ alerts }: InventoryAlertProps) {
    const [dismissed, setDismissed] = useState(false);

    if (alerts.length === 0 || dismissed) {
        return null;
    }

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500/10 border-t border-yellow-500/30 p-4">
            <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
                <div className="flex items-center gap-3">
                    <AlertTriangle className="h-6 w-6 text-yellow-500 flex-shrink-0" />
                    <div className="flex items-center gap-4 overflow-x-auto">
                        <span className="font-semibold text-yellow-500 whitespace-nowrap">
                            LOW STOCK:
                        </span>
                        {alerts.map((alert, idx) => (
                            <span key={idx} className="text-sm whitespace-nowrap">
                                {alert.ingredientName} ({alert.currentStock} {alert.unit} remaining)
                                {idx < alerts.length - 1 && <span className="mx-2">•</span>}
                            </span>
                        ))}
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => setDismissed(true)}
                >
                    <X className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
