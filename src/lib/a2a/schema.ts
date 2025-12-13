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
 * Chef Agent Message Types
 */
export const ChefMessageType = z.enum([
  "PLACE_ORDER",
  "REQUEST_STATUS",
  "CANCEL_ORDER",
]);

export type ChefMessageTypeValue = z.infer<typeof ChefMessageType>;

/**
 * Chef Agent Request
 */
export const ChefAgentRequestSchema = z.object({
  type: ChefMessageType,
  payload: z.union([
    OrderSchema,
    z.object({ orderId: z.string().uuid() }),
  ]),
});

export type ChefAgentRequest = z.infer<typeof ChefAgentRequestSchema>;

/**
 * Chef Agent Response
 */
export const ChefAgentResponseSchema = z.object({
  success: z.boolean(),
  data: z.union([OrderStatusResponseSchema, z.object({})]).optional(),
  error: z.string().optional(),
});

export type ChefAgentResponse = z.infer<typeof ChefAgentResponseSchema>;
