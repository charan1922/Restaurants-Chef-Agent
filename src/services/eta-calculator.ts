import { query } from "@/lib/db/postgres";
import type { OrderItem } from "@/lib/a2a/schema";

/**
 * Calculate Estimated Time of Arrival (ETA) for an order
 * 
 * Factors considered:
 * 1. Dish preparation time (from menu_items.prep_time)
 * 2. Quantity of items
 * 3. Current kitchen load (number of active orders)
 * 4. Priority level
 * 
 * @returns ETA in minutes
 */
export async function calculateETA(
  tenantId: string,
  items: OrderItem[]
): Promise<number> {
  try {
    // 1. Get base prep times for all items
    const prepTimes: number[] = [];
    
    for (const item of items) {
      const result = await query(
        `SELECT prep_time FROM menu_items
         WHERE tenant_id = $1 AND id = $2`,
        [tenantId, item.itemId]
      );

      if (result.rows.length > 0) {
        const basePrepTime = parseInt(result.rows[0].prep_time) || 15; // Default 15min
        // Multiply by quantity (but with diminishing returns - can cook in parallel)
        const itemTime = basePrepTime + (basePrepTime * 0.3 * (item.quantity - 1));
        prepTimes.push(itemTime);
      }
    }

    if (prepTimes.length === 0) {
      return 20; // Default if no menu items found
    }

    // 2. Base time is the maximum prep time (dishes prepared in parallel)
    const baseTime = Math.max(...prepTimes);

    // 3. Get current kitchen load
    const loadResult = await query(
      `SELECT COUNT(*) as active_orders
       FROM chef_orders
       WHERE tenant_id = $1 
         AND status IN ('PENDING', 'CONFIRMED', 'PREPARING')`,
      [tenantId]
    );

    const kitchenLoad = parseInt(loadResult.rows[0]?.active_orders || "0");

    // 4. Apply kitchen load multiplier
    // Each active order adds 10% delay (capped at 50% total)
    const loadMultiplier = 1 + Math.min(kitchenLoad * 0.1, 0.5);

    // 5. Calculate final ETA
    const finalETA = Math.ceil(baseTime * loadMultiplier);

    console.log(`[Chef ETA] Base: ${baseTime}min, Load: ${kitchenLoad} orders, Final: ${finalETA}min`);

    return finalETA;
  } catch (error) {
    console.error("[Chef ETA Calculator] Error:", error);
    return 25; // Fallback default
  }
}

/**
 * Update order status and recalculate ETA
 * Called when chef marks order as PREPARING or READY
 */
export async function updateOrderETA(
  tenantId: string,
  orderId: string,
  newStatus: string
): Promise<void> {
  if (newStatus === "PREPARING") {
    // Recalculate ETA based on actual start time
    await query(
      `UPDATE chef_orders
       SET status = $1, started_at = NOW(), updated_at = NOW()
       WHERE waiter_order_id = $2 AND tenant_id = $3`,
      [newStatus, orderId, tenantId]
    );
  } else if (newStatus === "READY") {
    // Set ETA to 0
    await query(
      `UPDATE chef_orders
       SET status = $1, eta_minutes = 0, completed_at = NOW(), updated_at = NOW()
       WHERE waiter_order_id = $2 AND tenant_id = $3`,
      [newStatus, orderId, tenantId]
    );
  }
}
