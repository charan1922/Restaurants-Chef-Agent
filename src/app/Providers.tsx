"use client";

import { TenantProvider } from "@/contexts/TenantContext";
import { ThemeProvider } from "@/contexts/ThemeContext";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <TenantProvider>
            <ThemeProvider>
                {children}
            </ThemeProvider>
        </TenantProvider>
    );
}
