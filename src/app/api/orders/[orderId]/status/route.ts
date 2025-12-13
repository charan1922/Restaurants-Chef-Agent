import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db/postgres";
import { getTenantId } from "@/lib/utils/tenant";

interface RouteParams {
  params: Promise<{ orderId: string }>;
}

/**
 * PATCH /api/orders/[orderId]/status
 * Update the status of a chef order
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const tenantId = getTenantId(request);
    const { orderId } = await params;
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: "Tenant ID missing" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { status } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "Status is required" },
        { status: 400 }
      );
    }

    const validStatuses = ["PENDING", "CONFIRMED", "PREPARING", "READY", "SERVED", "CANCELLED"];
    if (!validStatuses.includes(status.toUpperCase())) {
      return NextResponse.json(
        { success: false, error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` },
        { status: 400 }
      );
    }

    // Update order status
    let queryText = `
      UPDATE chef_orders
      SET status = $1, updated_at = NOW()
    `;
    const queryParams: (string | null)[] = [status.toUpperCase()];

    // Set started_at when starting preparation
    if (status.toUpperCase() === "PREPARING") {
      queryText = `
        UPDATE chef_orders
        SET status = $1, started_at = NOW(), updated_at = NOW()
      `;
    }

    // Set ETA to 0 when ready
    if (status.toUpperCase() === "READY") {
      queryText = `
        UPDATE chef_orders
        SET status = $1, eta_minutes = 0, completed_at = NOW(), updated_at = NOW()
      `;
    }

    queryText += ` WHERE id = $2 AND tenant_id = $3 RETURNING id, status`;
    queryParams.push(orderId, tenantId);

    const result = await query(queryText, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Order not found" },
        { status: 404 }
      );
    }

    console.log(`[Chef API] ✅ Order ${orderId} status updated to ${status}`);

    return NextResponse.json({
      success: true,
      order: result.rows[0],
    });
  } catch (error) {
    console.error("[Chef API] Error updating order status:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update order status" },
      { status: 500 }
    );
  }
}
