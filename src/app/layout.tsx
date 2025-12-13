import type { Metadata } from "next";
import "./globals.css";
import Providers from "./Providers";

export const metadata: Metadata = {
    title: "Chef Agent - Kitchen Display System",
    description: "Kitchen management and order processing for restaurant operations",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className="dark">
            <body className="min-h-screen bg-background antialiased">
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    );
}
