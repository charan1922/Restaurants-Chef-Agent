"use client";

import { createContext, useContext, ReactNode } from "react";
import { Tenant, getTenantFromHost, getDefaultTenant } from "@/lib/tenants/registry";

interface TenantContextProps {
    tenant: Tenant;
}

const TenantContext = createContext<TenantContextProps>({
    tenant: getDefaultTenant()
});

export const TenantProvider = ({ children }: { children: ReactNode }) => {
    // In the browser we can read window.location.host
    const host = typeof window !== "undefined" ? window.location.host : "";

    // Get tenant from host or use default
    const tenant = getTenantFromHost(host) ?? getDefaultTenant();

    return (
        <TenantContext.Provider value={{ tenant }}>
            {children}
        </TenantContext.Provider>
    );
};

export const useTenant = () => {
    const ctx = useContext(TenantContext);
    if (!ctx) {
        throw new Error("useTenant must be used within TenantProvider");
    }
    return ctx;
};
