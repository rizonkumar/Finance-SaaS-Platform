import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryProvider } from "@/providers/query-provider";
import { SheetProvider } from "@/providers/sheet-provider";
import { ThemeProvider } from "@/providers/theme-provider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Fintrack — Personal Finance",
  description:
    "Track accounts, categorise transactions, plan budgets and automate recurring entries.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/">
      <html
        lang="en"
        className={`${GeistSans.variable} ${GeistMono.variable}`}
        suppressHydrationWarning
      >
        <body>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TooltipProvider delayDuration={150}>
              <QueryProvider>
                <SheetProvider />
                <Toaster />
                {children}
              </QueryProvider>
            </TooltipProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
