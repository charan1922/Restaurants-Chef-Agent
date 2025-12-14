import { NextRequest, NextResponse } from "next/server";
import { getTenantId } from "@/lib/utils/tenant";
import {
  ChefAgentRequestSchema,
  type ChefAgentRequest,
  type ChefAgentResponse,
} from "@/lib/a2a/schema";
import { handlePlaceOrder } from "./handlers/place-order";
import { handleRequestStatus } from "./handlers/request-status";
import { handleCancelOrder } from "./handlers/cancel-order";

/**
 * POST /api/a2a
 * A2A message handler for Chef Agent
 * Receives messages from Waiter Agent
 */
/**
 * POST /api/a2a
 * A2A message handler for Chef Agent (JSON-RPC 2.0)
 * Receives messages from Waiter Agent
 */
export async function POST(request: NextRequest) {
  try {
    // Extract tenant from headers or environment
    const tenantId = getTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: { code: -32600, message: "Tenant ID missing - multi-tenant routing failed" },
          id: null
        },
        { status: 400 }
      );
    }

    // Parse and validate A2A message
    const body = await request.json();
    const parsed = ChefAgentRequestSchema.safeParse(body);

    if (!parsed.success) {
      console.error("[Chef Agent] Invalid A2A message:", parsed.error);
      return NextResponse.json(
        {
          jsonrpc: "2.0",
          error: { code: -32600, message: `Invalid Request: ${parsed.error.message}` },
          id: null
        },
        { status: 400 }
      );
    }

    const message = parsed.data;
    const { method, params, id } = message;

    console.log(`[Chef Agent] 📥 Received ${method} from Waiter (Tenant: ${tenantId})`);

    // Route to appropriate handler
    let result: any;
    let error: any;

    try {
      switch (method) {
        case "placeOrder":
          // Validate params matches OrderSchema structure roughly
          if (params && params.orderId && params.items) {
            result = await handlePlaceOrder(tenantId, params);
          } else {
            throw new Error("Invalid params for placeOrder");
          }
          break;

        case "getOrderStatus":
          if (params && params.orderId) {
            result = await handleRequestStatus(tenantId, params.orderId);
          } else {
            throw new Error("Invalid params for getOrderStatus");
          }
          break;

        case "cancelOrder":
          if (params && params.orderId) {
            await handleCancelOrder(tenantId, params.orderId);
            result = {}; // Void return
          } else {
            throw new Error("Invalid params for cancelOrder");
          }
          break;

        default:
          throw new Error(`Method not found: ${method}`);
      }
    } catch (e: any) {
      error = {
        code: -32603,
        message: e.message || "Internal RPC Error"
      };
    }

    // Log response
    if (!error) {
      console.log(`[Chef Agent] ✅ ${method} processed successfully`);
      return NextResponse.json({
        jsonrpc: "2.0",
        result,
        id
      });
    } else {
      console.error(`[Chef Agent] ❌ ${method} failed:`, error.message);
      return NextResponse.json({
        jsonrpc: "2.0",
        error,
        id
      });
    }

  } catch (error) {
    console.error("[Chef Agent] Unhandled error:", error);
    return NextResponse.json(
      {
        jsonrpc: "2.0",
        error: { code: -32603, message: error instanceof Error ? error.message : "Internal server error" },
        id: null
      },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, x-tenant-id",
      },
    }
  );
}

/**
 * GET handler for health check
 */
export async function GET() {
  return NextResponse.json({
    status: "healthy",
    agent: "chef-agent",
    timestamp: new Date().toISOString(),
  });
}
