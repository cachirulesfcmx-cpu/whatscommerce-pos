import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { PWARegister } from "@/components/pwa-register";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "WhatsCommerce POS — Tu tienda online sincronizada con WhatsApp",
    template: "%s · WhatsCommerce",
  },
  description:
    "Crea tu catálogo online, recibe pedidos por WhatsApp y gestiona tu negocio con un POS profesional. Empieza gratis.",
  manifest: "/manifest.webmanifest",
  applicationName: "WhatsCommerce POS",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "WhatsCommerce" },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#16a34a" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0f17" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
