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
export async function POST(request: NextRequest) {
  try {
    // Extract tenant from headers or environment
    const tenantId = getTenantId(request);
    
    if (!tenantId) {
      return NextResponse.json(
        {
          success: false,
          error: "Tenant ID missing - multi-tenant routing failed",
        } as ChefAgentResponse,
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
          success: false,
          error: `Invalid message format: ${parsed.error.message}`,
        } as ChefAgentResponse,
        { status: 400 }
      );
    }

    const message: ChefAgentRequest = parsed.data;

    console.log(`[Chef Agent] 📥 Received ${message.type} from Waiter (Tenant: ${tenantId})`);

    // Route to appropriate handler
    let response: ChefAgentResponse;

    switch (message.type) {
      case "PLACE_ORDER":
        if ("orderId" in message.payload && "tableId" in message.payload) {
          response = await handlePlaceOrder(tenantId, message.payload);
        } else {
          response = {
            success: false,
            error: "Invalid PLACE_ORDER payload",
          };
        }
        break;

      case "REQUEST_STATUS":
        if ("orderId" in message.payload) {
          response = await handleRequestStatus(tenantId, message.payload.orderId);
        } else {
          response = {
            success: false,
            error: "Invalid REQUEST_STATUS payload - orderId required",
          };
        }
        break;

      case "CANCEL_ORDER":
        if ("orderId" in message.payload) {
          response = await handleCancelOrder(tenantId, message.payload.orderId);
        } else {
          response = {
            success: false,
            error: "Invalid CANCEL_ORDER payload - orderId required",
          };
        }
        break;

      default:
        response = {
          success: false,
          error: `Unknown message type: ${message.type}`,
        };
    }

    // Log response
    if (response.success) {
      console.log(`[Chef Agent] ✅ ${message.type} processed successfully`);
    } else {
      console.error(`[Chef Agent] ❌ ${message.type} failed:`, response.error);
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Chef Agent] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      } as ChefAgentResponse,
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
