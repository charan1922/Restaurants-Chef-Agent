import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { getTenantId } from "@/lib/utils/tenant";

/**
 * GET /api/inventory/alerts
 * Fetch low stock alerts for the current tenant
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = getTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID missing" },
        { status: 400 }
      );
    }

    // Get ingredients below reorder point
    const result = await query(
      `SELECT name, current_stock, reorder_point, unit
       FROM ingredients
       WHERE tenant_id = $1 AND current_stock < reorder_point
       ORDER BY (reorder_point - current_stock) DESC
       LIMIT 10`,
      [tenantId]
    );

    const alerts = result.rows.map((row) => ({
      ingredientName: row.name,
      currentStock: parseFloat(row.current_stock),
      reorderPoint: parseFloat(row.reorder_point),
      unit: row.unit,
    }));

    return NextResponse.json({
      success: true,
      alerts,
    });
  } catch (error) {
    console.error("[Chef API] Error fetching inventory alerts:", error);
    return NextResponse.json({
      success: true,
      alerts: [], // Return empty on error to not block UI
    });
  }
}
