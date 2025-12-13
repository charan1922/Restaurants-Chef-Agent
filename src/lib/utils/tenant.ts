import { NextRequest } from "next/server";

/**
 * Server-side utility to extract tenant ID from request
 * Reads from middleware-injected header with fallback to environment variable
 */
export function getTenantId(request: NextRequest): string | null {
  return request.headers.get('x-tenant-id') || process.env.TENANT_ID || null;
}

/**
 * Server-side utility to extract tenant name from request
 */
export function getTenantName(request: NextRequest): string {
  return request.headers.get('x-tenant-name') || process.env.TENANT_NAME || 'Restaurant';
}
