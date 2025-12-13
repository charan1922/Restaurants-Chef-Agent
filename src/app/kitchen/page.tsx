"use client";

import { useState, useEffect, useCallback } from "react";
import { KitchenHeader } from "@/components/kitchen/KitchenHeader";
import { StatusTabs } from "@/components/kitchen/StatusTabs";
import { OrderQueue } from "@/components/kitchen/OrderQueue";
import { InventoryAlert } from "@/components/kitchen/InventoryAlert";
import { ChefOrder } from "@/components/kitchen/OrderCard";

export default function KitchenPage() {
    const [activeTab, setActiveTab] = useState("preparing");
    const [orders, setOrders] = useState<ChefOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [isConnected, setIsConnected] = useState(true);
    const [inventoryAlerts, setInventoryAlerts] = useState<Array<{
        ingredientName: string;
        currentStock: number;
        reorderPoint: number;
        unit: string;
    }>>([]);

    // Fetch orders from API
    const fetchOrders = useCallback(async () => {
        try {
            const response = await fetch("/api/orders");
            const data = await response.json();

            if (data.success) {
                setOrders(data.orders);
                setIsConnected(true);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            setIsConnected(false);
        } finally {
            setLoading(false);
        }
    }, []);

    // Fetch inventory alerts
    const fetchInventoryAlerts = useCallback(async () => {
        try {
            const response = await fetch("/api/inventory/alerts");
            const data = await response.json();

            if (data.success) {
                setInventoryAlerts(data.alerts);
            }
        } catch (error) {
            console.error("Failed to fetch inventory alerts:", error);
        }
    }, []);

    // Initial fetch and polling
    useEffect(() => {
        fetchOrders();
        fetchInventoryAlerts();

        // Poll for updates every 5 seconds
        const ordersInterval = setInterval(fetchOrders, 5000);
        const alertsInterval = setInterval(fetchInventoryAlerts, 30000);

        return () => {
            clearInterval(ordersInterval);
            clearInterval(alertsInterval);
        };
    }, [fetchOrders, fetchInventoryAlerts]);

    // Handle status change
    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status: newStatus }),
            });

            const data = await response.json();

            if (data.success) {
                // Optimistically update the UI
                setOrders((prev) =>
                    prev.map((order) =>
                        order.id === orderId
                            ? { ...order, status: newStatus as ChefOrder["status"] }
                            : order
                    )
                );
                // Refresh to get accurate data
                fetchOrders();
            }
        } catch (error) {
            console.error("Failed to update order status:", error);
        }
    };

    // Calculate counts for each status
    const counts = {
        pending: orders.filter((o) => o.status === "PENDING").length,
        confirmed: orders.filter((o) => o.status === "CONFIRMED").length,
        preparing: orders.filter((o) => o.status === "PREPARING").length,
        ready: orders.filter((o) => o.status === "READY").length,
        served: orders.filter((o) => o.status === "SERVED").length,
    };

    // Filter orders by active tab
    const filteredOrders = orders.filter(
        (order) => order.status.toLowerCase() === activeTab
    );

    return (
        <div className="min-h-screen flex flex-col">
            <KitchenHeader isConnected={isConnected} />

            <StatusTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                counts={counts}
            />

            <main className="flex-1 overflow-auto pb-16">
                <OrderQueue
                    orders={filteredOrders}
                    loading={loading}
                    onStatusChange={handleStatusChange}
                />
            </main>

            <InventoryAlert alerts={inventoryAlerts} />
        </div>
    );
}
