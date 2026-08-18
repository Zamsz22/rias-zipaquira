import type { Metadata } from "next";
import { Geist, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import "driver.js/dist/driver.css";
import { AppShell } from "@/components/app-shell";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Plataforma RIAS Zipaquirá 2026",
  description:
    "Plataforma Integral de Seguimiento RIAS y Gestión del Riesgo en Salud — Secretaría de Salud de Zipaquirá.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${geistSans.variable} ${jakarta.variable} antialiased`}>
      {/* suppressHydrationWarning: algunas extensiones del navegador inyectan
          atributos en <body> antes de la hidratación de React. */}
      <body suppressHydrationWarning className="overflow-x-clip">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
