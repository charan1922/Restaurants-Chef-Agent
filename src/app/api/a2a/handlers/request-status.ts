import { query } from "@/lib/db/postgres";
import type { ChefAgentResponse, OrderStatusResponse } from "@/lib/a2a/schema";

/**
 * Handle REQUEST_STATUS message from Waiter Agent
 * Returns current status and ETA for an order
 */
export async function handleRequestStatus(
  tenantId: string,
  orderId: string
): Promise<OrderStatusResponse> {
  try {
    console.log(`[Chef handleRequestStatus] Checking status for order ${orderId}`);

    const result = await query(
      `SELECT id, waiter_order_id, status, eta_minutes, items, created_at, updated_at
       FROM chef_orders
       WHERE waiter_order_id = $1 AND tenant_id = $2`,
      [orderId, tenantId]
    );

    if (result.rows.length === 0) {
      throw new Error(`Order ${orderId} not found in kitchen queue`);
    }

    const chefOrder = result.rows[0];

    // Calculate remaining ETA based on current time
    const elapsedMinutes = Math.floor(
      (Date.now() - new Date(chefOrder.created_at).getTime()) / 60000
    );
    const remainingETA = Math.max(0, chefOrder.eta_minutes - elapsedMinutes);

    return {
      orderId: orderId,
      status: chefOrder.status,
      eta: remainingETA,
      message: `Order is ${chefOrder.status.toLowerCase()}. ${remainingETA > 0 ? `ETA: ${remainingETA} minutes` : "Ready for pickup!"}`,
    } as OrderStatusResponse;
  } catch (error) {
    console.error("[Chef handleRequestStatus] Error:", error);
    throw error;
  }
}
