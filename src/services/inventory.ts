import { query } from "@/lib/db/postgres";
import type { OrderItem } from "@/lib/a2a/schema";

interface AvailabilityCheck {
  available: boolean;
  missingIngredients: string[];
}

/**
 * Check if all ingredients are available for the order
 */
export async function checkIngredientAvailability(
  tenantId: string,
  items: OrderItem[]
): Promise<AvailabilityCheck> {
  const missingIngredients: string[] = [];

  for (const item of items) {
    // Get recipe for this menu item
    const recipeResult = await query(
      `SELECT r.ingredient_id, r.quantity_required, i.name, i.current_stock
       FROM recipes r
       JOIN ingredients i ON r.ingredient_id = i.id
       WHERE r.tenant_id = $1 AND r.menu_item_id = $2`,
      [tenantId, item.itemId]
    );

    if (recipeResult.rows.length === 0) {
      console.warn(`[Chef Inventory] No recipe found for item ${item.itemId}`);
      continue;
    }

    // Check each ingredient
    for (const ingredient of recipeResult.rows) {
      const requiredQty = parseFloat(ingredient.quantity_required) * item.quantity;
      const availableStock = parseFloat(ingredient.current_stock);

      if (availableStock < requiredQty) {
        missingIngredients.push(
          `${ingredient.name} (need ${requiredQty}, have ${availableStock})`
        );
      }
    }
  }

  return {
    available: missingIngredients.length === 0,
    missingIngredients,
  };
}

/**
 * Deduct inventory for an order
 * Also creates audit trail in inventory_transactions
 */
export async function deductInventory(
  tenantId: string,
  orderId: string,
  items: OrderItem[]
): Promise<void> {
  for (const item of items) {
    // Get recipe
    const recipeResult = await query(
      `SELECT r.ingredient_id, r.quantity_required, i.name
       FROM recipes r
       JOIN ingredients i ON r.ingredient_id = i.id
       WHERE r.tenant_id = $1 AND r.menu_item_id = $2`,
      [tenantId, item.itemId]
    );

    // Deduct each ingredient
    for (const ingredient of recipeResult.rows) {
      const deductQty = parseFloat(ingredient.quantity_required) * item.quantity;

      // Update stock
      await query(
        `UPDATE ingredients
         SET current_stock = current_stock - $1, updated_at = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [deductQty, ingredient.ingredient_id, tenantId]
      );

      // Create transaction record (audit trail)
      await query(
        `INSERT INTO inventory_transactions
         (tenant_id, ingredient_id, transaction_type, quantity, related_order_id, notes, created_by)
         VALUES ($1, $2, 'deduction', $3, 
                 (SELECT id FROM chef_orders WHERE waiter_order_id = $4 AND tenant_id = $1),
                 $5, 'chef_agent')`,
        [
          tenantId,
          ingredient.ingredient_id,
          -deductQty, // Negative for deduction
          orderId,
          `Deducted for order ${orderId}: ${item.itemName} x${item.quantity}`,
        ]
      );

      console.log(`[Chef Inventory] Deducted ${deductQty} ${ingredient.name} for order ${orderId}`);
    }
  }

  // Check for low stock and trigger procurement if needed
  await checkAndTriggerProcurement(tenantId);
}

/**
 * Check for ingredients below reorder point and create purchase orders
 */
async function checkAndTriggerProcurement(tenantId: string): Promise<void> {
  const lowStockResult = await query(
    `SELECT id, name, current_stock, reorder_point, unit, supplier
     FROM ingredients
     WHERE tenant_id = $1 AND current_stock < reorder_point`,
    [tenantId]
  );

  for (const ingredient of lowStockResult.rows) {
    // Check if PO already exists
    const existingPO = await query(
      `SELECT id FROM purchase_orders
       WHERE tenant_id = $1 AND ingredient_id = $2 AND status = 'pending'`,
      [tenantId, ingredient.id]
    );

    if (existingPO.rows.length > 0) {
      console.log(`[Chef Procurement] PO already exists for ${ingredient.name}`);
      continue;
    }

    // Create new purchase order
    const orderQty = parseFloat(ingredient.reorder_point) * 2; // Order 2x reorder point
    
    await query(
      `INSERT INTO purchase_orders
       (tenant_id, ingredient_id, quantity, supplier, status)
       VALUES ($1, $2, $3, $4, 'pending')`,
      [tenantId, ingredient.id, orderQty, ingredient.supplier]
    );

    console.log(`[Chef Procurement] 🛒 Created PO for ${orderQty} ${ingredient.unit} of ${ingredient.name}`);
  }
}

/**
 * Get current stock level for an ingredient
 */
export async function getStockLevel(
  tenantId: string,
  ingredientId: string
): Promise<number> {
  const result = await query(
    `SELECT current_stock FROM ingredients
     WHERE id = $1 AND tenant_id = $2`,
    [ingredientId, tenantId]
  );

  if (result.rows.length === 0) {
    throw new Error(`Ingredient ${ingredientId} not found`);
  }

  return parseFloat(result.rows[0].current_stock);
}
