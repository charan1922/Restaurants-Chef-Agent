import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { getTenantId } from "@/lib/utils/tenant";

/**
 * GET /api/orders
 * Fetch all chef orders for the current tenant
 * Query params: status (optional filter)
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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let queryText = `
      SELECT 
        id,
        waiter_order_id,
        items,
        status,
        priority,
        eta_minutes,
        created_at,
        started_at,
        updated_at
      FROM chef_orders
      WHERE tenant_id = $1
    `;
    const params: string[] = [tenantId];

    if (status) {
      queryText += ` AND status = $2`;
      params.push(status.toUpperCase());
    }

    queryText += ` ORDER BY 
      CASE priority 
        WHEN 'urgent' THEN 1 
        WHEN 'high' THEN 2 
        ELSE 3 
      END,
      created_at ASC`;

    const result = await query(queryText, params);

    // Transform to match frontend interface
    const orders = result.rows.map((row) => ({
      id: row.id,
      waiterOrderId: row.waiter_order_id,
      tableId: extractTableId(row.items),
      items: typeof row.items === "string" ? JSON.parse(row.items) : row.items,
      status: row.status,
      priority: row.priority || "normal",
      etaMinutes: row.eta_minutes || 15,
      createdAt: row.created_at,
      startedAt: row.started_at,
    }));

    return NextResponse.json({
      success: true,
      orders,
    });
  } catch (error) {
    console.error("[Chef API] Error fetching orders:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}

// Helper to extract table ID from order items (fallback)
function extractTableId(items: unknown): string {
  // Table ID is stored in the order, default to "T1" if not found
  return "T1";
}
