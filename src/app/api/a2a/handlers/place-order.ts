import { query } from "@/lib/db/postgres";
import type { Order, ChefAgentResponse, OrderStatusResponse } from "@/lib/a2a/schema";
import { calculateETA } from "@/services/eta-calculator";
import { calculateCOGS } from "@/services/cost-calculator";
import { deductInventory, checkIngredientAvailability } from "@/services/inventory";

/**
 * Handle PLACE_ORDER message from Waiter Agent
 * 1. Validate ingredients available
 * 2. Calculate ETA
 * 3. Calculate COGS
 * 4. Create chef_order record
 * 5. Deduct inventory
 * 6. Return status with ETA
 */
export async function handlePlaceOrder(
  tenantId: string,
  order: Order
): Promise<ChefAgentResponse> {
  try {
    console.log(`[Chef handlePlaceOrder] Processing order ${order.orderId} for tenant ${tenantId}`);

    // 1. Check ingredient availability
    const availabilityCheck = await checkIngredientAvailability(tenantId, order.items);
    
    if (!availabilityCheck.available) {
      return {
        success: false,
        error: `Missing ingredients: ${availabilityCheck.missingIngredients.join(", ")}`,
        data: {
          orderId: order.orderId,
          status: "CANCELLED",
          missingIngredients: availabilityCheck.missingIngredients,
          message: "Cannot fulfill order - insufficient stock",
        } as OrderStatusResponse,
      };
    }

    // 2. Calculate ETA based on items and kitchen load
    const eta = await calculateETA(tenantId, order.items);

    // 3. Calculate Cost of Goods Sold
    const totalCOGS = await calculateCOGS(tenantId, order.items);

    // 4. Create chef_order record
    const result = await query(
      `INSERT INTO chef_orders 
       (waiter_order_id, tenant_id, items, status, priority, eta_minutes, total_cogs, started_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW(), NOW())
       RETURNING id, status, eta_minutes`,
      [
        order.orderId,
        tenantId,
        JSON.stringify(order.items),
        "CONFIRMED",
        order.priority || "normal",
        eta,
        totalCOGS,
      ]
    );

    const chefOrder = result.rows[0];

    // 5. Deduct inventory for this order
    await deductInventory(tenantId, order.orderId, order.items);

    console.log(`[Chef handlePlaceOrder] ✅ Order ${order.orderId} confirmed, ETA: ${eta}min, COGS: ₹${totalCOGS}`);

    // 6. Return success response
    return {
      success: true,
      data: {
        orderId: order.orderId,
        status: "CONFIRMED",
        eta: eta,
        message: `Order confirmed. Estimated preparation time: ${eta} minutes`,
      } as OrderStatusResponse,
    };
  } catch (error) {
    console.error("[Chef handlePlaceOrder] Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to process order",
    };
  }
}
