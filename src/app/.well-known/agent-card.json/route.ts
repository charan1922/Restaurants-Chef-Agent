import { NextResponse } from "next/server";

/**
 * GET /.well-known/agent-card.json
 * A2A Agent Card for Chef Agent discovery
 * 
 * This endpoint allows other agents (like Waiter) to discover
 * the Chef Agent's capabilities and how to communicate with it.
 */
export async function GET() {
  const agentCard = {
    name: "Chef Agent",
    description: "Kitchen management agent for order preparation, inventory tracking, and ETA calculation",
    version: "1.0.0",
    url: process.env.CHEF_AGENT_URL || "http://localhost:5555",
    
    // A2A Protocol capabilities
    capabilities: {
      messages: ["PLACE_ORDER", "REQUEST_STATUS", "CANCEL_ORDER"],
      streaming: false,
    },
    
    // Endpoints
    endpoints: {
      a2a: "/api/a2a",
      health: "/api/a2a",
    },
    
    // Message schemas
    schemas: {
      PLACE_ORDER: {
        description: "Place a new order with the kitchen",
        payload: {
          orderId: "string (UUID)",
          tableId: "string",
          items: [
            {
              itemId: "string",
              itemName: "string",
              quantity: "number",
              modifications: "string[] (optional)",
              specialInstructions: "string (optional)",
            },
          ],
          timestamp: "string (ISO datetime)",
          priority: "normal | high | urgent",
        },
        response: {
          orderId: "string (UUID)",
          status: "CONFIRMED | CANCELLED",
          eta: "number (minutes)",
          message: "string",
          missingIngredients: "string[] (if cancelled)",
        },
      },
      REQUEST_STATUS: {
        description: "Get the current status of an order",
        payload: {
          orderId: "string (UUID)",
        },
        response: {
          orderId: "string (UUID)",
          status: "PENDING | CONFIRMED | PREPARING | READY | SERVED | CANCELLED",
          eta: "number (minutes remaining)",
          message: "string",
        },
      },
      CANCEL_ORDER: {
        description: "Cancel an order if it hasn't been completed",
        payload: {
          orderId: "string (UUID)",
        },
        response: {
          success: "boolean",
          error: "string (if failed)",
        },
      },
    },
    
    // Authentication
    authentication: {
      type: "header",
      header: "x-tenant-id",
      description: "Tenant ID for multi-tenant isolation",
    },
    
    // Metadata
    metadata: {
      owner: "Restaurant Kitchen",
      contact: "chef@restaurant.local",
      documentation: "https://github.com/restaurant/chef-agent",
    },
  };

  return NextResponse.json(agentCard, {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
