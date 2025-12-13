"use client";

import { OrderCard, ChefOrder } from "./OrderCard";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderQueueProps {
    orders: ChefOrder[];
    loading?: boolean;
    onStatusChange: (orderId: string, newStatus: string) => void;
}

export function OrderQueue({ orders, loading, onStatusChange }: OrderQueueProps) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
                {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
            </div>
        );
    }

    if (orders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <span className="text-6xl mb-4">🍳</span>
                <p className="text-xl">No orders in this status</p>
                <p className="text-sm">Orders will appear here when received</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 p-4">
            {orders.map((order) => (
                <OrderCard
                    key={order.id}
                    order={order}
                    onStatusChange={onStatusChange}
                />
            ))}
        </div>
    );
}
