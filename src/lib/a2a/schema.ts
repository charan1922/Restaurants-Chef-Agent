import { z } from "zod";

// ============================================================================
// Shared Schema for Chef-Waiter Communication
// ============================================================================

/**
 * Order Item Schema
 * Represents a single menu item in an order
 */
export const OrderItemSchema = z.object({
  itemId: z.string(),
  itemName: z.string(),
  quantity: z.number().int().positive(),
  modifications: z.array(z.string()).optional(), // e.g., ["no onions", "extra cheese"]
  specialInstructions: z.string().optional(),
});

export type OrderItem = z.infer<typeof OrderItemSchema>;

/**
 * Order Status Enum
 */
export const OrderStatus = z.enum([
  "PENDING",
  "CONFIRMED",
  "PREPARING",
  "READY",
  "SERVED",
  "CANCELLED",
]);

export type OrderStatusType = z.infer<typeof OrderStatus>;

/**
 * Complete Order Schema
 * Sent from Waiter to Chef
 */
export const OrderSchema = z.object({
  orderId: z.string().uuid(),
  tableId: z.string(),
  items: z.array(OrderItemSchema),
  timestamp: z.string().datetime(),
  priority: z.enum(["normal", "high", "urgent"]).default("normal"),
});

export type Order = z.infer<typeof OrderSchema>;

/**
 * Order Status Response Schema
 * Sent from Chef to Waiter
 */
export const OrderStatusResponseSchema = z.object({
  orderId: z.string().uuid(),
  status: OrderStatus,
  eta: z.number().optional(), // Estimated time in minutes
  message: z.string().optional(),
  completedItems: z.array(z.string()).optional(),
  missingIngredients: z.array(z.string()).optional(), // Ingredients not in stock
});

export type OrderStatusResponse = z.infer<typeof OrderStatusResponseSchema>;

/**
 * JSON-RPC 2.0 Request Schema
 */
export const JsonRpcRequestSchema = z.object({
  jsonrpc: z.literal("2.0"),
  method: z.string(),
  params: z.any().optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

export type JsonRpcRequest = z.infer<typeof JsonRpcRequestSchema>;

/**
 * JSON-RPC 2.0 Response Schema
 */
export const JsonRpcResponseSchema = z.object({
  jsonrpc: z.literal("2.0"),
  result: z.any().optional(),
  error: z.object({
    code: z.number(),
    message: z.string(),
    data: z.any().optional(),
  }).optional(),
  id: z.union([z.string(), z.number(), z.null()]),
});

export type JsonRpcResponse = z.infer<typeof JsonRpcResponseSchema>;

// Export aliases for backward compatibility (during refactor)
export type ChefAgentRequest = JsonRpcRequest;
export type ChefAgentResponse = JsonRpcResponse;
export const ChefAgentRequestSchema = JsonRpcRequestSchema;
export const ChefAgentResponseSchema = JsonRpcResponseSchema;
