"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useTenant } from "./TenantContext";

interface Theme {
    primaryColor: string;
    tenantName: string;
}

interface ThemeContextType {
    theme: Theme;
    loading: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const { tenant } = useTenant();

    const [theme, setTheme] = useState<Theme>({
        primaryColor: tenant.themeColor,
        tenantName: tenant.name
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Apply CSS variable for primary color
        document.documentElement.style.setProperty('--primary', tenant.themeColor);
        document.documentElement.style.setProperty('--ring', tenant.themeColor);
        document.documentElement.style.setProperty('--kitchen-accent', tenant.themeColor);

        setTheme({
            primaryColor: tenant.themeColor,
            tenantName: tenant.name
        });
    }, [tenant]);

    return (
        <ThemeContext.Provider value={{ theme, loading }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error("useTheme must be used within a ThemeProvider");
    }
    return context;
}
