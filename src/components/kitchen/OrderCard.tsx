"use client";

import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, ChefHat, CheckCircle, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";

export interface OrderItem {
    itemId: string;
    itemName: string;
    quantity: number;
    modifications?: string[];
    specialInstructions?: string;
}

export interface ChefOrder {
    id: string;
    waiterOrderId: string;
    tableId: string;
    items: OrderItem[];
    status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED";
    priority: "normal" | "high" | "urgent";
    etaMinutes: number;
    createdAt: string;
    startedAt?: string;
}

interface OrderCardProps {
    order: ChefOrder;
    onStatusChange: (orderId: string, newStatus: string) => void;
}

export function OrderCard({ order, onStatusChange }: OrderCardProps) {
    const [elapsedTime, setElapsedTime] = useState("0:00");

    // Calculate elapsed time
    useEffect(() => {
        const calculateElapsed = () => {
            const startTime = order.startedAt ? new Date(order.startedAt) : new Date(order.createdAt);
            const now = new Date();
            const diffMs = now.getTime() - startTime.getTime();
            const minutes = Math.floor(diffMs / 60000);
            const seconds = Math.floor((diffMs % 60000) / 1000);
            return `${minutes}:${seconds.toString().padStart(2, "0")}`;
        };

        setElapsedTime(calculateElapsed());
        const interval = setInterval(() => {
            setElapsedTime(calculateElapsed());
        }, 1000);

        return () => clearInterval(interval);
    }, [order.createdAt, order.startedAt]);

    // Determine if timer is warning/critical based on ETA
    const getTimerClass = () => {
        const startTime = order.startedAt ? new Date(order.startedAt) : new Date(order.createdAt);
        const elapsedMinutes = (Date.now() - startTime.getTime()) / 60000;

        if (elapsedMinutes > order.etaMinutes * 1.5) return "timer-critical";
        if (elapsedMinutes > order.etaMinutes) return "timer-warning";
        return "";
    };

    // Get action button based on status
    const getActionButton = () => {
        switch (order.status) {
            case "PENDING":
            case "CONFIRMED":
                return (
                    <Button
                        className="w-full"
                        variant="warning"
                        size="lg"
                        onClick={() => onStatusChange(order.id, "PREPARING")}
                    >
                        <ChefHat className="h-5 w-5 mr-2" />
                        Start Cooking
                    </Button>
                );
            case "PREPARING":
                return (
                    <Button
                        className="w-full"
                        variant="success"
                        size="lg"
                        onClick={() => onStatusChange(order.id, "READY")}
                    >
                        <CheckCircle className="h-5 w-5 mr-2" />
                        Mark Ready
                    </Button>
                );
            case "READY":
                return (
                    <Button
                        className="w-full"
                        variant="secondary"
                        size="lg"
                        onClick={() => onStatusChange(order.id, "SERVED")}
                    >
                        <Utensils className="h-5 w-5 mr-2" />
                        Mark Served
                    </Button>
                );
            default:
                return null;
        }
    };

    const statusVariant = order.status.toLowerCase() as "pending" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";
    const priorityVariant = order.priority as "normal" | "high" | "urgent";

    return (
        <Card
            className={cn(
                "order-card flex flex-col h-full",
                order.priority === "urgent" && "priority-urgent ring-2 ring-red-500",
                order.priority === "high" && "ring-2 ring-orange-500"
            )}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">
                        Order #{order.waiterOrderId.slice(-6).toUpperCase()}
                    </CardTitle>
                    <Badge variant={priorityVariant}>
                        {order.priority.toUpperCase()}
                    </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-xl">🪑 {order.tableId}</span>
                    </div>
                    <Badge variant={statusVariant}>
                        {order.status}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="flex-1 space-y-3">
                {/* Timer */}
                <div className={cn("flex items-center gap-2 text-2xl font-mono font-bold", getTimerClass())}>
                    <Clock className="h-5 w-5" />
                    <span>{elapsedTime}</span>
                    <span className="text-sm text-muted-foreground font-normal ml-2">
                        (ETA: {order.etaMinutes}min)
                    </span>
                </div>

                {/* Items List */}
                <div className="space-y-2 border-t pt-3">
                    {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-lg">{item.quantity}x</span>
                                    <span className="font-medium">{item.itemName}</span>
                                </div>
                                {item.modifications && item.modifications.length > 0 && (
                                    <div className="text-sm text-orange-400 ml-8">
                                        {item.modifications.join(", ")}
                                    </div>
                                )}
                                {item.specialInstructions && (
                                    <div className="flex items-center gap-1 text-sm text-yellow-400 ml-8">
                                        <AlertTriangle className="h-3 w-3" />
                                        {item.specialInstructions}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>

            <CardFooter>
                {getActionButton()}
            </CardFooter>
        </Card>
    );
}
