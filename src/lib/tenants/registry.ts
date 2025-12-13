export interface Tenant {
  id: string;
  name: string;
  host: string;
  themeColor: string;
}

export const TENANTS: Tenant[] = [
  {
    id: "tenant-chutneys",
    name: "Chutneys Kitchen",
    host: "chutneys.chef.local:5555",
    themeColor: "#16a34a", // Green
  },
  {
    id: "tenant-pista-house",
    name: "Pista House Kitchen",
    host: "pistahouse.chef.local:5555",
    themeColor: "#dc2626", // Red
  },
];

export const getTenantFromHost = (host: string): Tenant | undefined =>
  TENANTS.find((t) => t.host === host);

export const getTenantById = (id: string): Tenant | undefined =>
  TENANTS.find((t) => t.id === id);

export const getDefaultTenant = (): Tenant => TENANTS[1]; // Pista House as default
