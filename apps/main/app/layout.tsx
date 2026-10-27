import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import { ThemeProvider } from "@repo/ui/theme-provider";
import "./globals.css";
import { MAIN_BRAND } from "../lib/brand";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  title: MAIN_BRAND.name,
  description: MAIN_BRAND.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <ThemeProvider>{children}</ThemeProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
