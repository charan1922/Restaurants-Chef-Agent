import { query } from "@/lib/db/postgres";
import type { OrderItem } from "@/lib/a2a/schema";

/**
 * Calculate Cost of Goods Sold (COGS) for an order
 * 
 * COGS = Sum of (ingredient_cost * quantity) for all items
 * 
 * This helps track:
 * - Profit margin per order
 * - Most/least profitable dishes
 * - Pricing strategy validation
 * 
 * @returns Total COGS in INR
 */
export async function calculateCOGS(
  tenantId: string,
  items: OrderItem[]
): Promise<number> {
  let totalCOGS = 0;

  try {
    for (const item of items) {
      // Get all ingredients for this menu item with their costs
      const result = await query(
        `SELECT r.quantity_required, i.unit_cost
         FROM recipes r
         JOIN ingredients i ON r.ingredient_id = i.id
         WHERE r.tenant_id = $1 AND r.menu_item_id = $2`,
        [tenantId, item.itemId]
      );

      if (result.rows.length === 0) {
        console.warn(`[Chef COGS] No recipe found for item ${item.itemId}, skipping cost calculation`);
        continue;
      }

      // Calculate cost for this item
      let itemCost = 0;
      for (const ingredient of result.rows) {
        const ingredientCost =
          parseFloat(ingredient.quantity_required) *
          parseFloat(ingredient.unit_cost);
        itemCost += ingredientCost;
      }

      // Multiply by quantity ordered
      const itemTotalCost = itemCost * item.quantity;
      totalCOGS += itemTotalCost;

      console.log(`[Chef COGS] ${item.itemName} x${item.quantity}: ₹${itemTotalCost.toFixed(2)}`);
    }

    console.log(`[Chef COGS] Total for order: ₹${totalCOGS.toFixed(2)}`);
    return parseFloat(totalCOGS.toFixed(2));
  } catch (error) {
    console.error("[Chef COGS Calculator] Error:", error);
    return 0;
  }
}

/**
 * Get COGS breakdown by item for analytics
 */
export async function getCOGSBreakdown(
  tenantId: string,
  items: OrderItem[]
): Promise<
  Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    cogs: number;
  }>
> {
  const breakdown: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
    cogs: number;
  }> = [];

  for (const item of items) {
    const result = await query(
      `SELECT r.quantity_required, i.unit_cost
       FROM recipes r
       JOIN ingredients i ON r.ingredient_id = i.id
       WHERE r.tenant_id = $1 AND r.menu_item_id = $2`,
      [tenantId, item.itemId]
    );

    let itemCost = 0;
    for (const ingredient of result.rows) {
      itemCost +=
        parseFloat(ingredient.quantity_required) *
        parseFloat(ingredient.unit_cost);
    }

    breakdown.push({
      itemId: item.itemId,
      itemName: item.itemName,
      quantity: item.quantity,
      cogs: itemCost * item.quantity,
    });
  }

  return breakdown;
}

/**
 * Calculate profit margin for an order
 * Margin = ((Price - COGS) / Price) * 100
 */
export async function calculateProfitMargin(
  tenantId: string,
  items: OrderItem[]
): Promise<{
  totalRevenue: number;
  totalCOGS: number;
  profitMargin: number;
}> {
  const cogs = await calculateCOGS(tenantId, items);

  // Get selling prices
  let totalRevenue = 0;
  for (const item of items) {
    const result = await query(
      `SELECT price FROM menu_items
       WHERE tenant_id = $1 AND id = $2`,
      [tenantId, item.itemId]
    );

    if (result.rows.length > 0) {
      totalRevenue += parseFloat(result.rows[0].price) * item.quantity;
    }
  }

  const profitMargin =
    totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue) * 100 : 0;

  return {
    totalRevenue: parseFloat(totalRevenue.toFixed(2)),
    totalCOGS: cogs,
    profitMargin: parseFloat(profitMargin.toFixed(2)),
  };
}
