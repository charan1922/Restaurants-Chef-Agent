import { query } from "@/lib/db/postgres";
import type { ChefAgentResponse } from "@/lib/a2a/schema";

/**
 * Handle CANCEL_ORDER message from Waiter Agent
 * Cancels an order and restores inventory if not yet started
 */
export async function handleCancelOrder(
  tenantId: string,
  orderId: string
): Promise<void> {
  try {
    console.log(`[Chef handleCancelOrder] Cancelling order ${orderId}`);

    // Get current order status
    const orderResult = await query(
      `SELECT id, status, items, started_at
       FROM chef_orders
       WHERE waiter_order_id = $1 AND tenant_id = $2`,
      [orderId, tenantId]
    );

    if (orderResult.rows.length === 0) {
      throw new Error(`Order ${orderId} not found`);
    }

    const chefOrder = orderResult.rows[0];

    // Check if order can be cancelled
    if (chefOrder.status === "READY" || chefOrder.status === "SERVED") {
      throw new Error(`Cannot cancel order - already ${chefOrder.status.toLowerCase()}`);
    }

    // Update order status to CANCELLED
    await query(
      `UPDATE chef_orders
       SET status = 'CANCELLED', updated_at = NOW()
       WHERE waiter_order_id = $1 AND tenant_id = $2`,
      [orderId, tenantId]
    );

    // TODO: If order hasn't started, restore inventory
    // This would reverse the inventory_transactions

    console.log(`[Chef handleCancelOrder] ✅ Order ${orderId} cancelled`);
    return;
  } catch (error) {
    console.error("[Chef handleCancelOrder] Error:", error);
    throw error;
  }
}
